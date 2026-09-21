import type { Cookies } from '@sveltejs/kit';
import { db, now } from './db.ts';
import { hashPassword, randomToken, sha256, verifyPassword, encryptAtRest, decryptAtRest } from './crypto.ts';
import { verifyTotp } from './totp.ts';
import { rateLimit, rateLimitPeek, rateLimitReset } from './ratelimit.ts';

export const SESSION_COOKIE = 'lfi_session';

const SESSION_TTL_MS = 12 * 3600_000; // inactivité tolérée
const SESSION_MAX_MS = 7 * 24 * 3600_000; // durée de vie absolue

// Verrouillage progressif : 5 échecs par compte et 15 par adresse IP sur 15 min.
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_PER_USER = 5;
const LOGIN_MAX_PER_IP = 15;

export type AdminRow = {
	id: number;
	username: string;
	display_name: string;
	password_hash: string;
	totp_secret: string | null;
	totp_confirmed_at: string | null;
	role: 'admin' | 'owner';
	created_at: string;
	last_login_at: string | null;
	disabled_at: string | null;
	profile_name: string;
	profile_role: string;
	profile_bio: string;
	profile_emoji: string;
	profile_media_id: number | null;
	profile_visible: number;
};

export type AdminSession = {
	id: number;
	username: string;
	displayName: string;
	role: 'admin' | 'owner';
	sessionId: string;
	totpEnabled: boolean;
};

/* ------------------------------------------------------------------ comptes */

export function findAdminByUsername(username: string): AdminRow | undefined {
	return db().prepare('select * from admins where username = ?').get(username.trim().toLowerCase()) as
		| AdminRow
		| undefined;
}

export function listAdmins(): AdminRow[] {
	return db().prepare('select * from admins order by created_at').all() as AdminRow[];
}

export function countAdmins(): number {
	return (db().prepare('select count(*) as n from admins where disabled_at is null').get() as { n: number }).n;
}

export async function createAdmin(opts: {
	username: string;
	displayName: string;
	password: string;
	role?: 'admin' | 'owner';
}): Promise<number> {
	const username = opts.username.trim().toLowerCase();
	if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
		throw new Error("Identifiant invalide : 3 à 32 caractères, lettres minuscules, chiffres, . _ -");
	}
	if (opts.password.length < 12) {
		throw new Error('Le mot de passe doit faire au moins 12 caractères.');
	}
	const result = db()
		.prepare(
			`insert into admins (username, display_name, password_hash, role, created_at)
			 values (?, ?, ?, ?, ?)`
		)
		.run(username, opts.displayName.trim() || username, await hashPassword(opts.password), opts.role ?? 'admin', now());
	return Number(result.lastInsertRowid);
}

export async function setPassword(adminId: number, password: string) {
	if (password.length < 12) throw new Error('Le mot de passe doit faire au moins 12 caractères.');
	db().prepare('update admins set password_hash = ? where id = ?').run(await hashPassword(password), adminId);
}

export function updateProfile(
	adminId: number,
	profile: {
		name: string;
		role: string;
		bio: string;
		emoji: string;
		mediaId: number | null;
		visible: boolean;
	}
) {
	db().prepare(
		`update admins
		 set profile_name = ?, profile_role = ?, profile_bio = ?, profile_emoji = ?,
		     profile_media_id = ?, profile_visible = ?
		 where id = ?`
	).run(
		profile.name.slice(0, 80),
		profile.role.slice(0, 120),
		profile.bio.slice(0, 1200),
		profile.emoji.slice(0, 16),
		profile.mediaId,
		profile.visible ? 1 : 0,
		adminId
	);
}

export function listPublicProfiles() {
	return db().prepare(
		`select a.profile_name as name, a.profile_role as role, a.profile_bio as bio,
		        a.profile_emoji as emoji, m.filename as image
		 from admins a
		 left join media m on m.id = a.profile_media_id
		 where a.profile_visible = 1 and a.disabled_at is null and a.profile_name != ''
		 order by a.created_at`
	).all() as { name: string; role: string; bio: string; emoji: string; image: string | null }[];
}

/* -------------------------------------------------------------------- TOTP */

/** Le secret TOTP est chiffré en base : une fuite du fichier SQLite ne suffit pas. */
export function storeTotpSecret(adminId: number, secretBase32: string) {
	db().prepare('update admins set totp_secret = ?, totp_confirmed_at = null where id = ?').run(
		encryptAtRest(secretBase32),
		adminId
	);
}

export function readTotpSecret(admin: AdminRow): string | null {
	return admin.totp_secret ? decryptAtRest(admin.totp_secret) : null;
}

export function confirmTotp(adminId: number) {
	db().prepare('update admins set totp_confirmed_at = ? where id = ?').run(now(), adminId);
}

/* ---------------------------------------------------------------- sessions */

export function createSession(adminId: number, ipHash: string, userAgent: string): string {
	const token = randomToken(32);
	db().prepare(
		`insert into sessions (id, admin_id, created_at, expires_at, ip_hash, user_agent)
		 values (?, ?, ?, ?, ?, ?)`
	).run(
		sha256(token),
		adminId,
		now(),
		new Date(Date.now() + SESSION_TTL_MS).toISOString(),
		ipHash,
		userAgent.slice(0, 200)
	);
	return token;
}

/**
 * Retrouve l'admin à partir du cookie. Le cookie contient un jeton aléatoire ;
 * la base ne stocke que son SHA-256, donc un accès en lecture à la base ne
 * permet pas de fabriquer un cookie valide.
 */
export function resolveSession(token: string | undefined): AdminSession | null {
	if (!token) return null;
	const id = sha256(token);
	const row = db()
		.prepare(
			`select s.id as session_id, s.created_at as session_created, s.expires_at,
			        a.id, a.username, a.display_name, a.role, a.disabled_at, a.totp_confirmed_at
			 from sessions s join admins a on a.id = s.admin_id
			 where s.id = ?`
		)
		.get(id) as
		| {
				session_id: string;
				session_created: string;
				expires_at: string;
				id: number;
				username: string;
				display_name: string;
				role: 'admin' | 'owner';
				disabled_at: string | null;
				totp_confirmed_at: string | null;
		  }
		| undefined;

	if (!row) return null;

	const expired = Date.parse(row.expires_at) < Date.now();
	const tooOld = Date.parse(row.session_created) + SESSION_MAX_MS < Date.now();
	if (expired || tooOld || row.disabled_at) {
		db().prepare('delete from sessions where id = ?').run(id);
		return null;
	}

	// Prolongation glissante, au plus une fois par heure pour limiter les écritures.
	if (Date.parse(row.expires_at) - Date.now() < SESSION_TTL_MS - 3600_000) {
		db().prepare('update sessions set expires_at = ? where id = ?').run(
			new Date(Date.now() + SESSION_TTL_MS).toISOString(),
			id
		);
	}

	return {
		id: row.id,
		username: row.username,
		displayName: row.display_name,
		role: row.role,
		sessionId: id,
		totpEnabled: !!row.totp_confirmed_at
	};
}

export function destroySession(sessionId: string) {
	db().prepare('delete from sessions where id = ?').run(sessionId);
}

/** Déconnecte un admin de partout (changement de mot de passe, compte compromis). */
export function destroyAllSessions(adminId: number) {
	db().prepare('delete from sessions where admin_id = ?').run(adminId);
}

export function listSessions(adminId: number) {
	return db()
		.prepare('select id, created_at, expires_at, user_agent from sessions where admin_id = ? order by created_at desc')
		.all(adminId) as { id: string; created_at: string; expires_at: string; user_agent: string }[];
}

export function setSessionCookie(cookies: Cookies, token: string, secure: boolean) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: Math.floor(SESSION_MAX_MS / 1000)
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/* ------------------------------------------------------------------ login */

export type LoginResult =
	| { ok: true; admin: AdminRow }
	| { ok: false; reason: 'invalid' | 'locked' | 'disabled'; retryAfterSec?: number };

// Empreinte factice : sert à consommer le même temps de calcul quand
// l'identifiant n'existe pas, pour ne pas révéler les comptes valides.
const DUMMY_HASH = 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

/**
 * Connexion en une seule étape : identifiant + mot de passe + code TOTP.
 * Un formulaire unique évite de révéler qu'un mot de passe était correct
 * avant de demander le second facteur.
 */
export async function login(
	username: string,
	password: string,
	totpCode: string,
	ipHash: string
): Promise<LoginResult> {
	const userBucket = `login:user:${username.trim().toLowerCase()}`;
	const ipBucket = `login:ip:${ipHash}`;

	const userGate = rateLimitPeek(userBucket, LOGIN_MAX_PER_USER, LOGIN_WINDOW_MS);
	const ipGate = rateLimitPeek(ipBucket, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS);
	if (!userGate.ok || !ipGate.ok) {
		return {
			ok: false,
			reason: 'locked',
			retryAfterSec: Math.max(userGate.retryAfterSec, ipGate.retryAfterSec)
		};
	}

	const fail = (reason: 'invalid' | 'disabled'): LoginResult => {
		rateLimit(userBucket, LOGIN_MAX_PER_USER, LOGIN_WINDOW_MS);
		rateLimit(ipBucket, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS);
		return { ok: false, reason };
	};

	const admin = findAdminByUsername(username);
	if (!admin) {
		await verifyPassword(password, DUMMY_HASH);
		return fail('invalid');
	}
	if (admin.disabled_at) {
		await verifyPassword(password, DUMMY_HASH);
		return fail('disabled');
	}
	if (!(await verifyPassword(password, admin.password_hash))) return fail('invalid');

	// La double authentification est obligatoire dès qu'elle a été activée.
	if (admin.totp_confirmed_at) {
		const secret = readTotpSecret(admin);
		if (!secret || !verifyTotp(secret, totpCode)) return fail('invalid');
	}

	rateLimitReset(userBucket);
	db().prepare('update admins set last_login_at = ? where id = ?').run(now(), admin.id);
	return { ok: true, admin };
}

/* --------------------------------------------------------- journal d'audit */

/**
 * Trace les actions sensibles. Sur un site politiquement ciblé, savoir *qui* a
 * supprimé *quoi* et *quand* est ce qui permet de comprendre après coup si un
 * compte a été compromis.
 */
export function audit(
	admin: { id: number; username: string } | null,
	action: string,
	target = '',
	detail = '',
	ipHash = ''
) {
	db().prepare(
		`insert into audit_log (created_at, admin_id, admin_name, action, target, detail, ip_hash)
		 values (?, ?, ?, ?, ?, ?, ?)`
	).run(now(), admin?.id ?? null, admin?.username ?? 'anonyme', action, target, detail.slice(0, 500), ipHash);
}

export function recentAudit(limit = 100) {
	return db().prepare('select * from audit_log order by id desc limit ?').all(limit) as {
		id: number;
		created_at: string;
		admin_name: string;
		action: string;
		target: string;
		detail: string;
	}[];
}

/* ------------------------------------------------- gestion des comptes */

export function getAdmin(id: number): AdminRow | undefined {
	return db().prepare('select * from admins where id = ?').get(id) as AdminRow | undefined;
}

/**
 * Désactive un compte : la personne ne peut plus se connecter et ses sessions
 * en cours sont immédiatement coupées. On désactive plutôt qu'on ne supprime,
 * pour conserver la trace de qui a publié quoi.
 */
export function disableAdmin(adminId: number) {
	db().prepare('update admins set disabled_at = ? where id = ?').run(now(), adminId);
	destroyAllSessions(adminId);
}

export function enableAdmin(adminId: number) {
	db().prepare('update admins set disabled_at = null where id = ?').run(adminId);
}

/** Réinitialise la double authentification (téléphone perdu ou changé). */
export function resetTotp(adminId: number) {
	db().prepare('update admins set totp_secret = null, totp_confirmed_at = null where id = ?').run(adminId);
	destroyAllSessions(adminId);
}

export function countOwners(): number {
	return (
		db().prepare("select count(*) as n from admins where role = 'owner' and disabled_at is null").get() as {
			n: number;
		}
	).n;
}

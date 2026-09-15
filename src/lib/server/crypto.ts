import {
	createCipheriv,
	createDecipheriv,
	createHash,
	createHmac,
	randomBytes,
	scrypt,
	timingSafeEqual
} from 'node:crypto';
import type { ScryptOptions } from 'node:crypto';
import { secretKey } from './secret.ts';

/**
 * `promisify` ne conserve pas la surcharge de `scrypt` acceptant des options,
 * on enveloppe donc l'appel à la main. Le calcul reste asynchrone : il tourne
 * dans le pool de threads de Node et ne bloque pas les autres requêtes.
 */
function scryptAsync(
	password: string,
	salt: Buffer,
	keylen: number,
	options: ScryptOptions
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, keylen, options, (err, derived) =>
			err ? reject(err) : resolve(derived)
		);
	});
}

// Paramètres scrypt : ~32 Mo de mémoire par calcul. C'est ce qui rend une
// attaque par dictionnaire coûteuse même si la base de données fuite.
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 } as const;
const KEY_LEN = 32;

/** Hache un mot de passe. Format : scrypt$N$r$p$sel$empreinte (base64). */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password.normalize('NFKC'), salt, KEY_LEN, SCRYPT);
	return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/** Vérifie un mot de passe en temps constant. Ne lève jamais d'exception. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	try {
		const [scheme, N, r, p, salt, hash] = stored.split('$');
		if (scheme !== 'scrypt') return false;
		const expected = Buffer.from(hash, 'base64');
		const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(salt, 'base64'), expected.length, {
			N: Number(N),
			r: Number(r),
			p: Number(p),
			maxmem: SCRYPT.maxmem
		});
		return timingSafeEqual(expected, actual);
	} catch {
		return false;
	}
}

/** Comparaison de chaînes en temps constant (protège des attaques temporelles). */
export function safeEqual(a: string, b: string): boolean {
	const ba = Buffer.from(a, 'utf8');
	const bb = Buffer.from(b, 'utf8');
	if (ba.length !== bb.length) return false;
	return timingSafeEqual(ba, bb);
}

export function sha256(input: string | Buffer): string {
	return createHash('sha256').update(input).digest('hex');
}

/** HMAC avec la clé du serveur. Utilisé pour pseudonymiser les IP. */
export function hmac(namespace: string, value: string): string {
	return createHmac('sha256', secretKey()).update(`${namespace}:${value}`).digest('hex');
}

/** Jeton aléatoire imprévisible (sessions, noms de fichiers). */
export function randomToken(bytes = 32): string {
	return randomBytes(bytes).toString('base64url');
}

let aesKeyCache: Buffer | null = null;
function aesKey(): Buffer {
	aesKeyCache ??= createHash('sha256').update(secretKey()).update('aes-at-rest').digest();
	return aesKeyCache;
}

/**
 * Chiffre une valeur sensible avant stockage en base (AES-256-GCM).
 * Les secrets TOTP passent par là : ainsi une fuite du fichier SQLite seul ne
 * permet pas de générer les codes à 6 chiffres, il faut aussi la SECRET_KEY.
 */
export function encryptAtRest(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', aesKey(), iv);
	const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ct.toString('base64url')}`;
}

export function decryptAtRest(stored: string): string | null {
	try {
		const [version, iv, tag, ct] = stored.split('.');
		if (version !== 'v1') return null;
		const decipher = createDecipheriv('aes-256-gcm', aesKey(), Buffer.from(iv, 'base64url'));
		decipher.setAuthTag(Buffer.from(tag, 'base64url'));
		return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
	} catch {
		return null;
	}
}

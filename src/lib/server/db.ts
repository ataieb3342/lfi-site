import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Base de données SQLite via le module `node:sqlite` intégré à Node.
 *
 * Pourquoi SQLite et pas PostgreSQL : la base est un simple fichier. Il n'y a
 * aucun serveur de base de données à exposer sur le réseau, à patcher ou à
 * sécuriser, et une sauvegarde consiste à copier un fichier. Pour un site
 * d'information de groupe local, c'est largement suffisant et plus rapide
 * qu'une base distante.
 */

/**
 * La base est ouverte à la première requête, pas au chargement du module :
 * compiler le site ne doit créer aucun fichier ni exiger les données de
 * production.
 */
let connexion: DatabaseSync | null = null;

export function db(): DatabaseSync {
	if (connexion) return connexion;

	const chemin = resolve(process.env.DATABASE_PATH || 'data/site.db');
	mkdirSync(dirname(chemin), { recursive: true });
	connexion = new DatabaseSync(chemin);

	// WAL : les lectures ne bloquent pas les écritures (indispensable sur le web).
	connexion.exec(`
		pragma journal_mode = WAL;
		pragma synchronous = NORMAL;
		pragma foreign_keys = ON;
		pragma busy_timeout = 5000;
	`);

	migrer(connexion);
	nettoyer();
	demarrerNettoyagePeriodique();

	return connexion;
}

/**
 * Migrations du schéma.
 *
 * Pour faire évoluer la base : AJOUTER une entrée à la fin du tableau. Ne
 * jamais modifier une migration déjà partie en production. Le numéro de la
 * dernière migration appliquée est stocké dans `pragma user_version`, donc
 * elles ne s'exécutent qu'une fois.
 */
const MIGRATIONS: string[] = [
	// 001 — schéma initial
	`
	create table admins (
		id integer primary key,
		username text not null unique,
		display_name text not null,
		password_hash text not null,
		totp_secret text,
		totp_confirmed_at text,
		role text not null default 'admin' check (role in ('admin', 'owner')),
		created_at text not null,
		last_login_at text,
		disabled_at text
	);

	create table sessions (
		id text primary key,            -- sha256 du cookie, jamais le token en clair
		admin_id integer not null references admins(id) on delete cascade,
		created_at text not null,
		expires_at text not null,
		ip_hash text not null default '',
		user_agent text not null default ''
	);
	create index sessions_admin on sessions(admin_id);
	create index sessions_expires on sessions(expires_at);

	create table media (
		id integer primary key,
		filename text not null unique,  -- nom aléatoire sur le disque
		mime text not null,
		bytes integer not null,
		alt text not null default '',
		created_at text not null,
		uploaded_by integer references admins(id) on delete set null
	);

	create table publications (
		id integer primary key,
		kind text not null check (kind in ('article', 'breve')),
		slug text not null unique,
		title text not null,
		summary text not null default '',
		body text not null default '',  -- markdown
		cover_media_id integer references media(id) on delete set null,
		status text not null default 'draft' check (status in ('draft', 'published')),
		comments_open integer not null default 1,
		pinned integer not null default 0,
		published_at text,
		created_at text not null,
		updated_at text not null,
		author_id integer references admins(id) on delete set null,
		author_name text not null default ''
	);
	create index publications_feed on publications(status, published_at desc);
	create index publications_kind on publications(kind, status, published_at desc);

	create table comments (
		id integer primary key,
		publication_id integer not null references publications(id) on delete cascade,
		author_name text not null default '',
		body text not null,
		status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
		created_at text not null,
		moderated_at text,
		moderated_by integer references admins(id) on delete set null,
		ip_hash text not null default '',   -- pseudonymisé (HMAC), jamais d'IP en clair
		user_agent text not null default ''
	);
	create index comments_publication on comments(publication_id, status, created_at);
	create index comments_moderation on comments(status, created_at desc);

	create table settings (
		key text primary key,
		value text not null
	);

	create table rate_limits (
		id integer primary key,
		bucket text not null,
		created_at integer not null      -- timestamp ms
	);
	create index rate_limits_bucket on rate_limits(bucket, created_at);
	create index rate_limits_time on rate_limits(created_at);

	create table used_challenges (
		token text primary key,
		expires_at integer not null
	) without rowid;

	create table audit_log (
		id integer primary key,
		created_at text not null,
		admin_id integer,
		admin_name text not null default '',
		action text not null,
		target text not null default '',
		detail text not null default '',
		ip_hash text not null default ''
	);
	create index audit_log_time on audit_log(created_at desc);

	create table blocked_ips (
		ip_hash text primary key,
		reason text not null default '',
		created_at text not null
	) without rowid;
	`
	,
	// 002 — « brève » devient « actualité », et gagne une date d'action
	//
	// SQLite ne sait pas modifier une contrainte CHECK : il faut reconstruire la
	// table. C'est la procédure officielle en 12 étapes, d'où le détour par une
	// table temporaire. Les clés étrangères sont désactivées le temps de
	// l'opération (voir migrer()), sans quoi le DROP TABLE effacerait en cascade
	// tous les commentaires.
	`
	create table publications_nouveau (
		id integer primary key,
		kind text not null check (kind in ('article', 'actu')),
		slug text not null unique,
		title text not null,
		summary text not null default '',
		body text not null default '',
		cover_media_id integer references media(id) on delete set null,
		status text not null default 'draft' check (status in ('draft', 'published')),
		comments_open integer not null default 1,
		pinned integer not null default 0,
		event_at text,                  -- date de l'action au format AAAA-MM-JJ, facultative
		published_at text,
		created_at text not null,
		updated_at text not null,
		author_id integer references admins(id) on delete set null,
		author_name text not null default ''
	);

	insert into publications_nouveau
		(id, kind, slug, title, summary, body, cover_media_id, status, comments_open,
		 pinned, event_at, published_at, created_at, updated_at, author_id, author_name)
	select
		id,
		case kind when 'breve' then 'actu' else kind end,
		slug, title, summary, body, cover_media_id, status, comments_open,
		pinned, null, published_at, created_at, updated_at, author_id, author_name
	from publications;

	drop table publications;
	alter table publications_nouveau rename to publications;

	create index publications_feed on publications(status, published_at desc);
	create index publications_kind on publications(kind, status, published_at desc);
	create index publications_agenda on publications(kind, status, event_at);
	`
	,
	// 003 — un troisième type de publication : l'apéro thématique
	//
	// Même procédure que la 002 : SQLite ne sait pas modifier une contrainte
	// CHECK, la table est reconstruite à l'identique avec la nouvelle valeur.
	`
	create table publications_nouveau (
		id integer primary key,
		kind text not null check (kind in ('article', 'actu', 'apero')),
		slug text not null unique,
		title text not null,
		summary text not null default '',
		body text not null default '',
		cover_media_id integer references media(id) on delete set null,
		status text not null default 'draft' check (status in ('draft', 'published')),
		comments_open integer not null default 1,
		pinned integer not null default 0,
		event_at text,
		published_at text,
		created_at text not null,
		updated_at text not null,
		author_id integer references admins(id) on delete set null,
		author_name text not null default ''
	);

	insert into publications_nouveau select * from publications;

	drop table publications;
	alter table publications_nouveau rename to publications;

	create index publications_feed on publications(status, published_at desc);
	create index publications_kind on publications(kind, status, published_at desc);
	create index publications_agenda on publications(kind, status, event_at);
	`
	,
	// 004 — les sources partagées avant un apéro
	//
	// Un dossier collectif par apéro : livres, vidéos, articles, sites… que
	// chacun peut proposer depuis la fiche. Même mécanique que les commentaires
	// (envoi anonyme, relecture avant publication, empreinte d'IP pseudonymisée),
	// mais dans une table à part : une source a un titre et un lien, pas un
	// texte libre, et elle se lit comme une liste, pas comme un fil.
	`
	create table sources (
		id integer primary key,
		publication_id integer not null references publications(id) on delete cascade,
		title text not null,
		url text not null default '',        -- vide pour un livre ou une source sans lien
		note text not null default '',       -- un mot pour dire pourquoi, facultatif
		author_name text not null default '',
		status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
		created_at text not null,
		moderated_at text,
		moderated_by integer references admins(id) on delete set null,
		ip_hash text not null default '',   -- pseudonymisé (HMAC), jamais d'IP en clair
		user_agent text not null default ''
	);
	create index sources_publication on sources(publication_id, status, created_at);
	create index sources_moderation on sources(status, created_at desc);
	`
	,
	// 005 — un lien ou un PDF dans le dossier d'un apéro et la bibliothèque commune
	`
	alter table sources add column pdf_filename text;
	alter table sources add column pdf_original_name text not null default '';
	alter table sources add column pdf_bytes integer;
	create unique index sources_pdf_filename on sources(pdf_filename) where pdf_filename is not null;
	create index sources_bibliotheque on sources(status, created_at desc)
		where url != '' or pdf_filename is not null;
	`
	,
	// 006 — justification des droits de republication d'un PDF
	`
	alter table sources add column droits_diffusion text not null default '';
	`
];

function migrer(base: DatabaseSync) {
	const ligne = base.prepare('pragma user_version').get() as { user_version: number };
	const actuelle = Number(ligne.user_version);
	if (actuelle >= MIGRATIONS.length) return;

	// Procédure officielle de SQLite pour reconstruire une table : les clés
	// étrangères sont suspendues, sinon un DROP TABLE supprimerait en cascade
	// les lignes qui référencent la table reconstruite. Ce réglage ne peut pas
	// être changé à l'intérieur d'une transaction, d'où sa place ici.
	base.exec('pragma foreign_keys = OFF');

	for (let v = actuelle; v < MIGRATIONS.length; v++) {
		base.exec('begin');
		try {
			base.exec(MIGRATIONS[v]);
			base.exec(`pragma user_version = ${v + 1}`);
			base.exec('commit');
			console.log(`[db] migration ${v + 1} appliquée`);
		} catch (err) {
			base.exec('rollback');
			base.exec('pragma foreign_keys = ON');
			throw err;
		}
	}

	// Vérification que la reconstruction n'a laissé aucune référence orpheline.
	const orphelins = base.prepare('pragma foreign_key_check').all();
	base.exec('pragma foreign_keys = ON');
	if (orphelins.length > 0) {
		throw new Error(
			`Migration incohérente : ${orphelins.length} référence(s) orpheline(s). ` +
				'Restaurez la dernière sauvegarde avant toute écriture.'
		);
	}
}

/** Horodatage ISO en UTC : le seul format de date stocké en base. */
export function now(): string {
	return new Date().toISOString();
}

/** Purge des tables éphémères (sessions expirées, compteurs anti-spam). */
export function nettoyer() {
	const base = connexion;
	if (!base) return;
	const maintenantMs = Date.now();
	base.prepare('delete from sessions where expires_at < ?').run(now());
	base.prepare('delete from rate_limits where created_at < ?').run(maintenantMs - 24 * 3600_000);
	base.prepare('delete from used_challenges where expires_at < ?').run(maintenantMs);
}

let minuterie: ReturnType<typeof setInterval> | null = null;
function demarrerNettoyagePeriodique() {
	minuterie ??= setInterval(nettoyer, 3600_000);
	minuterie.unref();
}

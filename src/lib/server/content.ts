import { db, now } from './db.ts';
import { supprimerPdf } from './bibliotheque.ts';

export type Kind = 'article' | 'actu' | 'apero' | 'revue';
export type Status = 'draft' | 'published';

export type Publication = {
	id: number;
	kind: Kind;
	slug: string;
	title: string;
	summary: string;
	body: string;
	cover_media_id: number | null;
	status: Status;
	comments_open: number;
	pinned: number;
	event_at: string | null;
	published_at: string | null;
	created_at: string;
	updated_at: string;
	author_id: number | null;
	author_name: string;
};

export type PublicationListItem = Publication & { comment_count: number };

/* ------------------------------------------------------------------ slugs */

/** Transforme un titre en identifiant d'URL lisible : « Réunion publique » -> « reunion-publique ». */
export function slugify(input: string): string {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // accents
		.toLowerCase()
		.replace(/['’]/g, '-')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/g, '');
}

/** Garantit l'unicité du slug en suffixant -2, -3… si nécessaire. */
export function uniqueSlug(title: string, excludeId?: number): string {
	const base = slugify(title) || 'publication';
	let candidate = base;
	for (let i = 2; ; i++) {
		const clash = db()
			.prepare('select id from publications where slug = ? and id is not ?')
			.get(candidate, excludeId ?? null) as { id: number } | undefined;
		if (!clash) return candidate;
		candidate = `${base}-${i}`;
	}
}

/* ----------------------------------------------------------------- lecture */

const PUBLIC_SELECT = `
	select p.*, (
		select count(*) from comments c
		where c.publication_id = p.id and c.status = 'approved'
	) as comment_count
	from publications p`;

/**
 * Deux tris possibles :
 *
 * - « chronologique » : du plus récent au plus ancien. C'est ce qu'on attend
 *   d'articles d'analyse.
 * - « agenda » : les actions encore à venir d'abord, de la plus proche à la plus
 *   lointaine, puis tout le reste par date de publication. Sans cela, un appel à
 *   mobilisation vieux de trois mois resterait en tête de liste.
 * - « archives » : comme « agenda » pour les rendez-vous à venir, mais les
 *   rendez-vous passés sont classés par date de l'action et non de publication.
 *   C'est le tri des apéros : leur fiche est publiée avant la soirée puis
 *   complétée après, et c'est la date de la soirée qui fait sens dans l'archive.
 */
const ORDRE = {
	chronologique: 'order by p.pinned desc, p.published_at desc',
	agenda: `order by
		p.pinned desc,
		case when p.event_at is not null and p.event_at >= date('now') then 0 else 1 end,
		case when p.event_at is not null and p.event_at >= date('now') then p.event_at end asc,
		p.published_at desc`,
	archives: `order by
		p.pinned desc,
		case when p.event_at is not null and p.event_at >= date('now') then 0 else 1 end,
		case when p.event_at is not null and p.event_at >= date('now') then p.event_at end asc,
		coalesce(p.event_at, substr(p.published_at, 1, 10)) desc,
		p.published_at desc`
} as const;

export type Ordre = keyof typeof ORDRE;

export function listPublished(
	opts: { kind?: Kind; limit?: number; offset?: number; ordre?: Ordre } = {}
) {
	const { kind, limit = 20, offset = 0, ordre = 'chronologique' } = opts;
	return db()
		.prepare(
			`${PUBLIC_SELECT}
			 where p.status = 'published' and (? is null or p.kind = ?)
			 ${ORDRE[ordre]}
			 limit ? offset ?`
		)
		.all(kind ?? null, kind ?? null, limit, offset) as PublicationListItem[];
}

export function countPublished(kind?: Kind): number {
	return (
		db()
			.prepare(
				`select count(*) as n from publications
				 where status = 'published' and (? is null or kind = ?)`
			)
			.get(kind ?? null, kind ?? null) as { n: number }
	).n;
}

export function getPublishedBySlug(slug: string): PublicationListItem | undefined {
	return db().prepare(`${PUBLIC_SELECT} where p.slug = ? and p.status = 'published'`).get(slug) as
		| PublicationListItem
		| undefined;
}

export function getById(id: number): Publication | undefined {
	return db().prepare('select * from publications where id = ?').get(id) as Publication | undefined;
}

export function getBySlugAnyStatus(slug: string): PublicationListItem | undefined {
	return db().prepare(`${PUBLIC_SELECT} where p.slug = ?`).get(slug) as PublicationListItem | undefined;
}

/** Liste pour l'administration : brouillons compris. */
export function listForAdmin(opts: { kind?: Kind; status?: Status; search?: string } = {}) {
	const search = opts.search?.trim() ? `%${opts.search.trim()}%` : null;
	return db()
		.prepare(
			`${PUBLIC_SELECT}
			 where (? is null or p.kind = ?)
			   and (? is null or p.status = ?)
			   and (? is null or p.title like ? or p.body like ?)
			 order by coalesce(p.published_at, p.updated_at) desc
			 limit 200`
		)
		.all(
			opts.kind ?? null,
			opts.kind ?? null,
			opts.status ?? null,
			opts.status ?? null,
			search,
			search,
			search
		) as PublicationListItem[];
}

/* ---------------------------------------------------------------- écriture */

export type PublicationInput = {
	kind: Kind;
	title: string;
	summary: string;
	body: string;
	status: Status;
	commentsOpen: boolean;
	pinned: boolean;
	coverMediaId: number | null;
	authorName: string;
	/** Date de l'action annoncée (AAAA-MM-JJ), ou null. */
	eventAt: string | null;
};

export function createPublication(input: PublicationInput, authorId: number): number {
	const timestamp = now();
	const result = db()
		.prepare(
			`insert into publications
			 (kind, slug, title, summary, body, cover_media_id, status, comments_open, pinned,
			  event_at, published_at, created_at, updated_at, author_id, author_name)
			 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.kind,
			uniqueSlug(input.title),
			input.title,
			input.summary,
			input.body,
			input.coverMediaId,
			input.status,
			input.commentsOpen ? 1 : 0,
			input.pinned ? 1 : 0,
			input.eventAt,
			input.status === 'published' ? timestamp : null,
			timestamp,
			timestamp,
			authorId,
			input.authorName
		);
	return Number(result.lastInsertRowid);
}

export function updatePublication(id: number, input: PublicationInput, opts: { reslug: boolean }) {
	const existing = getById(id);
	if (!existing) throw new Error('Publication introuvable');

	// On ne change l'URL que si on le demande explicitement : les liens déjà
	// partagés sur les réseaux sociaux continuent de fonctionner.
	const slug = opts.reslug ? uniqueSlug(input.title, id) : existing.slug;

	// La date de publication est figée à la première mise en ligne.
	const publishedAt =
		input.status === 'published' ? (existing.published_at ?? now()) : existing.published_at;

	db().prepare(
		`update publications set
		   kind = ?, slug = ?, title = ?, summary = ?, body = ?, cover_media_id = ?,
		   status = ?, comments_open = ?, pinned = ?, event_at = ?, published_at = ?,
		   updated_at = ?, author_name = ?
		 where id = ?`
	).run(
		input.kind,
		slug,
		input.title,
		input.summary,
		input.body,
		input.coverMediaId,
		input.status,
		input.commentsOpen ? 1 : 0,
		input.pinned ? 1 : 0,
		input.eventAt,
		publishedAt,
		now(),
		input.authorName,
		id
	);
	return slug;
}

export function deletePublication(id: number) {
	// La cascade SQLite supprime les lignes « sources », mais pas leurs fichiers
	// sur le disque : leurs noms doivent être retenus avant la suppression.
	const pdfs = db()
		.prepare('select pdf_filename from sources where publication_id = ? and pdf_filename is not null')
		.all(id) as { pdf_filename: string }[];
	db().prepare('delete from publications where id = ?').run(id);
	for (const pdf of pdfs) supprimerPdf(pdf.pdf_filename);
}

/* ----------------------------------------------------------- commentaires */

export type Comment = {
	id: number;
	publication_id: number;
	author_name: string;
	body: string;
	status: 'pending' | 'approved' | 'rejected';
	created_at: string;
	moderated_at: string | null;
	ip_hash: string;
};

export function listApprovedComments(publicationId: number): Comment[] {
	return db()
		.prepare(
			`select id, publication_id, author_name, body, status, created_at, moderated_at, ip_hash
			 from comments where publication_id = ? and status = 'approved' order by created_at`
		)
		.all(publicationId) as Comment[];
}

export function createComment(input: {
	publicationId: number;
	authorName: string;
	body: string;
	status: 'pending' | 'approved';
	ipHash: string;
	userAgent: string;
}): number {
	const result = db()
		.prepare(
			`insert into comments (publication_id, author_name, body, status, created_at, ip_hash, user_agent)
			 values (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.publicationId,
			input.authorName,
			input.body,
			input.status,
			now(),
			input.ipHash,
			input.userAgent.slice(0, 200)
		);
	return Number(result.lastInsertRowid);
}

export function countPendingComments(): number {
	return (db().prepare("select count(*) as n from comments where status = 'pending'").get() as { n: number })
		.n;
}

export type CommentForModeration = Comment & { publication_title: string; publication_slug: string; publication_kind: Kind };

export function listCommentsForModeration(status: 'pending' | 'approved' | 'rejected'): CommentForModeration[] {
	return db()
		.prepare(
			`select c.*, p.title as publication_title, p.slug as publication_slug, p.kind as publication_kind
			 from comments c join publications p on p.id = c.publication_id
			 where c.status = ?
			 order by c.created_at desc
			 limit 300`
		)
		.all(status) as CommentForModeration[];
}

export function getComment(id: number): Comment | undefined {
	return db().prepare('select * from comments where id = ?').get(id) as Comment | undefined;
}

export function moderateComment(id: number, status: 'approved' | 'rejected', adminId: number) {
	db().prepare('update comments set status = ?, moderated_at = ?, moderated_by = ? where id = ?').run(
		status,
		now(),
		adminId,
		id
	);
}

export function deleteComment(id: number) {
	db().prepare('delete from comments where id = ?').run(id);
}

/** Rejette d'un coup tous les commentaires en attente venant de la même origine. */
export function rejectAllFromIpHash(ipHash: string, adminId: number): number {
	const result = db()
		.prepare(
			`update comments set status = 'rejected', moderated_at = ?, moderated_by = ?
			 where ip_hash = ? and status = 'pending'`
		)
		.run(now(), adminId, ipHash);
	return Number(result.changes);
}

export function blockIpHash(ipHash: string, reason: string) {
	db().prepare(
		`insert into blocked_ips (ip_hash, reason, created_at) values (?, ?, ?)
		 on conflict(ip_hash) do update set reason = excluded.reason`
	).run(ipHash, reason, now());
}

export function isIpBlocked(ipHash: string): boolean {
	return !!db().prepare('select 1 from blocked_ips where ip_hash = ?').get(ipHash);
}

export function listBlockedIps() {
	return db().prepare('select * from blocked_ips order by created_at desc limit 200').all() as {
		ip_hash: string;
		reason: string;
		created_at: string;
	}[];
}

export function unblockIpHash(ipHash: string) {
	db().prepare('delete from blocked_ips where ip_hash = ?').run(ipHash);
}

/* ----------------------------------------------------- sources d'un apéro */

/**
 * Une source partagée avant un apéro : un livre, une vidéo, un article, un
 * site… Le lien est facultatif (un livre n'en a pas forcément). Même
 * circuit que les commentaires : envoi anonyme, relecture, empreinte d'IP
 * pseudonymisée.
 */
export type Source = {
	id: number;
	publication_id: number;
	title: string;
	url: string;
	note: string;
	author_name: string;
	status: 'pending' | 'approved' | 'rejected';
	created_at: string;
	moderated_at: string | null;
	ip_hash: string;
	pdf_filename: string | null;
	pdf_original_name: string;
	pdf_bytes: number | null;
	droits_diffusion: string;
};

export function listApprovedSources(publicationId: number): Source[] {
	return db()
		.prepare(
			`select id, publication_id, title, url, note, author_name, status, created_at, moderated_at, ip_hash,
			        pdf_filename, pdf_original_name, pdf_bytes, droits_diffusion
			 from sources where publication_id = ? and status = 'approved' order by created_at`
		)
		.all(publicationId) as Source[];
}

export function countApprovedSources(publicationId: number): number {
	return (
		db()
			.prepare("select count(*) as n from sources where publication_id = ? and status = 'approved'")
			.get(publicationId) as { n: number }
	).n;
}

export function createSource(input: {
	publicationId: number;
	title: string;
	url: string;
	note: string;
	authorName: string;
	status: 'pending' | 'approved';
	ipHash: string;
	userAgent: string;
	pdfFilename?: string | null;
	pdfOriginalName?: string;
	pdfBytes?: number | null;
	droitsDiffusion?: string;
}): number {
	const result = db()
		.prepare(
			`insert into sources (publication_id, title, url, note, author_name, status, created_at, ip_hash, user_agent,
			 pdf_filename, pdf_original_name, pdf_bytes, droits_diffusion)
			 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.publicationId,
			input.title,
			input.url,
			input.note,
			input.authorName,
			input.status,
			now(),
			input.ipHash,
			input.userAgent.slice(0, 200),
			input.pdfFilename ?? null,
			input.pdfOriginalName ?? '',
			input.pdfBytes ?? null,
			input.droitsDiffusion ?? ''
		);
	return Number(result.lastInsertRowid);
}

export function countPendingSources(): number {
	return (db().prepare("select count(*) as n from sources where status = 'pending'").get() as { n: number }).n;
}

export type SourceForModeration = Source & { publication_title: string; publication_slug: string; publication_kind: Kind };

export function listSourcesForModeration(status: 'pending' | 'approved' | 'rejected'): SourceForModeration[] {
	return db()
		.prepare(
			`select s.*, p.title as publication_title, p.slug as publication_slug, p.kind as publication_kind
			 from sources s join publications p on p.id = s.publication_id
			 where s.status = ?
			 order by s.created_at desc
			 limit 300`
		)
		.all(status) as SourceForModeration[];
}

export function getSource(id: number): Source | undefined {
	return db().prepare('select * from sources where id = ?').get(id) as Source | undefined;
}

export function getApprovedSourceByPdfFilename(filename: string): Source | undefined {
	return db()
		.prepare("select * from sources where pdf_filename = ? and status = 'approved'")
		.get(filename) as Source | undefined;
}

/** Recherche sans filtre d'état, réservée à la relecture par l'administration. */
export function getSourceByPdfFilename(filename: string): Source | undefined {
	return db().prepare('select * from sources where pdf_filename = ?').get(filename) as Source | undefined;
}

/** Oublie le fichier après son retrait du disque tout en conservant la décision de modération. */
export function detachPdfFromSource(id: number) {
	db().prepare("update sources set pdf_filename = null, pdf_original_name = '', pdf_bytes = null, droits_diffusion = '' where id = ?").run(id);
}

/** Détache les PDF en attente d'une origine avant leur suppression du disque. */
export function detachPendingPdfsFromIpHash(ipHash: string): string[] {
	const lignes = db()
		.prepare("select pdf_filename from sources where ip_hash = ? and status = 'pending' and pdf_filename is not null")
		.all(ipHash) as { pdf_filename: string }[];
	db().prepare(
		"update sources set pdf_filename = null, pdf_original_name = '', pdf_bytes = null, droits_diffusion = '' where ip_hash = ? and status = 'pending'"
	).run(ipHash);
	return lignes.map((ligne) => ligne.pdf_filename);
}

/** Toutes les sources publiées, rassemblées dans la bibliothèque commune. */
export function listBibliotheque(): SourceForModeration[] {
	return db()
		.prepare(
			`select s.*, p.title as publication_title, p.slug as publication_slug, p.kind as publication_kind
			 from sources s join publications p on p.id = s.publication_id
			 where s.status = 'approved' and (s.url != '' or s.pdf_filename is not null)
			 order by s.created_at desc limit 500`
		)
		.all() as SourceForModeration[];
}

export function moderateSource(id: number, status: 'approved' | 'rejected', adminId: number) {
	db().prepare('update sources set status = ?, moderated_at = ?, moderated_by = ? where id = ?').run(
		status,
		now(),
		adminId,
		id
	);
}

export function deleteSource(id: number) {
	db().prepare('delete from sources where id = ?').run(id);
}

/** Rejette d'un coup toutes les sources en attente venant de la même origine. */
export function rejectAllSourcesFromIpHash(ipHash: string, adminId: number): number {
	const result = db()
		.prepare(
			`update sources set status = 'rejected', moderated_at = ?, moderated_by = ?
			 where ip_hash = ? and status = 'pending'`
		)
		.run(now(), adminId, ipHash);
	return Number(result.changes);
}

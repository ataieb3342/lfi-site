import { mkdirSync, unlinkSync, createReadStream, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { db, now } from './db.ts';
import { randomToken } from './crypto.ts';

/**
 * Images envoyées depuis l'administration.
 *
 * Règle de sécurité centrale : le type du fichier est déterminé en lisant ses
 * premiers octets, jamais à partir du nom du fichier ni de l'en-tête déclaré
 * par le navigateur — les deux sont contrôlés par la personne qui envoie.
 *
 * Le SVG est refusé volontairement : c'est un format XML qui peut contenir du
 * JavaScript, et l'afficher reviendrait à ouvrir une faille XSS.
 */

export const UPLOADS_DIR = resolve(process.env.UPLOADS_PATH || 'data/uploads');
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

mkdirSync(UPLOADS_DIR, { recursive: true });

const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
	{ mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
	{
		mime: 'image/png',
		ext: 'png',
		test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
	},
	{
		mime: 'image/gif',
		ext: 'gif',
		test: (b) => b.subarray(0, 6).toString('latin1') === 'GIF87a' || b.subarray(0, 6).toString('latin1') === 'GIF89a'
	},
	{
		mime: 'image/webp',
		ext: 'webp',
		test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'
	},
	{
		mime: 'image/avif',
		ext: 'avif',
		test: (b) =>
			b.subarray(4, 8).toString('latin1') === 'ftyp' &&
			['avif', 'avis'].includes(b.subarray(8, 12).toString('latin1'))
	}
];

export function sniffImage(bytes: Buffer): { mime: string; ext: string } | null {
	if (bytes.length < 16) return null;
	return SIGNATURES.find((sig) => sig.test(bytes)) ?? null;
}

export type Media = {
	id: number;
	filename: string;
	mime: string;
	bytes: number;
	alt: string;
	created_at: string;
};

export async function storeUpload(file: File, alt: string, adminId: number): Promise<Media> {
	if (file.size > MAX_UPLOAD_BYTES) {
		throw new Error(`Image trop lourde (maximum ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo).`);
	}
	const bytes = Buffer.from(await file.arrayBuffer());
	const kind = sniffImage(bytes);
	if (!kind) {
		throw new Error('Format non reconnu. Formats acceptés : JPEG, PNG, WebP, GIF, AVIF.');
	}

	// Nom de fichier entièrement aléatoire : le nom d'origine, qui peut contenir
	// des séquences de traversée de répertoire, n'est jamais réutilisé.
	const filename = `${randomToken(16)}.${kind.ext}`;
	await writeFile(join(UPLOADS_DIR, filename), bytes, { mode: 0o644 });

	const result = db()
		.prepare('insert into media (filename, mime, bytes, alt, created_at, uploaded_by) values (?, ?, ?, ?, ?, ?)')
		.run(filename, kind.mime, bytes.length, alt.slice(0, 300), now(), adminId);

	return {
		id: Number(result.lastInsertRowid),
		filename,
		mime: kind.mime,
		bytes: bytes.length,
		alt,
		created_at: now()
	};
}

export function getMedia(id: number): Media | undefined {
	return db().prepare('select * from media where id = ?').get(id) as Media | undefined;
}

export function getMediaByFilename(filename: string): Media | undefined {
	// On interroge la base plutôt que le disque : un nom absent de la base n'est
	// jamais servi, ce qui neutralise toute tentative de traversée de chemin.
	return db().prepare('select * from media where filename = ?').get(filename) as Media | undefined;
}

export function listMedia(limit = 100): Media[] {
	return db().prepare('select * from media order by id desc limit ?').all(limit) as Media[];
}

export function deleteMedia(id: number) {
	const media = getMedia(id);
	if (!media) return;
	db().prepare('delete from media where id = ?').run(id);
	try {
		unlinkSync(join(UPLOADS_DIR, media.filename));
	} catch {
		// Fichier déjà absent : l'entrée en base est supprimée, c'est l'essentiel.
	}
}

export function openMedia(media: Media) {
	const path = join(UPLOADS_DIR, media.filename);
	return { stream: createReadStream(path), size: statSync(path).size };
}

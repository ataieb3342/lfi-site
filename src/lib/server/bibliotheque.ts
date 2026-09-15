import { mkdirSync, unlinkSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomToken } from './crypto.ts';

/** PDF proposés par le public. Le dossier fait partie de data/ et des sauvegardes. */
export const BIBLIOTHEQUE_DIR = resolve(process.env.BIBLIOTHEQUE_PATH || 'data/bibliotheque');
export const MAX_PDF_BYTES = 50 * 1024 * 1024;

/** Le type est déterminé par les octets, jamais par le nom ou le type déclaré. */
export function estPdf(bytes: Buffer): boolean {
	return bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-';
}

export async function stockerPdf(file: File): Promise<{
	filename: string;
	originalName: string;
	bytes: number;
}> {
	if (file.size <= 0) throw new Error('Le fichier PDF est vide.');
	if (file.size > MAX_PDF_BYTES) throw new Error('PDF trop lourd (maximum 50 Mo).');

	const contenu = Buffer.from(await file.arrayBuffer());
	if (contenu.length > MAX_PDF_BYTES) throw new Error('PDF trop lourd (maximum 50 Mo).');
	if (!estPdf(contenu)) throw new Error('Le fichier envoyé n’est pas un PDF reconnu.');

	const filename = `${randomToken(16)}.pdf`;
	mkdirSync(BIBLIOTHEQUE_DIR, { recursive: true });
	await writeFile(join(BIBLIOTHEQUE_DIR, filename), contenu, { mode: 0o644, flag: 'wx' });
	return {
		filename,
		originalName: nettoyerNom(file.name),
		bytes: contenu.length
	};
}

function nettoyerNom(nom: string): string {
	const propre = nom.replace(/[\\/\0-\x1f\x7f]/g, '').trim().slice(0, 180);
	return propre || 'document.pdf';
}

export function supprimerPdf(filename: string | null | undefined) {
	if (!filename || !/^[a-zA-Z0-9_-]+\.pdf$/.test(filename)) return;
	try {
		unlinkSync(join(BIBLIOTHEQUE_DIR, filename));
	} catch {
		// Déjà absent : la ligne de base peut tout de même être traitée.
	}
}

export function cheminPdf(filename: string): string {
	if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(filename)) throw new Error('Nom de PDF invalide');
	return join(BIBLIOTHEQUE_DIR, filename);
}

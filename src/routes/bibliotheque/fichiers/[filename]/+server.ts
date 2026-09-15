import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { cheminPdf } from '$lib/server/bibliotheque';
import { getApprovedSourceByPdfFilename, getSourceByPdfFilename } from '$lib/server/content';

/**
 * Un visiteur ne peut consulter qu'un PDF approuvé. Une session
 * d'administration peut aussi ouvrir un document en attente pour le relire.
 * Le nom aléatoire doit toujours correspondre à une ligne de la base : aucun
 * chemin fourni par la requête n'est lu directement.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(params.filename)) error(404, 'Document introuvable');
	const source = locals.admin
		? getSourceByPdfFilename(params.filename)
		: getApprovedSourceByPdfFilename(params.filename);
	if (!source) error(404, 'Document introuvable');

	let bytes: Buffer;
	try {
		bytes = await readFile(cheminPdf(params.filename));
	} catch {
		error(404, 'Document introuvable');
	}

	const nomOriginal = source.pdf_original_name || 'document.pdf';
	const nomAscii = nomOriginal.replace(/[^a-zA-Z0-9._ -]/g, '_') || 'document.pdf';
	const nomUtf8 = encodeURIComponent(nomOriginal).replace(/[!'()*]/g, (caractere) =>
		`%${caractere.charCodeAt(0).toString(16).toUpperCase()}`
	);
	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Length': String(bytes.length),
			'Content-Disposition': `inline; filename="${nomAscii}"; filename*=UTF-8''${nomUtf8}`,
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': source.status === 'approved' ? 'public, max-age=86400' : 'private, no-store'
		}
	});
};

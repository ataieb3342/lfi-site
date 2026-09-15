import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RequestHandler } from './$types';
import { UPLOADS_DIR, getMediaByFilename } from '$lib/server/media';

/**
 * Diffusion des images.
 *
 * Le nom demandé est cherché en base avant toute lecture disque : un chemin
 * qui n'y figure pas n'est jamais ouvert, ce qui rend impossible la lecture de
 * fichiers arbitraires du serveur (« ../../etc/passwd »).
 *
 * Le type MIME renvoyé est celui détecté à l'envoi, accompagné de `nosniff` :
 * le navigateur ne peut pas réinterpréter une image comme du HTML.
 */
export const GET: RequestHandler = async ({ params }) => {
	const media = getMediaByFilename(params.filename);
	if (!media) error(404, 'Image introuvable');

	let bytes: Buffer;
	try {
		bytes = await readFile(join(UPLOADS_DIR, media.filename));
	} catch {
		error(404, 'Image introuvable');
	}

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': media.mime,
			'Content-Length': String(bytes.length),
			'Content-Disposition': 'inline',
			'X-Content-Type-Options': 'nosniff',
			// Le nom de fichier est aléatoire et ne change jamais de contenu :
			// on peut le mettre en cache indéfiniment.
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};

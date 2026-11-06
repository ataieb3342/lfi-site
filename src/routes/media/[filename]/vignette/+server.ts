import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMediaByFilename } from '$lib/server/media';
import { getThumbnail } from '$lib/server/thumbnails';

export const GET: RequestHandler = async ({ params }) => {
 const media = getMediaByFilename(params.filename);
 if (!media) error(404, 'Image introuvable');
 let bytes: Buffer;
 try { bytes = await getThumbnail(media); }
 catch { redirect(307, `/media/${media.filename}`); }
 return new Response(new Uint8Array(bytes), { headers: {
  'Content-Type': 'image/webp', 'Content-Length': String(bytes.length),
  'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable'
 } });
};

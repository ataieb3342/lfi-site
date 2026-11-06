import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDrawingSubmission, readSubmissionImage } from '$lib/server/drawing-submissions';
export const GET: RequestHandler = async ({ params, locals }) => {
 if (!locals.admin?.totpEnabled) error(403, 'Accès réservé à l’équipe.');
 const submission = getDrawingSubmission(Number(params.id));
 if (!submission) error(404, 'Proposition introuvable.');
 let bytes: Buffer;
 try { bytes = await readSubmissionImage(submission); } catch { error(404, 'Image introuvable.'); }
 return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': submission.mime,
  'Content-Length': String(bytes.length), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
};

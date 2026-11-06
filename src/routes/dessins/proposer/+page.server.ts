import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createChallenge, verifySolution } from '$lib/server/captcha';
import { rateLimit } from '$lib/server/ratelimit';
import { isIpBlocked } from '$lib/server/content';
import { createDrawingSubmission } from '$lib/server/drawing-submissions';
import { readDrawingFields } from '$lib/server/drawings';

export const load: PageServerLoad = async () => ({ challenge: createChallenge() });
export const actions: Actions = {
 default: async ({ request, locals }) => {
  const emptyValues: Record<string, string> = {};
  const success = { success: true, error: '', values: emptyValues };
  if (isIpBlocked(locals.ipHash)) return success;
  if (!rateLimit(`drawing:attempt:${locals.ipHash}`, 10, 3600_000).ok) return fail(429, { error: 'Trop de tentatives. Réessayez dans une heure.', success: false, values: emptyValues });
  if (Number(request.headers.get('content-length') || 0) > 5 * 1024 * 1024 + 64 * 1024) return fail(413, { error: 'Choisissez une image de 5 Mo maximum.', success: false, values: emptyValues });
  let form: FormData;
  try { form = await request.formData(); }
  catch { return fail(400, { error: 'Envoi illisible. Réessayez avec le formulaire.', success: false, values: emptyValues }); }
  const values: Record<string, string> = {};
  for (const key of ['title', 'author', 'caption', 'alt', 'rights']) values[key] = String(form.get(key) ?? '').slice(0, 2000);
  if (String(form.get('site') ?? '')) return success;
  try {
   const fields = readDrawingFields(form);
   const file = form.get('image');
   if (!(file instanceof File) || !file.size) return fail(400, { error: 'Choisissez un dessin à envoyer.', success: false, values });
   const proof = String(form.get('preuve') ?? '');
   const verified = proof ? verifySolution(proof) : false;
   const quota = verified ? 5 : 1;
   if (!rateLimit(`drawing:submit:${locals.ipHash}`, quota, 86400_000).ok) return fail(429, { error: 'Vous avez déjà envoyé plusieurs propositions. Réessayez demain.', success: false, values });
   if (!rateLimit('drawing:global', 100, 86400_000).ok) return fail(429, { error: 'Les propositions sont temporairement suspendues. Réessayez demain.', success: false, values });
   await createDrawingSubmission({ ...fields, published: 0 }, file);
   return success;
  } catch (error) { return fail(400, { error: (error as Error).message, success: false, values }); }
 }
};

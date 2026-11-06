import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteDrawing, getDrawing, listDrawings, readDrawingFields, saveDrawing } from '$lib/server/drawings';
import { presentDrawing, presentDrawingSubmission } from '$lib/server/present';
import { storeUpload } from '$lib/server/media';
import { audit } from '$lib/server/auth';
import { listDrawingSubmissions, getDrawingSubmission, approveDrawingSubmission, rejectDrawingSubmission } from '$lib/server/drawing-submissions';
export const load: PageServerLoad = async () => ({ drawings: listDrawings(true).map(presentDrawing), submissions: listDrawingSubmissions().map(presentDrawingSubmission) });
export const actions: Actions = {
 approve: async ({ request, locals }) => {
  if (!locals.admin?.totpEnabled) return fail(403, { error: 'Accès réservé à l’équipe.' });
  const form = await request.formData();
  const id = Number(form.get('submissionId'));
  if (!getDrawingSubmission(id)) return fail(404, { error: 'Proposition déjà traitée.' });
  let drawingId: number;
  try { drawingId = await approveDrawingSubmission(id, readDrawingFields(form, false), locals.admin.id); }
  catch (error) { return fail(400, { error: (error as Error).message }); }
  audit(locals.admin, 'drawing.approve', String(id), `drawing:${drawingId}`, locals.ipHash);
  redirect(303, '/admin/dessins');
 },
 reject: async ({ request, locals }) => {
  if (!locals.admin?.totpEnabled) return fail(403, { error: 'Accès réservé à l’équipe.' });
  const id = Number((await request.formData()).get('submissionId'));
  if (!getDrawingSubmission(id)) return fail(404, { error: 'Proposition déjà traitée.' });
  await rejectDrawingSubmission(id);
  audit(locals.admin, 'drawing.reject', String(id), '', locals.ipHash);
  redirect(303, '/admin/dessins');
 },
 save: async ({ request, locals }) => {
  if (!locals.admin?.totpEnabled) return fail(403, { error: 'Accès réservé à l’équipe.' });
  const form = await request.formData();
  const rawId = String(form.get('id') ?? '');
  const id = rawId ? Number(rawId) : null;
  const existing = id === null ? undefined : getDrawing(id, true);
  if (id !== null && !existing) return fail(404, { error: 'Dessin introuvable.' });
  let savedId: number;
  try {
   const fields = readDrawingFields(form);
   const file = form.get('image');
   let mediaId = existing?.media_id;
   if (file instanceof File && file.size > 0) mediaId = (await storeUpload(file, fields.alt, locals.admin!.id)).id;
   if (!mediaId) return fail(400, { error: 'Choisissez une image.' });
   savedId = saveDrawing(id, fields, mediaId);
  } catch (err) {
   return fail(400, { error: (err as Error).message });
  }
  audit(locals.admin!, id ? 'drawing.update' : 'drawing.create', String(savedId), '', locals.ipHash);
  redirect(303, '/admin/dessins');
 },
 delete: async ({ request, locals }) => {
  if (!locals.admin?.totpEnabled) return fail(403, { error: 'Accès réservé à l’équipe.' });
  const drawing = getDrawing(Number((await request.formData()).get('id')), true);
  if (!drawing) return fail(404, { error: 'Dessin introuvable.' });
  deleteDrawing(drawing.id);
  audit(locals.admin!, 'drawing.delete', String(drawing.id), drawing.title, locals.ipHash);
  redirect(303, '/admin/dessins');
 }
};

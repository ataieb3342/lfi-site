import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteMedia, getMedia, listMedia, storeUpload } from '$lib/server/media';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	return {
		medias: listMedia().map((m) => ({
			id: m.id,
			url: `/media/${m.filename}`,
			alt: m.alt,
			poids: Math.round(m.bytes / 1024),
			creeLe: m.created_at,
			// Une image utilisée en couverture ne doit pas être supprimée par mégarde.
			utilisations:
				(db().prepare('select count(*) as n from publications where cover_media_id = ?').get(m.id) as { n: number }).n +
				(db().prepare('select count(*) as n from admins where profile_media_id = ?').get(m.id) as { n: number }).n
		}))
	};
};

export const actions: Actions = {
	envoyer: async ({ request, locals }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const fichier = form.get('fichier');
		const alt = String(form.get('alt') ?? '');

		if (!(fichier instanceof File) || fichier.size === 0) {
			return fail(400, { erreur: 'Choisissez une image.' });
		}
		try {
			const media = await storeUpload(fichier, alt, admin.id);
			audit(admin, 'image.envoi', media.filename, `${Math.round(media.bytes / 1024)} Ko`, locals.ipHash);
		} catch (err) {
			return fail(400, { erreur: (err as Error).message });
		}
		redirect(303, '/admin/medias');
	},

	supprimer: async ({ request, locals }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const media = getMedia(id);
		if (!media) return fail(404, { erreur: 'Image introuvable.' });
		const utilisations =
			(db().prepare('select count(*) as n from publications where cover_media_id = ?').get(id) as { n: number }).n +
			(db().prepare('select count(*) as n from admins where profile_media_id = ?').get(id) as { n: number }).n;
		if (utilisations > 0) return fail(400, { erreur: 'Cette image est encore utilisée sur le site.' });

		deleteMedia(id);
		audit(admin, 'image.suppression', media.filename, '', locals.ipHash);
		redirect(303, '/admin/medias');
	}
};

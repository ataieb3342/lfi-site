import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createPublication } from '$lib/server/content';
import { apercuPublication, ErreurFormulaire, lirePublication, valeursSaisies } from '$lib/server/formulaires';
import { audit } from '$lib/server/auth';

export const actions: Actions = {
	creer: async ({ request, locals }) => {
		const admin = locals.admin!;
		const form = await request.formData();

		let id: number;
		try {
			const saisie = await lirePublication(form, admin.id, null);
			id = createPublication(saisie, admin.id);
			audit(admin, 'publication.creation', saisie.title, saisie.status, locals.ipHash);
		} catch (err) {
			if (err instanceof ErreurFormulaire) {
				return fail(400, { ...valeursSaisies(form), erreur: err.message });
			}
			throw err;
		}

		redirect(303, `/admin/publications/${id}?enregistre=1`);
	},

	apercu: async ({ request }) => apercuPublication(await request.formData())
};

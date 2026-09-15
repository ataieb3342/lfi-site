import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deletePublication, getById, updatePublication } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import { apercuPublication, ErreurFormulaire, lirePublication, valeursSaisies } from '$lib/server/formulaires';
import { audit } from '$lib/server/auth';

function charger(id: string) {
	const publication = getById(Number(id));
	if (!publication) error(404, 'Publication introuvable');
	return publication;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const publication = charger(params.id);
	return {
		publication: presentPublication(publication),
		corps: publication.body,
		enregistre: url.searchParams.has('enregistre')
	};
};

export const actions: Actions = {
	enregistrer: async ({ request, params, locals }) => {
		const admin = locals.admin!;
		const publication = charger(params.id);
		const form = await request.formData();

		try {
			const saisie = await lirePublication(form, admin.id, publication.cover_media_id);
			// L'URL n'est régénérée que si on le demande : les liens déjà partagés
			// sur les réseaux sociaux continuent de fonctionner.
			updatePublication(publication.id, saisie, { reslug: form.get('regenererUrl') === '1' });
			audit(admin, 'publication.modification', saisie.title, saisie.status, locals.ipHash);
		} catch (err) {
			if (err instanceof ErreurFormulaire) {
				return fail(400, { ...valeursSaisies(form), erreur: err.message });
			}
			throw err;
		}

		redirect(303, `/admin/publications/${publication.id}?enregistre=1`);
	},

	apercu: async ({ request }) => apercuPublication(await request.formData()),

	supprimer: async ({ params, locals }) => {
		const admin = locals.admin!;
		const publication = charger(params.id);

		deletePublication(publication.id);
		// Les commentaires liés partent avec (clé étrangère en cascade).
		audit(admin, 'publication.suppression', publication.title, publication.slug, locals.ipHash);

		redirect(303, '/admin/publications');
	}
};

import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPublication } from '$lib/server/content';
import { enregistrerALaUne } from '$lib/server/formulaires';
import { apercuPublication, ErreurFormulaire, lirePublication, valeursSaisies } from '$lib/server/formulaires';
import { audit, listAdminChoices } from '$lib/server/auth';

export const load: PageServerLoad = async () => ({
	admins: listAdminChoices().map(({ id, name, profile_public }) => ({
		id,
		name,
		profilePublic: !!profile_public
	}))
});

/** Crée la publication ; renvoie son identifiant, ou l'échec à afficher. */
async function creer({ request, locals }: RequestEvent) {
	const admin = locals.admin!;
	const form = await request.formData();
	try {
		const saisie = await lirePublication(form, admin.id, null);
		const id = createPublication(saisie, admin.id);
		audit(admin, 'publication.creation', saisie.title, saisie.status, locals.ipHash);
		return id;
	} catch (err) {
		if (err instanceof ErreurFormulaire) {
			return fail(400, { ...valeursSaisies(form), erreur: err.message });
		}
		throw err;
	}
}

export const actions: Actions = {
	creer: async (event) => {
		const id = await creer(event);
		if (typeof id !== 'number') return id;
		redirect(303, `/admin/publications/${id}?enregistre=1`);
	},

	// « Enregistrer et mettre à la une » : la publication est créée d'abord,
	// puis mise à la une si c'est possible. Ce qui l'empêche (un brouillon,
	// une une déjà pleine) est dit sur la page suivante, le texte étant déjà
	// enregistré.
	creerEtUne: async (event) => {
		const id = await creer(event);
		if (typeof id !== 'number') return id;
		const une = enregistrerALaUne(id, event.locals);
		redirect(303, `/admin/publications/${id}?enregistre=1&une=${une}`);
	},

	apercu: async ({ request }) => apercuPublication(await request.formData())
};

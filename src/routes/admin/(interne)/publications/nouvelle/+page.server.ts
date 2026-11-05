import { db } from '$lib/server/db';
import { getReview, reviewAction, ReviewError } from '$lib/server/reviews';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPublication } from '$lib/server/content';
import { enregistrerALaUne } from '$lib/server/formulaires';
import { apercuPublication, ErreurFormulaire, lirePublication, valeursSaisies } from '$lib/server/formulaires';
import { audit, listAdminChoices } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => ({
	currentAdminId: locals.admin!.id,
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
		const soumettre = form.get('articleAction') === 'submit';
		if (soumettre && (saisie.kind !== 'article' || (saisie.authorAdminId ?? admin.id) !== admin.id)) {
			throw new ReviewError('Seul l’auteur peut soumettre son article à validation.');
		}
		const base = db();
		base.exec('begin immediate');
		let id: number;
		try {
			id = createPublication(saisie, admin.id);
			if (soumettre) reviewAction(id, admin.id, 'author', getReview(id).revision, '', 0, 0, false);
			base.exec('commit');
		} catch (err) {
			base.exec('rollback');
			throw err;
		}
		audit(admin, 'publication.creation', saisie.title, saisie.status, locals.ipHash);
		return id;
	} catch (err) {
		if (err instanceof ErreurFormulaire || err instanceof ReviewError) {
			return fail(400, { ...valeursSaisies(form), erreur: err.message });
		}
		throw err;
	}
}

export const actions: Actions = {
	creer: async (event) => {
		const id = await creer(event);
		if (typeof id !== 'number') return id;
		if (getReview(id).author_approved_by) redirect(303, '/admin/verifications?onglet=mes-articles&soumis=1');
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

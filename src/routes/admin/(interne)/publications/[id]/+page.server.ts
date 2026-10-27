import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deletePublication, getById, positionALaUne, updatePublication } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import {
	apercuPublication,
	enregistrerALaUne,
	ErreurFormulaire,
	lirePublication,
	valeursSaisies
} from '$lib/server/formulaires';
import { audit, listAdminChoices } from '$lib/server/auth';

function charger(id: string) {
	const publication = getById(Number(id));
	if (!publication) error(404, 'Publication introuvable');
	return publication;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const publication = charger(params.id);
	return {
		publication: presentPublication(publication),
		admins: listAdminChoices().map(({ id, name, profile_public }) => ({
			id,
			name,
			profilePublic: !!profile_public
		})),
		corps: publication.body,
		positionUne: positionALaUne(publication.id),
		enregistre: url.searchParams.has('enregistre'),
		// Ce qu'a donné « Enregistrer et mettre à la une » : `ok`, `brouillon`
		// ou `pleine`.
		une: url.searchParams.get('une')
	};
};

/** Enregistre la publication ; renvoie `null`, ou l'échec à afficher. */
async function enregistrer({ request, params, locals }: RequestEvent<{ id: string }>) {
	const admin = locals.admin!;
	const publication = charger(params.id);
	const form = await request.formData();

	try {
		const saisie = await lirePublication(
			form,
			admin.id,
			publication.cover_media_id,
			publication.event_map_media_id
		);
		// L'URL n'est régénérée que si on le demande : les liens déjà partagés
		// sur les réseaux sociaux continuent de fonctionner.
		updatePublication(publication.id, saisie, { reslug: form.get('regenererUrl') === '1' });
		audit(admin, 'publication.modification', saisie.title, saisie.status, locals.ipHash);
		return null;
	} catch (err) {
		if (err instanceof ErreurFormulaire) {
			return fail(400, { ...valeursSaisies(form), erreur: err.message });
		}
		throw err;
	}
}

export const actions: Actions = {
	enregistrer: async (event) => {
		const echec = await enregistrer(event);
		if (echec) return echec;
		redirect(303, `/admin/publications/${event.params.id}?enregistre=1`);
	},

	// Enregistre d'abord, puis met à la une : le texte en cours n'est jamais
	// perdu, même quand la une refuse la fiche.
	enregistrerEtUne: async (event) => {
		const echec = await enregistrer(event);
		if (echec) return echec;
		const une = enregistrerALaUne(Number(event.params.id), event.locals);
		redirect(303, `/admin/publications/${event.params.id}?enregistre=1&une=${une}`);
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

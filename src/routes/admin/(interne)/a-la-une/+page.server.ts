import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/auth';
import {
	deplacerALaUne,
	getById,
	listALaUne,
	listForAdmin,
	mettreALaUne,
	MAX_A_LA_UNE,
	retirerDeLaUne
} from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async ({ url }) => {
	const recherche = url.searchParams.get('q') ?? '';
	return {
		max: MAX_A_LA_UNE,
		une: listALaUne().map((p) => ({ ...presentPublication(p), pinnedAt: p.pinned_at })),
		recherche,
		// Ce qu'on peut ajouter : les publications en ligne qui n'y sont pas
		// encore, les plus récentes d'abord, ou celles qui répondent à la recherche.
		candidates: listForAdmin({ status: 'published', pinned: false, search: recherche, limit: 10 }).map(
			presentPublication
		)
	};
};

export const actions: Actions = {
	ajouter: async ({ request, locals }) => {
		const publication = getById(Number((await request.formData()).get('id')));
		if (!publication) return fail(404, { erreur: 'Publication introuvable.' });
		try {
			mettreALaUne(publication.id);
		} catch (err) {
			return fail(400, { erreur: (err as Error).message });
		}
		audit(locals.admin!, 'une.ajout', publication.title, '', locals.ipHash);
		redirect(303, '/admin/a-la-une');
	},

	retirer: async ({ request, locals }) => {
		const publication = getById(Number((await request.formData()).get('id')));
		if (!publication) return fail(404, { erreur: 'Publication introuvable.' });
		retirerDeLaUne(publication.id);
		audit(locals.admin!, 'une.retrait', publication.title, '', locals.ipHash);
		redirect(303, '/admin/a-la-une');
	},

	deplacer: async ({ request, locals }) => {
		const form = await request.formData();
		const publication = getById(Number(form.get('id')));
		if (!publication) return fail(404, { erreur: 'Publication introuvable.' });
		const sens = form.get('sens') === 'haut' ? 'haut' : 'bas';
		deplacerALaUne(publication.id, sens);
		audit(locals.admin!, 'une.deplacement', publication.title, sens === 'haut' ? 'monte' : 'descend', locals.ipHash);
		redirect(303, '/admin/a-la-une');
	}
};

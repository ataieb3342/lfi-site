import type { PageServerLoad } from './$types';
import { listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async () => {
	const articles = listPublished({ kind: 'article', limit: 6 });
	// Tri « agenda » : les rendez-vous à venir passent devant.
	const actus = listPublished({ kind: 'actu', limit: 8, ordre: 'agenda' }).map(presentPublication);
	const aperos = listPublished({ kind: 'apero', limit: 3, ordre: 'agenda' }).map(presentPublication);

	return {
		articles: articles.map(presentPublication),
		actus,
		// Le prochain apéro ouvre le carrousel ; les autres rendez-vous suivent.
		prochainApero: aperos.find((a) => a.aVenir) ?? null,
		rendezVous: actus.filter((a) => a.aVenir)
	};
};

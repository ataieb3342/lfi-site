import type { PageServerLoad } from './$types';
import { listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async () => {
	const articles = listPublished({ kind: 'article', limit: 6 });
	// Tri « agenda » : les rendez-vous à venir passent devant.
	const actus = listPublished({ kind: 'actu', limit: 8, ordre: 'agenda' });

	return {
		articles: articles.map(presentPublication),
		actus: actus.map(presentPublication)
	};
};

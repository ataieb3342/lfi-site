import type { PageServerLoad } from './$types';
import { countPublished, listPublished, type CategorieEvenement } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import { KIND_PAR_RUBRIQUE, type Rubrique } from '$lib/rubriques';

const PAR_PAGE = 15;

export const load: PageServerLoad = async ({ params, url }) => {
	const rubrique = params.rubrique as Rubrique;
	const kind = KIND_PAR_RUBRIQUE[rubrique];
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const categorieDemandee = url.searchParams.get('categorie');
	const categorie =
		kind === 'actu' && ['action', 'reunion', 'formation'].includes(categorieDemandee ?? '')
			? (categorieDemandee as CategorieEvenement)
			: undefined;

	const total = countPublished(kind, categorie);
	const publications = listPublished({
		kind,
		eventCategory: categorie,
		limit: PAR_PAGE,
		offset: (page - 1) * PAR_PAGE,
		// Les actions à venir remontent en tête des actualités ; les articles
		// restent classés du plus récent au plus ancien.
		ordre: kind === 'actu' ? 'agenda' : 'chronologique'
	});

	return {
		rubrique,
		page,
		pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
		total,
		publications: publications.map(presentPublication),
		categorie: categorie ?? null
	};
};

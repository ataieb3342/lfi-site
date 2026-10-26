import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { countPublished, listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

/**
 * La première page s'ouvre sur l'article le plus récent en grand, puis une
 * grille de trois colonnes : 1 + 12, soit quatre rangées pleines. Les pages
 * suivantes n'ont pas de grand article, d'où douze.
 */
const PREMIERE_PAGE = 13;
const PAR_PAGE = 12;

/**
 * La seule liste servie ici est celle des articles : les apéros ont leur
 * page, et les événements sont dans l'agenda. Les anciennes listes redirigent,
 * filtres compris : /actualites?categorie=… n'a plus d'équivalent exact, et
 * l'agenda montre tous les rendez-vous avec leurs propres filtres.
 */
export const load: PageServerLoad = async ({ params, url }) => {
	if (params.rubrique === 'actualites') redirect(301, '/agenda');
	if (params.rubrique === 'revue-de-presse') redirect(301, '/articles');

	const total = countPublished('article');
	const pages = total <= PREMIERE_PAGE ? 1 : 1 + Math.ceil((total - PREMIERE_PAGE) / PAR_PAGE);
	// Le numéro de page est borné aux pages qui existent, comme dans la
	// bibliothèque. Sans cela, `?page=99` renvoyait une liste vide, indexable,
	// qui se désignait elle-même comme canonique : une page vide de plus aux
	// yeux du moteur, et autant qu'on peut taper de numéros.
	const page = Math.min(Math.max(1, Number(url.searchParams.get('page')) || 1), pages);
	const publications = listPublished({
		kind: 'article',
		limit: page === 1 ? PREMIERE_PAGE : PAR_PAGE,
		offset: page === 1 ? 0 : PREMIERE_PAGE + (page - 2) * PAR_PAGE
	});

	return {
		page,
		pages,
		total,
		publications: publications.map(presentPublication)
	};
};

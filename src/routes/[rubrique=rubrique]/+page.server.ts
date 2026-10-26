import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { countPublished, listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

const PAR_PAGE = 15;

/**
 * La seule liste servie ici est « À lire » (/articles) : les apéros ont leur
 * page, et les événements sont dans l'agenda. Les anciennes listes redirigent,
 * filtres compris : /actualites?categorie=… n'a plus d'équivalent exact, et
 * l'agenda montre tous les rendez-vous avec leurs propres filtres.
 */
export const load: PageServerLoad = async ({ params, url }) => {
	if (params.rubrique === 'actualites') redirect(301, '/agenda');
	if (params.rubrique === 'revue-de-presse') redirect(301, '/articles');

	const total = countPublished('article');
	const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
	// Le numéro de page est borné aux pages qui existent, comme dans la
	// bibliothèque. Sans cela, `?page=99` renvoyait une liste vide, indexable,
	// qui se désignait elle-même comme canonique : une page vide de plus aux
	// yeux du moteur, et autant qu'on peut taper de numéros.
	const page = Math.min(Math.max(1, Number(url.searchParams.get('page')) || 1), pages);
	const publications = listPublished({ kind: 'article', limit: PAR_PAGE, offset: (page - 1) * PAR_PAGE });

	return {
		page,
		pages,
		total,
		publications: publications.map(presentPublication)
	};
};

import type { PageServerLoad } from './$types';
import { countBibliotheque, listBibliotheque } from '$lib/server/content';
import { presentSource } from '$lib/server/present';

/**
 * Peu de ressources par page, volontairement : la bibliothèque se termine par
 * les deux cartes qui mènent à la boîte à outils et aux jeux, et on doit les
 * voir sans dérouler la page entière.
 */
const PAR_PAGE = 8;

export const load: PageServerLoad = async ({ url }) => {
	// La recherche passe par l'adresse : elle fonctionne donc sans JavaScript,
	// et un résultat se partage ou se met en favori.
	const recherche = (url.searchParams.get('q') ?? '').trim().slice(0, 100);

	const total = countBibliotheque(recherche);
	const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

	// Le numéro de page est borné aux pages qui existent : `?page=9` sur une
	// bibliothèque qui en compte deux affiche la dernière, et non une liste vide
	// accompagnée d'un « aucune ressource » qui serait faux.
	const page = Math.min(Math.max(1, Number(url.searchParams.get('page')) || 1), pages);

	return {
		page,
		pages,
		total,
		recherche,
		sources: listBibliotheque({
			limit: PAR_PAGE,
			offset: (page - 1) * PAR_PAGE,
			recherche
		}).map((source) => ({
			...presentSource(source),
			apero: {
				titre: source.publication_title,
				url: `/aperos/${source.publication_slug}`
			}
		}))
	};
};

import type { PageServerLoad } from './$types';
import { listForAdmin, type Kind, type Status } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async ({ url }) => {
	const kind = url.searchParams.get('type');
	const status = url.searchParams.get('etat');
	const recherche = url.searchParams.get('q') ?? '';
	// Événements et formations partagent le type 'actu' : leur catégorie
	// d'agenda les distingue.
	const categorie = kind === 'reunion' || kind === 'formation' ? kind : null;
	const kindInterne = categorie ? 'actu' : kind;

	return {
		filtres: { kind: kind ?? '', status: status ?? '', recherche },
		publications: listForAdmin({
			kind: kindInterne === 'article' || kindInterne === 'apero' || kindInterne === 'actu' ? (kindInterne as Kind) : undefined,
			status: status === 'draft' || status === 'published' ? (status as Status) : undefined,
			// « À la une » est rangé avec les états dans le filtre : c'est là
			// qu'on le cherche, à côté de « Publiés » et « Brouillons ».
			pinned: status === 'une' ? true : undefined,
			search: recherche
		})
			.map(presentPublication)
			.filter((publication) => !categorie || publication.eventCategory === categorie)
	};
};

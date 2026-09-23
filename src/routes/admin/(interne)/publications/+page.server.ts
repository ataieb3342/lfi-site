import type { PageServerLoad } from './$types';
import { listForAdmin, type Kind, type Status } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async ({ url }) => {
	const kind = url.searchParams.get('type');
	const status = url.searchParams.get('etat');
	const recherche = url.searchParams.get('q') ?? '';
	const categorie = kind === 'action' || kind === 'reunion' || kind === 'formation' ? kind : null;
	const kindInterne = categorie ? 'actu' : kind;

	return {
		filtres: { kind: kind ?? '', status: status ?? '', recherche },
		publications: listForAdmin({
			kind: kindInterne === 'article' || kindInterne === 'actu' || kindInterne === 'apero' || kindInterne === 'revue'
					? (kindInterne as Kind)
					: undefined,
			status: status === 'draft' || status === 'published' ? (status as Status) : undefined,
			search: recherche
		}).map(presentPublication).filter((publication) =>
			categorie
				? publication.eventCategory === categorie
				: kind === 'actu'
					? !['action', 'reunion', 'formation'].includes(publication.eventCategory)
					: true
		)
	};
};

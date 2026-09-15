import type { PageServerLoad } from './$types';
import { listForAdmin, type Kind, type Status } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

export const load: PageServerLoad = async ({ url }) => {
	const kind = url.searchParams.get('type');
	const status = url.searchParams.get('etat');
	const recherche = url.searchParams.get('q') ?? '';

	return {
		filtres: { kind: kind ?? '', status: status ?? '', recherche },
		publications: listForAdmin({
			kind: kind === 'article' || kind === 'actu' ? (kind as Kind) : undefined,
			status: status === 'draft' || status === 'published' ? (status as Status) : undefined,
			search: recherche
		}).map(presentPublication)
	};
};

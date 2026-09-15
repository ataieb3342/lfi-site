import type { PageServerLoad } from './$types';
import { listBibliotheque } from '$lib/server/content';
import { presentSource } from '$lib/server/present';

export const load: PageServerLoad = async () => ({
	sources: listBibliotheque().map((source) => ({
		...presentSource(source),
		apero: {
			titre: source.publication_title,
			url: `/aperos/${source.publication_slug}`
		}
	}))
});

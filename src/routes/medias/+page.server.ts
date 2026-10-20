import type { PageServerLoad } from './$types';
import { listMediasRecommandes } from '$lib/server/medias-recommandes';
import { presentMediaRecommande } from '$lib/server/present';

export const load: PageServerLoad = async () => ({
	medias: listMediasRecommandes().map(presentMediaRecommande)
});

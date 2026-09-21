import type { PageServerLoad } from './$types';
import { listPublicProfiles } from '$lib/server/auth';

export const load: PageServerLoad = async () => ({
	profils: listPublicProfiles().map((profil) => ({
		...profil,
		image: profil.image ? `/media/${profil.image}` : null
	}))
});

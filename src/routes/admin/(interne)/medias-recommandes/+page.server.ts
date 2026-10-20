import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/auth';
import { storeUpload } from '$lib/server/media';
import { presentMediaRecommande } from '$lib/server/present';
import {
	basculerAccueil,
	creerMediaRecommande,
	deplacerMediaRecommande,
	getMediaRecommande,
	lireChampsMediaRecommande,
	listMediasRecommandes,
	modifierMediaRecommande,
	supprimerMediaRecommande
} from '$lib/server/medias-recommandes';

export const load: PageServerLoad = async () => ({
	medias: listMediasRecommandes().map(presentMediaRecommande)
});

/**
 * Enregistre le logo s'il y en a un. Il passe par `storeUpload`, comme toute
 * image du site : type lu dans les premiers octets, SVG refusé.
 */
async function logoEnvoye(form: FormData, nom: string, adminId: number): Promise<number | null> {
	const fichier = form.get('logo');
	if (!(fichier instanceof File) || fichier.size === 0) return null;
	const media = await storeUpload(fichier, `Logo de ${nom}`, adminId);
	return media.id;
}

export const actions: Actions = {
	ajouter: async ({ request, locals }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const champs = lireChampsMediaRecommande(form);
		if ('erreur' in champs) return fail(400, { erreur: champs.erreur });
		try {
			const logo = await logoEnvoye(form, champs.nom, admin.id);
			creerMediaRecommande(champs, logo);
		} catch (err) {
			return fail(400, { erreur: (err as Error).message });
		}
		audit(admin, 'media-recommande.ajout', champs.nom, champs.lien, locals.ipHash);
		redirect(303, '/admin/medias-recommandes');
	},

	modifier: async ({ request, locals }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!getMediaRecommande(id)) return fail(404, { erreur: 'Média introuvable.' });
		const champs = lireChampsMediaRecommande(form);
		if ('erreur' in champs) return fail(400, { erreur: champs.erreur, id });
		try {
			const logo = await logoEnvoye(form, champs.nom, admin.id);
			modifierMediaRecommande(id, champs, logo);
		} catch (err) {
			return fail(400, { erreur: (err as Error).message, id });
		}
		audit(admin, 'media-recommande.modification', champs.nom, champs.lien, locals.ipHash);
		redirect(303, '/admin/medias-recommandes');
	},

	accueil: async ({ request, locals }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const media = getMediaRecommande(Number(form.get('id')));
		if (!media) return fail(404, { erreur: 'Média introuvable.' });
		const accueil = form.get('accueil') === '1';
		basculerAccueil(media.id, accueil);
		audit(admin, 'media-recommande.accueil', media.nom, accueil ? 'affiché' : 'retiré', locals.ipHash);
		redirect(303, '/admin/medias-recommandes');
	},

	deplacer: async ({ request }) => {
		const form = await request.formData();
		deplacerMediaRecommande(Number(form.get('id')), form.get('sens') === 'haut' ? 'haut' : 'bas');
		redirect(303, '/admin/medias-recommandes');
	},

	supprimer: async ({ request, locals }) => {
		const admin = locals.admin!;
		const media = getMediaRecommande(Number((await request.formData()).get('id')));
		if (!media) return fail(404, { erreur: 'Média introuvable.' });
		// Le logo reste dans Administration → Images : il y redevient
		// supprimable, puisque plus rien ne l'utilise.
		supprimerMediaRecommande(media.id);
		audit(admin, 'media-recommande.suppression', media.nom, media.lien, locals.ipHash);
		redirect(303, '/admin/medias-recommandes');
	}
};

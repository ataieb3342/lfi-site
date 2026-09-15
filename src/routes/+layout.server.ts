import type { LayoutServerLoad } from './$types';
import { getSettings } from '$lib/server/settings';
import { modeDemo } from '$lib/server/demo';

export const load: LayoutServerLoad = async ({ locals }) => {
	const settings = getSettings();
	return {
		settings: {
			siteName: settings.site_name,
			tagline: settings.site_tagline,
			description: settings.site_description,
			contactEmail: settings.contact_email
		},
		app: {
			actif: settings.app_bandeau_actif === '1',
			android: settings.app_url_android,
			ios: settings.app_url_ios
		},
		// Cadre des apéros thématiques : rythme, heure et lieu habituels.
		apero: {
			rythme: settings.apero_rythme,
			heure: settings.apero_heure,
			lieu: settings.apero_lieu,
			adresse: settings.apero_adresse,
			presentation: settings.apero_presentation
		},
		// Vrai sur le site de démonstration : affiche le bandeau « contenus fictifs ».
		demo: modeDemo(),
		// Affichage choisi : 'clair', 'sombre' ou 'auto'. Sert à marquer le bouton actif.
		theme: locals.theme,
		admin: locals.admin
			? { id: locals.admin.id, displayName: locals.admin.displayName, role: locals.admin.role }
			: null
	};
};

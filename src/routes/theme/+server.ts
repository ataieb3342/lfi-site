import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { THEME_COOKIE, lireTheme } from '$lib/server/theme';

/**
 * Enregistre le choix d'affichage (clair, sombre, automatique) envoyé par le
 * petit formulaire du pied de page, puis renvoie sur la page d'où l'on vient.
 * C'est un formulaire ordinaire : cela fonctionne sans JavaScript.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const form = await request.formData();
	const theme = lireTheme(String(form.get('theme') ?? ''));

	if (theme === 'auto') {
		cookies.delete(THEME_COOKIE, { path: '/' });
	} else {
		cookies.set(THEME_COOKIE, theme, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 365 * 24 * 3600
		});
	}

	// Retour à la page d'origine, à condition qu'elle soit bien sur ce site :
	// on ne suit jamais une adresse extérieure fournie par une requête.
	let retour = '/';
	const origine = request.headers.get('referer');
	if (origine) {
		try {
			const u = new URL(origine);
			if (u.origin === url.origin) retour = u.pathname + u.search;
		} catch {
			// Adresse illisible : on retourne à l'accueil.
		}
	}
	redirect(303, retour);
};

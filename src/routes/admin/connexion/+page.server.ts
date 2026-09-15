import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit, createSession, login, setSessionCookie } from '$lib/server/auth';
import { installationRequise } from '$lib/server/installation';
import { DEMO_IDENTIFIANT, demoCodeActuel, demoMotDePasse, modeDemo } from '$lib/server/demo';

/** N'accepte qu'une destination interne : évite une redirection ouverte. */
function destinationSure(suite: string | null): string {
	return suite && suite.startsWith('/admin') && !suite.startsWith('//') ? suite : '/admin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (installationRequise()) redirect(303, '/admin/installation');
	if (locals.admin) redirect(303, destinationSure(url.searchParams.get('suite')));
	return {
		suite: url.searchParams.get('suite') ?? '',
		// Sur le site de démonstration, les identifiants du compte de test sont
		// affichés : n'importe qui peut essayer l'administration.
		demo: modeDemo()
			? { identifiant: DEMO_IDENTIFIANT, motDePasse: demoMotDePasse(), code: demoCodeActuel() }
			: null
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, locals, url }) => {
		const form = await request.formData();
		const identifiant = String(form.get('identifiant') ?? '');
		const motDePasse = String(form.get('mot_de_passe') ?? '');
		const code = String(form.get('code') ?? '');
		const suite = String(form.get('suite') ?? '');

		const resultat = await login(identifiant, motDePasse, code, locals.ipHash);

		if (!resultat.ok) {
			audit(null, 'connexion.echec', identifiant, resultat.reason, locals.ipHash);

			if (resultat.reason === 'locked') {
				const minutes = Math.ceil((resultat.retryAfterSec ?? 60) / 60);
				return fail(429, {
					identifiant,
					erreur: `Trop de tentatives. Réessayez dans ${minutes} minute(s).`
				});
			}
			// Message volontairement identique dans tous les cas : il ne faut pas
			// révéler si l'identifiant existe, ni si le mot de passe était bon.
			return fail(400, { identifiant, erreur: 'Identifiant, mot de passe ou code incorrect.' });
		}

		const jeton = createSession(resultat.admin.id, locals.ipHash, request.headers.get('user-agent') ?? '');
		setSessionCookie(cookies, jeton, url.protocol === 'https:');
		audit(resultat.admin, 'connexion.reussie', resultat.admin.username, '', locals.ipHash);

		redirect(303, destinationSure(suite || null));
	}
};

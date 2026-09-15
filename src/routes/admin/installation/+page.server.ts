import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit, createAdmin, createSession, setSessionCookie } from '$lib/server/auth';
import {
	installationRequise,
	jetonInstallationValide,
	supprimerJetonInstallation
} from '$lib/server/installation';
import { rateLimit, rateLimitPeek } from '$lib/server/ratelimit';

export const load: PageServerLoad = async () => {
	// Dès qu'un compte existe, cette page disparaît définitivement.
	if (!installationRequise()) redirect(303, '/admin/connexion');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, locals, url }) => {
		if (!installationRequise()) redirect(303, '/admin/connexion');

		// Le jeton d'installation est court : on limite fortement les essais.
		const seau = `installation:${locals.ipHash}`;
		if (!rateLimitPeek(seau, 5, 30 * 60_000).ok) {
			return fail(429, {
				identifiant: '',
				nom: '',
				erreur: 'Trop de tentatives. Réessayez dans une demi-heure.'
			});
		}

		const form = await request.formData();
		const jeton = String(form.get('jeton') ?? '');
		const identifiant = String(form.get('identifiant') ?? '');
		const nom = String(form.get('nom') ?? '');
		const motDePasse = String(form.get('mot_de_passe') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');

		const renvoi = { identifiant, nom };

		if (!jetonInstallationValide(jeton)) {
			rateLimit(seau, 5, 30 * 60_000);
			audit(null, 'installation.jeton_invalide', '', '', locals.ipHash);
			return fail(400, { ...renvoi, erreur: "Jeton d'installation incorrect." });
		}
		if (motDePasse !== confirmation) {
			return fail(400, { ...renvoi, erreur: 'Les deux mots de passe ne correspondent pas.' });
		}

		let adminId: number;
		try {
			adminId = await createAdmin({
				username: identifiant,
				displayName: nom,
				password: motDePasse,
				role: 'owner'
			});
		} catch (err) {
			return fail(400, { ...renvoi, erreur: (err as Error).message });
		}

		supprimerJetonInstallation();
		audit({ id: adminId, username: identifiant }, 'installation.compte_cree', identifiant, '', locals.ipHash);

		const session = createSession(adminId, locals.ipHash, request.headers.get('user-agent') ?? '');
		setSessionCookie(cookies, session, url.protocol === 'https:');

		redirect(303, '/admin/double-authentification');
	}
};

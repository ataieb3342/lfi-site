import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { countPendingComments, countPendingSources } from '$lib/server/content';

/** Pages accessibles avant d'avoir activé la double authentification. */
const AVANT_2FA = ['/admin/double-authentification', '/admin/deconnexion'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// La garde d'accès principale est dans src/hooks.server.ts ; ce test rassure
	// TypeScript et couvre le cas d'un appel direct.
	if (!locals.admin) redirect(303, '/admin/connexion');

	// La double authentification n'est pas optionnelle : tant qu'elle n'est pas
	// activée, le seul écran accessible est celui qui permet de l'activer.
	if (!locals.admin.totpEnabled && !AVANT_2FA.includes(url.pathname)) {
		redirect(303, '/admin/double-authentification');
	}

	return {
		adminCourant: {
			id: locals.admin.id,
			username: locals.admin.username,
			displayName: locals.admin.displayName,
			role: locals.admin.role,
			totpEnabled: locals.admin.totpEnabled
		},
		commentairesEnAttente: countPendingComments(),
		sourcesEnAttente: countPendingSources()
	};
};

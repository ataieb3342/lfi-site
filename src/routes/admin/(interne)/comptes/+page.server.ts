import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	audit,
	countOwners,
	createAdmin,
	disableAdmin,
	enableAdmin,
	getAdmin,
	listAdmins,
	resetTotp,
	setPassword,
	destroyAllSessions
} from '$lib/server/auth';
import { randomToken } from '$lib/server/crypto';

/** Seul un compte « responsable » gère les autres comptes. */
function exigerResponsable(role: string) {
	if (role !== 'owner') error(403, 'Réservé aux responsables du site.');
}

export const load: PageServerLoad = async ({ locals }) => {
	exigerResponsable(locals.admin!.role);

	return {
		comptes: listAdmins().map((a) => ({
			id: a.id,
			username: a.username,
			displayName: a.display_name,
			role: a.role,
			totpActive: !!a.totp_confirmed_at,
			desactive: !!a.disabled_at,
			creeLe: a.created_at,
			derniereConnexion: a.last_login_at
		}))
	};
};

export const actions: Actions = {
	creer: async ({ request, locals }) => {
		exigerResponsable(locals.admin!.role);
		const admin = locals.admin!;
		const form = await request.formData();

		const username = String(form.get('username') ?? '');
		const displayName = String(form.get('displayName') ?? '');
		const role = form.get('role') === 'owner' ? 'owner' : 'admin';
		// Mot de passe provisoire tiré au sort : personne n'a à en inventer un,
		// et il est transmis de vive voix puis changé à la première connexion.
		const motDePasse = randomToken(12);

		try {
			const id = await createAdmin({ username, displayName, password: motDePasse, role });
			audit(admin, 'compte.creation', username, role, locals.ipHash);
			return { creation: { username, motDePasse, id } };
		} catch (err) {
			return fail(400, { erreur: (err as Error).message });
		}
	},

	desactiver: async ({ request, locals }) => {
		exigerResponsable(locals.admin!.role);
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const cible = getAdmin(id);
		if (!cible) return fail(404, { erreur: 'Compte introuvable.' });

		if (cible.id === admin.id) {
			return fail(400, { erreur: 'Vous ne pouvez pas désactiver votre propre compte.' });
		}
		if (cible.role === 'owner' && countOwners() <= 1) {
			return fail(400, { erreur: 'Il doit rester au moins un responsable actif.' });
		}

		disableAdmin(cible.id);
		audit(admin, 'compte.desactivation', cible.username, '', locals.ipHash);
		redirect(303, '/admin/comptes');
	},

	reactiver: async ({ request, locals }) => {
		exigerResponsable(locals.admin!.role);
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const cible = getAdmin(id);
		if (!cible) return fail(404, { erreur: 'Compte introuvable.' });

		enableAdmin(cible.id);
		audit(admin, 'compte.reactivation', cible.username, '', locals.ipHash);
		redirect(303, '/admin/comptes');
	},

	reinitialiserMotDePasse: async ({ request, locals }) => {
		exigerResponsable(locals.admin!.role);
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const cible = getAdmin(id);
		if (!cible) return fail(404, { erreur: 'Compte introuvable.' });

		const motDePasse = randomToken(12);
		await setPassword(cible.id, motDePasse);
		destroyAllSessions(cible.id);
		audit(admin, 'compte.reinitialisation_mdp', cible.username, '', locals.ipHash);

		return { creation: { username: cible.username, motDePasse, id: cible.id } };
	},

	reinitialiser2fa: async ({ request, locals }) => {
		exigerResponsable(locals.admin!.role);
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const cible = getAdmin(id);
		if (!cible) return fail(404, { erreur: 'Compte introuvable.' });

		resetTotp(cible.id);
		audit(admin, 'compte.reinitialisation_2fa', cible.username, '', locals.ipHash);
		redirect(303, '/admin/comptes');
	}
};

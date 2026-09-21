import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	audit,
	createSession,
	destroyAllSessions,
	findAdminByUsername,
	listSessions,
	resetTotp,
	setPassword,
	setSessionCookie,
	updateProfile
} from '$lib/server/auth';
import { verifyPassword } from '$lib/server/crypto';
import { rateLimit, rateLimitPeek } from '$lib/server/ratelimit';
import { getMedia, storeUpload } from '$lib/server/media';

export const load: PageServerLoad = async ({ locals, url }) => {
	const admin = locals.admin!;
	const compte = findAdminByUsername(admin.username)!;
	const image = compte.profile_media_id ? getMedia(compte.profile_media_id) : undefined;
	return {
		profil: {
			nom: compte.profile_name,
			role: compte.profile_role,
			bio: compte.profile_bio,
			emoji: compte.profile_emoji,
			image: image ? `/media/${image.filename}` : null,
			visible: compte.profile_visible === 1
		},
		sessions: listSessions(admin.id).map((s) => ({
			courante: s.id === admin.sessionId,
			creeLe: s.created_at,
			expireLe: s.expires_at,
			navigateur: s.user_agent
		})),
		enregistre: url.searchParams.has('enregistre')
	};
};

export const actions: Actions = {
	enregistrerProfil: async ({ request, locals }) => {
		const admin = locals.admin!;
		const actuel = findAdminByUsername(admin.username)!;
		const form = await request.formData();
		const fichier = form.get('image');
		let mediaId = form.get('supprimer_image') === '1' ? null : actuel.profile_media_id;

		if (fichier instanceof File && fichier.size > 0) {
			try {
				mediaId = (await storeUpload(fichier, `Portrait de ${String(form.get('nom') ?? '')}`, admin.id)).id;
			} catch (err) {
				return fail(400, { erreur: (err as Error).message });
			}
		}

		updateProfile(admin.id, {
			name: String(form.get('nom') ?? '').trim(),
			role: String(form.get('role') ?? '').trim(),
			bio: String(form.get('bio') ?? '').trim(),
			emoji: String(form.get('emoji') ?? '').trim(),
			mediaId,
			visible: form.get('visible') === '1'
		});
		audit(admin, 'compte.profil', admin.username, '', locals.ipHash);
		redirect(303, '/admin/mon-compte?enregistre=1');
	},

	changerMotDePasse: async ({ request, locals, cookies, url }) => {
		const admin = locals.admin!;
		const seau = `mdp:${admin.id}`;
		if (!rateLimitPeek(seau, 5, 15 * 60_000).ok) {
			return fail(429, { erreur: 'Trop de tentatives. Patientez quelques minutes.' });
		}

		const form = await request.formData();
		const actuel = String(form.get('actuel') ?? '');
		const nouveau = String(form.get('nouveau') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');

		const ligne = findAdminByUsername(admin.username)!;
		if (!(await verifyPassword(actuel, ligne.password_hash))) {
			rateLimit(seau, 5, 15 * 60_000);
			return fail(400, { erreur: 'Mot de passe actuel incorrect.' });
		}
		if (nouveau !== confirmation) {
			return fail(400, { erreur: 'Les deux nouveaux mots de passe ne correspondent pas.' });
		}
		if (nouveau === actuel) {
			return fail(400, { erreur: 'Le nouveau mot de passe doit être différent de l’ancien.' });
		}

		try {
			await setPassword(admin.id, nouveau);
		} catch (err) {
			return fail(400, { erreur: (err as Error).message });
		}

		// Toutes les sessions sont coupées puis une seule est rouverte ici :
		// si quelqu'un d'autre était connecté avec l'ancien mot de passe, il est
		// éjecté immédiatement.
		destroyAllSessions(admin.id);
		const jeton = createSession(admin.id, locals.ipHash, request.headers.get('user-agent') ?? '');
		setSessionCookie(cookies, jeton, url.protocol === 'https:');

		audit(admin, 'compte.changement_mdp', admin.username, '', locals.ipHash);
		redirect(303, '/admin/mon-compte?enregistre=1');
	},

	fermerAutresSessions: async ({ request, locals, cookies, url }) => {
		const admin = locals.admin!;
		destroyAllSessions(admin.id);
		const jeton = createSession(admin.id, locals.ipHash, request.headers.get('user-agent') ?? '');
		setSessionCookie(cookies, jeton, url.protocol === 'https:');
		audit(admin, 'compte.fermeture_sessions', admin.username, '', locals.ipHash);
		redirect(303, '/admin/mon-compte?enregistre=1');
	},

	reconfigurer2fa: async ({ request, locals }) => {
		const admin = locals.admin!;
		const motDePasse = String((await request.formData()).get('mot_de_passe') ?? '');
		const ligne = findAdminByUsername(admin.username)!;

		if (!(await verifyPassword(motDePasse, ligne.password_hash))) {
			return fail(400, { erreur: 'Mot de passe incorrect.' });
		}

		// resetTotp coupe toutes les sessions : il faudra se reconnecter, puis
		// l'écran d'activation obligatoire s'affichera.
		resetTotp(admin.id);
		audit(admin, '2fa.reinitialisation', admin.username, '', locals.ipHash);
		redirect(303, '/admin/connexion');
	}
};

import { fail, redirect } from '@sveltejs/kit';
import QRCode from 'qrcode';
import type { Actions, PageServerLoad } from './$types';
import {
	audit,
	confirmTotp,
	findAdminByUsername,
	readTotpSecret,
	storeTotpSecret
} from '$lib/server/auth';
import { generateTotpSecret, totpUri, verifyTotp } from '$lib/server/totp';
import { getSetting } from '$lib/server/settings';
import { rateLimit, rateLimitPeek } from '$lib/server/ratelimit';

export const load: PageServerLoad = async ({ locals }) => {
	const admin = locals.admin!;
	if (admin.totpEnabled) redirect(303, '/admin/mon-compte');

	const ligne = findAdminByUsername(admin.username)!;

	// On réutilise le secret déjà généré s'il existe : ainsi, recharger la page
	// n'invalide pas le QR code déjà scanné.
	let secret = readTotpSecret(ligne);
	if (!secret) {
		secret = generateTotpSecret();
		storeTotpSecret(admin.id, secret);
	}

	const uri = totpUri(secret, admin.username, getSetting('site_name'));

	return {
		secret,
		// Groupes de 4 caractères : la saisie manuelle est bien plus fiable.
		secretLisible: secret.replace(/(.{4})/g, '$1 ').trim(),
		qr: await QRCode.toDataURL(uri, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const admin = locals.admin!;
		const seau = `2fa:${admin.id}`;
		if (!rateLimitPeek(seau, 10, 15 * 60_000).ok) {
			return fail(429, { erreur: 'Trop de tentatives. Patientez quelques minutes.' });
		}

		const form = await request.formData();
		const code = String(form.get('code') ?? '');

		const ligne = findAdminByUsername(admin.username)!;
		const secret = readTotpSecret(ligne);

		if (!secret || !verifyTotp(secret, code)) {
			rateLimit(seau, 10, 15 * 60_000);
			return fail(400, { erreur: 'Code incorrect. Vérifiez l’heure de votre téléphone.' });
		}

		confirmTotp(admin.id);
		audit(admin, '2fa.activee', admin.username, '', locals.ipHash);
		redirect(303, '/admin');
	}
};

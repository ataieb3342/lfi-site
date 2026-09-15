import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	blockIpHash,
	deleteComment,
	getComment,
	listBlockedIps,
	listCommentsForModeration,
	moderateComment,
	rejectAllFromIpHash,
	unblockIpHash
} from '$lib/server/content';
import { audit } from '$lib/server/auth';
import { RUBRIQUE_PAR_KIND } from '$lib/rubriques';

const ETATS = ['pending', 'approved', 'rejected'] as const;
type Etat = (typeof ETATS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const brut = url.searchParams.get('etat');
	const etat: Etat = (ETATS as readonly string[]).includes(brut ?? '') ? (brut as Etat) : 'pending';

	return {
		etat,
		commentaires: listCommentsForModeration(etat).map((c) => ({
			id: c.id,
			auteur: c.author_name,
			corps: c.body,
			creeLe: c.created_at,
			// Empreinte tronquée : suffit à repérer un envoi en série sans
			// afficher d'identifiant complet.
			empreinte: c.ip_hash,
			empreinteCourte: c.ip_hash.slice(0, 8),
			publicationTitre: c.publication_title,
			publicationLien: `/${RUBRIQUE_PAR_KIND[c.publication_kind]}/${c.publication_slug}`
		})),
		bloquees: listBlockedIps()
	};
};

function retour(url: URL) {
	redirect(303, `/admin/commentaires?etat=${url.searchParams.get('etat') ?? 'pending'}`);
}

export const actions: Actions = {
	approuver: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const commentaire = getComment(id);
		if (!commentaire) return fail(404, { erreur: 'Commentaire introuvable.' });

		moderateComment(id, 'approved', admin.id);
		audit(admin, 'commentaire.publication', String(id), commentaire.body.slice(0, 120), locals.ipHash);
		retour(url);
	},

	rejeter: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const commentaire = getComment(id);
		if (!commentaire) return fail(404, { erreur: 'Commentaire introuvable.' });

		moderateComment(id, 'rejected', admin.id);
		audit(admin, 'commentaire.rejet', String(id), commentaire.body.slice(0, 120), locals.ipHash);
		retour(url);
	},

	supprimer: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const commentaire = getComment(id);
		if (!commentaire) return fail(404, { erreur: 'Commentaire introuvable.' });

		deleteComment(id);
		audit(admin, 'commentaire.suppression', String(id), commentaire.body.slice(0, 120), locals.ipHash);
		retour(url);
	},

	// Face à un envoi en rafale : on rejette d'un coup tout ce qui vient de la
	// même origine et on bloque les envois suivants.
	bloquerOrigine: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const empreinte = String(form.get('empreinte') ?? '');
		if (!/^[a-f0-9]{64}$/.test(empreinte)) return fail(400, { erreur: 'Empreinte invalide.' });

		const rejetes = rejectAllFromIpHash(empreinte, admin.id);
		blockIpHash(empreinte, `Bloqué par ${admin.username}`);
		audit(admin, 'origine.blocage', empreinte.slice(0, 12), `${rejetes} commentaire(s) rejeté(s)`, locals.ipHash);
		retour(url);
	},

	debloquerOrigine: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const empreinte = String((await request.formData()).get('empreinte') ?? '');
		unblockIpHash(empreinte);
		audit(admin, 'origine.deblocage', empreinte.slice(0, 12), '', locals.ipHash);
		retour(url);
	}
};

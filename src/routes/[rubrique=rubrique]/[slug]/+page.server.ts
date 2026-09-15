import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createComment,
	getBySlugAnyStatus,
	isIpBlocked,
	listApprovedComments
} from '$lib/server/content';
import { presentComment, presentPublication } from '$lib/server/present';
import { renderMarkdown, toPlainText } from '$lib/server/markdown';
import { createChallenge, verifySolution } from '$lib/server/captcha';
import { rateLimit, rateLimitPeek } from '$lib/server/ratelimit';
import { commentsGloballyOpen, preModerationEnabled } from '$lib/server/settings';
import { KIND_PAR_RUBRIQUE, type Rubrique } from '$lib/rubriques';

const CORPS_MIN = 2;
const CORPS_MAX = 3000;
const PSEUDO_MAX = 60;

/** Formulaire remis à zéro après un envoi accepté. */
const VIDE = { pseudo: '', corps: '', erreur: '' };

// Quotas d'envoi par personne (identifiée par l'empreinte de son IP).
const QUOTA_COURT = { limite: 3, fenetreMs: 10 * 60_000 };
const QUOTA_JOUR = { limite: 20, fenetreMs: 24 * 3600_000 };
// Sans preuve de travail (JavaScript désactivé), le rythme autorisé est réduit.
const QUOTA_SANS_PREUVE = { limite: 1, fenetreMs: 15 * 60_000 };

export const load: PageServerLoad = async ({ params, locals }) => {
	const publication = getBySlugAnyStatus(params.slug);
	const kindAttendu = KIND_PAR_RUBRIQUE[params.rubrique as Rubrique];

	if (!publication || publication.kind !== kindAttendu) {
		error(404, 'Page introuvable');
	}
	// Un brouillon n'est visible que par un administrateur connecté (aperçu).
	if (publication.status !== 'published' && !locals.admin) {
		error(404, 'Page introuvable');
	}

	const vue = presentPublication(publication);
	const commentairesOuverts = commentsGloballyOpen() && vue.commentsOpen;

	return {
		publication: vue,
		corpsHtml: renderMarkdown(publication.body),
		resume: vue.summary || toPlainText(publication.body, 200),
		commentaires: listApprovedComments(publication.id).map(presentComment),
		commentairesOuverts,
		preModeration: preModerationEnabled(),
		defi: commentairesOuverts ? createChallenge() : null,
		apercu: publication.status !== 'published',
		// Une fiche d'apéro sans texte : le résumé n'a pas encore été écrit.
		sansTexte: publication.body.trim().length === 0
	};
};

export const actions: Actions = {
	commenter: async ({ request, params, locals }) => {
		const publication = getBySlugAnyStatus(params.slug);
		const kindAttendu = KIND_PAR_RUBRIQUE[params.rubrique as Rubrique];

		if (!publication || publication.kind !== kindAttendu || publication.status !== 'published') {
			error(404, 'Page introuvable');
		}
		if (!commentsGloballyOpen() || !publication.comments_open) {
			return fail(403, { erreur: 'Les commentaires sont fermés sur cette publication.' });
		}

		const form = await request.formData();
		const pseudo = String(form.get('pseudo') ?? '').trim();
		const corps = String(form.get('corps') ?? '').trim();
		const preuve = String(form.get('preuve') ?? '');
		const piege = String(form.get('site') ?? '');

		const renvoi = { pseudo, corps, erreur: '' };

		// Champ-piège : invisible pour un humain, rempli par la plupart des
		// robots. On répond « merci » sans rien enregistrer, pour ne pas
		// apprendre au robot que sa tentative a échoué.
		if (piege) return { ...VIDE, succes: true, enAttente: true };

		if (isIpBlocked(locals.ipHash)) {
			return { ...VIDE, succes: true, enAttente: true };
		}

		if (corps.length < CORPS_MIN) {
			return fail(400, { ...renvoi, erreur: 'Votre message est vide.' });
		}
		if (corps.length > CORPS_MAX) {
			return fail(400, { ...renvoi, erreur: `Message trop long (maximum ${CORPS_MAX} caractères).` });
		}
		if (pseudo.length > PSEUDO_MAX) {
			return fail(400, { ...renvoi, erreur: 'Le pseudonyme est trop long.' });
		}
		// Un message presque entièrement composé de liens est du spam.
		const liens = corps.match(/https?:\/\//gi)?.length ?? 0;
		if (liens > 3) {
			return fail(400, { ...renvoi, erreur: 'Trop de liens dans ce message.' });
		}

		const preuveValide = preuve ? verifySolution(preuve) : false;

		const quotas = preuveValide
			? [
					{ ...QUOTA_COURT, bucket: `commentaire:court:${locals.ipHash}` },
					{ ...QUOTA_JOUR, bucket: `commentaire:jour:${locals.ipHash}` }
				]
			: [
					{ ...QUOTA_SANS_PREUVE, bucket: `commentaire:sanspreuve:${locals.ipHash}` },
					{ ...QUOTA_JOUR, bucket: `commentaire:jour:${locals.ipHash}` }
				];

		for (const quota of quotas) {
			if (!rateLimitPeek(quota.bucket, quota.limite, quota.fenetreMs).ok) {
				const attente = rateLimitPeek(quota.bucket, quota.limite, quota.fenetreMs).retryAfterSec;
				return fail(429, {
					...renvoi,
					erreur: `Vous avez envoyé plusieurs messages coup sur coup. Réessayez dans ${Math.ceil(attente / 60)} minute(s).`
				});
			}
		}
		for (const quota of quotas) rateLimit(quota.bucket, quota.limite, quota.fenetreMs);

		// Sans preuve de travail valide, le message passe toujours par la
		// modération, même si le site est réglé en publication immédiate.
		const enAttente = preModerationEnabled() || !preuveValide;

		createComment({
			publicationId: publication.id,
			authorName: pseudo,
			body: corps,
			status: enAttente ? 'pending' : 'approved',
			ipHash: locals.ipHash,
			userAgent: request.headers.get('user-agent') ?? ''
		});

		return { ...VIDE, succes: true, enAttente };
	}
};

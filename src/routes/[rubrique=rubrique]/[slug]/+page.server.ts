import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createComment,
	createSource,
	getBySlugAnyStatus,
	isIpBlocked,
	listApprovedComments,
	listApprovedSources
} from '$lib/server/content';
import { presentComment, presentPublication, presentSource } from '$lib/server/present';
import { audit } from '$lib/server/auth';
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

// Une source partagée avant un apéro : un titre, un lien facultatif, un mot.
const SOURCE_TITRE_MAX = 120;
const SOURCE_LIEN_MAX = 500;
const SOURCE_NOTE_MAX = 300;
/** Formulaire de source remis à zéro après un envoi accepté. */
const SOURCE_VIDE = { formulaire: 'source' as const, titre: '', lien: '', note: '', pseudoSource: '', erreurSource: '' };

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
		sansTexte: publication.body.trim().length === 0,
		// Le dossier partagé n'existe que pour les apéros.
		sources: publication.kind === 'apero' ? listApprovedSources(publication.id).map(presentSource) : [],
		defiSource: publication.kind === 'apero' && publication.status === 'published' ? createChallenge() : null,
		// Un administrateur connecté publie ses sources sans relecture.
		sourceDirecte: !!locals.admin
	};
};

/**
 * Le lien d'une source doit être une adresse web. Sans ce contrôle, un
 * « javascript:… » collé dans le formulaire s'exécuterait au clic du visiteur
 * une fois la source publiée. Renvoie l'adresse normalisée, ou null.
 */
function lienValide(brut: string): string | null {
	if (!brut) return '';
	// Tolérance : « lemonde.fr/article » sans le « https:// » devant.
	const candidat = /^[a-z][a-z0-9+.-]*:/i.test(brut) ? brut : `https://${brut}`;
	try {
		const url = new URL(candidat);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
		if (!url.hostname.includes('.')) return null;
		return url.href;
	} catch {
		return null;
	}
}

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
	},

	/**
	 * Proposer une source pour préparer un apéro. Mêmes garde-fous que pour un
	 * commentaire (champ-piège, origine bloquée, preuve de travail, quotas),
	 * mais la relecture est systématique pour les visiteurs : une liste de
	 * liens publiée sans regard humain est une invitation à l'hameçonnage.
	 * Un administrateur connecté, lui, publie directement.
	 */
	partagerSource: async ({ request, params, locals }) => {
		const publication = getBySlugAnyStatus(params.slug);
		const kindAttendu = KIND_PAR_RUBRIQUE[params.rubrique as Rubrique];

		if (!publication || publication.kind !== kindAttendu || publication.status !== 'published') {
			error(404, 'Page introuvable');
		}
		if (publication.kind !== 'apero') {
			return fail(403, { ...SOURCE_VIDE, erreurSource: 'Seuls les apéros ont un dossier de sources.' });
		}

		const form = await request.formData();
		const titre = String(form.get('titre') ?? '').trim();
		const lienBrut = String(form.get('lien') ?? '').trim();
		const note = String(form.get('note') ?? '').trim();
		const pseudoSource = String(form.get('pseudoSource') ?? '').trim();
		const preuve = String(form.get('preuve') ?? '');
		const piege = String(form.get('site') ?? '');

		const renvoi = { formulaire: 'source' as const, titre, lien: lienBrut, note, pseudoSource, erreurSource: '' };

		if (piege) return { ...SOURCE_VIDE, succesSource: true, enAttenteSource: true };
		if (isIpBlocked(locals.ipHash)) {
			return { ...SOURCE_VIDE, succesSource: true, enAttenteSource: true };
		}

		if (titre.length < 2) {
			return fail(400, { ...renvoi, erreurSource: 'Indiquez au moins un titre : celui du livre, de la vidéo, de l’article…' });
		}
		if (titre.length > SOURCE_TITRE_MAX) {
			return fail(400, { ...renvoi, erreurSource: `Le titre est trop long (maximum ${SOURCE_TITRE_MAX} caractères).` });
		}
		if (lienBrut.length > SOURCE_LIEN_MAX) {
			return fail(400, { ...renvoi, erreurSource: 'Le lien est trop long.' });
		}
		const lien = lienValide(lienBrut);
		if (lien === null) {
			return fail(400, { ...renvoi, erreurSource: 'Le lien ne ressemble pas à une adresse web (elle commence par https://).' });
		}
		if (note.length > SOURCE_NOTE_MAX) {
			return fail(400, { ...renvoi, erreurSource: `Le mot d’accompagnement est trop long (maximum ${SOURCE_NOTE_MAX} caractères).` });
		}
		if (pseudoSource.length > PSEUDO_MAX) {
			return fail(400, { ...renvoi, erreurSource: 'Le pseudonyme est trop long.' });
		}
		if (/https?:\/\//i.test(note)) {
			return fail(400, { ...renvoi, erreurSource: 'Mettez le lien dans le champ prévu, pas dans le mot d’accompagnement.' });
		}

		// Un administrateur connecté publie directement, et l'action est tracée.
		if (locals.admin) {
			createSource({
				publicationId: publication.id,
				title: titre,
				url: lien,
				note,
				authorName: pseudoSource || locals.admin.displayName,
				status: 'approved',
				ipHash: locals.ipHash,
				userAgent: request.headers.get('user-agent') ?? ''
			});
			audit(locals.admin, 'source.publication', publication.title, titre, locals.ipHash);
			return { ...SOURCE_VIDE, succesSource: true, enAttenteSource: false };
		}

		const preuveValide = preuve ? verifySolution(preuve) : false;
		const quotas = preuveValide
			? [
					{ ...QUOTA_COURT, bucket: `source:court:${locals.ipHash}` },
					{ ...QUOTA_JOUR, bucket: `source:jour:${locals.ipHash}` }
				]
			: [
					{ ...QUOTA_SANS_PREUVE, bucket: `source:sanspreuve:${locals.ipHash}` },
					{ ...QUOTA_JOUR, bucket: `source:jour:${locals.ipHash}` }
				];

		for (const quota of quotas) {
			const etat = rateLimitPeek(quota.bucket, quota.limite, quota.fenetreMs);
			if (!etat.ok) {
				return fail(429, {
					...renvoi,
					erreurSource: `Vous avez proposé plusieurs sources coup sur coup. Réessayez dans ${Math.ceil(etat.retryAfterSec / 60)} minute(s).`
				});
			}
		}
		for (const quota of quotas) rateLimit(quota.bucket, quota.limite, quota.fenetreMs);

		createSource({
			publicationId: publication.id,
			title: titre,
			url: lien,
			note,
			authorName: pseudoSource,
			status: 'pending',
			ipHash: locals.ipHash,
			userAgent: request.headers.get('user-agent') ?? ''
		});

		return { ...SOURCE_VIDE, succesSource: true, enAttenteSource: true };
	}
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	blockIpHash,
	deleteSource,
	getSource,
	listSourcesForModeration,
	moderateSource,
	rejectAllFromIpHash,
	rejectAllSourcesFromIpHash
} from '$lib/server/content';
import { audit } from '$lib/server/auth';
import { RUBRIQUE_PAR_KIND } from '$lib/rubriques';

/**
 * Relecture des sources proposées pour les apéros. Même écran que la
 * modération des commentaires : en attente, publiées, rejetées.
 *
 * Une source, c'est avant tout un lien : c'est lui qu'il faut ouvrir avant
 * de publier. La page l'affiche en entier pour qu'on voie où il mène.
 */
const ETATS = ['pending', 'approved', 'rejected'] as const;
type Etat = (typeof ETATS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const brut = url.searchParams.get('etat');
	const etat: Etat = (ETATS as readonly string[]).includes(brut ?? '') ? (brut as Etat) : 'pending';

	return {
		etat,
		sources: listSourcesForModeration(etat).map((s) => ({
			id: s.id,
			titre: s.title,
			lien: s.url,
			note: s.note,
			auteur: s.author_name,
			creeLe: s.created_at,
			empreinte: s.ip_hash,
			empreinteCourte: s.ip_hash.slice(0, 8),
			publicationTitre: s.publication_title,
			publicationLien: `/${RUBRIQUE_PAR_KIND[s.publication_kind]}/${s.publication_slug}`
		}))
	};
};

function retour(url: URL) {
	redirect(303, `/admin/sources?etat=${url.searchParams.get('etat') ?? 'pending'}`);
}

export const actions: Actions = {
	approuver: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const source = getSource(id);
		if (!source) return fail(404, { erreur: 'Source introuvable.' });

		moderateSource(id, 'approved', admin.id);
		audit(admin, 'source.publication', String(id), `${source.title} ${source.url}`.trim(), locals.ipHash);
		retour(url);
	},

	rejeter: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const source = getSource(id);
		if (!source) return fail(404, { erreur: 'Source introuvable.' });

		moderateSource(id, 'rejected', admin.id);
		audit(admin, 'source.rejet', String(id), `${source.title} ${source.url}`.trim(), locals.ipHash);
		retour(url);
	},

	supprimer: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const id = Number((await request.formData()).get('id'));
		const source = getSource(id);
		if (!source) return fail(404, { erreur: 'Source introuvable.' });

		deleteSource(id);
		audit(admin, 'source.suppression', String(id), `${source.title} ${source.url}`.trim(), locals.ipHash);
		retour(url);
	},

	// Même geste que pour les commentaires : tout ce qui vient de cette
	// origine est rejeté d'un coup (sources et commentaires), et les envois
	// suivants sont bloqués.
	bloquerOrigine: async ({ request, locals, url }) => {
		const admin = locals.admin!;
		const form = await request.formData();
		const empreinte = String(form.get('empreinte') ?? '');
		if (!/^[a-f0-9]{64}$/.test(empreinte)) return fail(400, { erreur: 'Empreinte invalide.' });

		const sourcesRejetees = rejectAllSourcesFromIpHash(empreinte, admin.id);
		const commentairesRejetes = rejectAllFromIpHash(empreinte, admin.id);
		blockIpHash(empreinte, `Bloqué par ${admin.username}`);
		audit(
			admin,
			'origine.blocage',
			empreinte.slice(0, 12),
			`${sourcesRejetees} source(s) et ${commentairesRejetes} commentaire(s) rejeté(s)`,
			locals.ipHash
		);
		retour(url);
	}
};

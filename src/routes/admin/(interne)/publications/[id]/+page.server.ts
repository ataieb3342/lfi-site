import { db } from '$lib/server/db';
import { renderMarkdown } from '$lib/server/markdown';
import { articleReviewPermissions, assertArticleEditable, publishReviewedArticle, canPublishArticle, getReview, reviewHistory, reviewAction, reviewLabel, ReviewError } from '$lib/server/reviews';
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deletePublication, getById, positionALaUne, updatePublication } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import {
	apercuPublication,
	enregistrerALaUne,
	ErreurFormulaire,
	lirePublication,
	valeursSaisies
} from '$lib/server/formulaires';
import { audit, listAdminChoices } from '$lib/server/auth';

function charger(id: string) {
	const publication = getById(Number(id));
	if (!publication) error(404, 'Publication introuvable');
	return publication;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const publication = charger(params.id);
	return {
		publication: presentPublication(publication),
		admins: listAdminChoices().map(({ id, name, profile_public }) => ({
			id,
			name,
			profilePublic: !!profile_public
		})),
		corps: publication.body,
 permissions: articleReviewPermissions(publication.id,locals.admin!.id),
 previewHtml: renderMarkdown(publication.body),
 articleValidated: canPublishArticle(publication.id),
 review: getReview(publication.id),
 reviewLabel: reviewLabel(getReview(publication.id)),
 history: reviewHistory(publication.id),
 reviewAuthor: publication.byline_admin_id ?? publication.author_id,
		positionUne: positionALaUne(publication.id),
		enregistre: url.searchParams.has('enregistre'),
		// Ce qu'a donné « Enregistrer et mettre à la une » : `ok`, `brouillon`
		// ou `pleine`.
		une: url.searchParams.get('une')
	};
};

/** Enregistre la publication ; renvoie `null`, ou l'échec à afficher. */
async function enregistrer({ request, params, locals }: RequestEvent<{ id: string }>, decision: 'save' | 'approve' = 'save') {
	const admin = locals.admin!;
	const publication = charger(params.id);
	const form = await request.formData();

	try {
		assertArticleEditable(publication.id,admin.id);
		const saisie = await lirePublication(
			form,
			admin.id,
			publication.cover_media_id,
			publication.event_map_media_id
		);
		// L'URL n'est régénérée que si on le demande : les liens déjà partagés
		// sur les réseaux sociaux continuent de fonctionner.
        const soumettre = form.get('soumettreValidation') === '1' || form.get('articleAction') === 'submit';
        const current=charger(params.id);
        assertArticleEditable(current.id,admin.id);
        if (current.kind==='article' && getReview(current.id).author_approved_by && (saisie.kind!=='article' || (saisie.authorAdminId ?? current.author_id)!==(current.byline_admin_id ?? current.author_id))) throw new ReviewError('Le type et l’auteur restent fixes pendant la relecture.');
        if (current.kind==='article' && Number(form.get('reviewRevision'))!==getReview(current.id).revision) throw new ReviewError('Le texte a changé. Rechargez la fiche avant de l’enregistrer.');
        if (soumettre && (saisie.kind !== 'article' || (saisie.authorAdminId ?? current.author_id) !== admin.id)) throw new ReviewError('Seul l’auteur peut soumettre son article à validation.');
        if (decision==='approve' && !articleReviewPermissions(current.id,admin.id).canReview) throw new ReviewError('Vous ne pouvez pas valider cet article.');
        const base=db();
        base.exec('begin immediate');
        try {
            updatePublication(current.id, saisie, { reslug: form.get('regenererUrl') === '1' });
            if (soumettre) reviewAction(current.id,admin.id,'author',getReview(current.id).revision,'',0,0,false);
            if (decision==='approve') reviewAction(current.id,admin.id,'approve',getReview(current.id).revision,'',0,0,false);
            base.exec('commit');
        } catch(e) {base.exec('rollback');throw e;}
		audit(admin, 'publication.modification', saisie.title, saisie.status, locals.ipHash);
		return null;
	} catch (err) {
		if (err instanceof ErreurFormulaire || err instanceof ReviewError) {
			return fail(400, { ...valeursSaisies(form), erreur: err.message });
		}
		throw err;
	}
}

export const actions: Actions = {
 publier: async ({params,locals,request}) => {
 const f=await request.formData();
 try {publishReviewedArticle(Number(params.id),locals.admin!.id,Number(f.get('revision')));}
 catch(e) {if(e instanceof ReviewError) return fail(400,{erreur:e.message});throw e;}
 audit(locals.admin!,'publication.publication',params.id,'',locals.ipHash);
 redirect(303,`/admin/publications/${params.id}?enregistre=1`);
 },
 enregistrerEtValider: async (event) => {
 const echec=await enregistrer(event,'approve');
 if(echec) return echec;
 redirect(303,`/admin/publications/${event.params.id}?enregistre=1`);
 },
 verifier: async ({request,params,locals}) => {
 const f=await request.formData();
 try {
 reviewAction(Number(params.id),locals.admin!.id,String(f.get('decision')),Number(f.get('revision')),String(f.get('note')??'').trim(),Number(f.get('target')),Number(f.get('priority')));
 } catch(e) { if(e instanceof ReviewError) return fail(400,{erreur:e.message}); throw e; }
 redirect(303, `/admin/publications/${params.id}?enregistre=1`);
 },
	enregistrer: async (event) => {
		const echec = await enregistrer(event);
		if (echec) return echec;
		redirect(303, `/admin/publications/${event.params.id}?enregistre=1`);
	},

	// Enregistre d'abord, puis met à la une : le texte en cours n'est jamais
	// perdu, même quand la une refuse la fiche.
	enregistrerEtUne: async (event) => {
		const echec = await enregistrer(event);
		if (echec) return echec;
		const une = enregistrerALaUne(Number(event.params.id), event.locals);
		redirect(303, `/admin/publications/${event.params.id}?enregistre=1&une=${une}`);
	},

	apercu: async ({ request }) => apercuPublication(await request.formData()),

	supprimer: async ({ params, locals }) => {
		const admin = locals.admin!;
		const publication = charger(params.id);

		try {assertArticleEditable(publication.id,admin.id);} catch(e) {if(e instanceof ReviewError)return fail(403,{erreur:e.message});throw e;}
		deletePublication(publication.id);
		// Les commentaires liés partent avec (clé étrangère en cascade).
		audit(admin, 'publication.suppression', publication.title, publication.slug, locals.ipHash);

		redirect(303, '/admin/publications');
	}
};

/**
 * Types partagés entre le serveur et le navigateur.
 *
 * Ils vivent ici et non dans $lib/server pour qu'un composant puisse les
 * importer : tout ce qui se trouve dans $lib/server est interdit d'accès au
 * code client par SvelteKit, ce qui évite d'exposer du code serveur par erreur.
 */

export type PublicationVue = {
	id: number;
	kind: 'article' | 'actu';
	slug: string;
	title: string;
	summary: string;
	status: 'draft' | 'published';
	pinned: boolean;
	commentsOpen: boolean;
	publishedAt: string | null;
	updatedAt: string;
	authorName: string;
	commentCount: number;
	/** Date de l'action annoncée (AAAA-MM-JJ), si la publication en annonce une. */
	eventAt: string | null;
	/** Vrai tant que la date de l'action n'est pas passée. */
	aVenir: boolean;
	cover: { url: string; alt: string } | null;
};

export type CommentaireVue = {
	id: number;
	authorName: string;
	body: string;
	createdAt: string;
};

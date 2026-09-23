/**
 * Types partagés entre le serveur et le navigateur.
 *
 * Ils vivent ici et non dans $lib/server pour qu'un composant puisse les
 * importer : tout ce qui se trouve dans $lib/server est interdit d'accès au
 * code client par SvelteKit, ce qui évite d'exposer du code serveur par erreur.
 */

export type PublicationVue = {
	id: number;
	kind: 'article' | 'actu' | 'apero' | 'revue';
	slug: string;
	title: string;
	summary: string;
	status: 'draft' | 'published';
	pinned: boolean;
	commentsOpen: boolean;
	publishedAt: string | null;
	updatedAt: string;
	authorName: string;
	authorAdminId: number | null;
	authorProfileUrl: string | null;
	commentCount: number;
	/** Date de l'action annoncée (AAAA-MM-JJ), si la publication en annonce une. */
	eventAt: string | null;
	/** Catégorie utilisée pour la couleur et le filtrage dans l'agenda. */
	eventCategory: 'action' | 'reunion' | 'apero' | 'formation' | 'autre';
	actionCategory: 'porte-a-porte' | 'tractage' | 'collage' | 'mobilisation' | 'collecte' | 'autre';
	eventStartTime: string;
	eventEndTime: string;
	eventLocation: string;
	eventAddress: string;
	eventLocationUrl: string;
	eventManagers: string;
	eventManagerAdminIds: number[];
	eventManagerPeople: { name: string; profileUrl: string | null }[];
	eventSignupUrl: string;
	eventMeetingPoint: string;
	eventMap: { url: string; alt: string } | null;
	eventMapEmbedUrl: string;
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

/** Une source partagée avant un apéro (livre, vidéo, article, site…). */
export type SourceVue = {
	id: number;
	title: string;
	/** Vide pour un livre ou une source sans lien. */
	url: string;
	/** Nom du site du lien, sans « www. » : vide s'il n'y a pas de lien. */
	site: string;
	note: string;
	authorName: string;
	createdAt: string;
	droitsDiffusion: string;
	pdf: { url: string; nom: string; octets: number } | null;
	apero?: { titre: string; url: string };
};

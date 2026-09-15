import type { Comment, PublicationListItem, Publication, Source } from './content.ts';
import { getMedia } from './media.ts';
import type { PublicationVue, CommentaireVue, SourceVue } from '$lib/types';

/**
 * Conversion des lignes SQL en objets destinés au navigateur.
 *
 * Ce fichier est le seul point de passage entre la base et les pages : on y
 * choisit explicitement ce qui sort. C'est ce qui garantit qu'une colonne
 * sensible (empreinte d'IP, agent utilisateur) ne se retrouve jamais dans le
 * HTML envoyé au public, même par distraction.
 */

export function presentPublication(row: PublicationListItem | Publication): PublicationVue {
	const media = row.cover_media_id ? getMedia(row.cover_media_id) : undefined;
	return {
		id: row.id,
		kind: row.kind,
		slug: row.slug,
		title: row.title,
		summary: row.summary,
		status: row.status,
		pinned: !!row.pinned,
		commentsOpen: !!row.comments_open,
		publishedAt: row.published_at,
		updatedAt: row.updated_at,
		authorName: row.author_name,
		commentCount: 'comment_count' in row ? Number(row.comment_count) : 0,
		eventAt: row.event_at,
		// Comparaison de chaînes AAAA-MM-JJ : correcte, et sans piège de fuseau
		// horaire contrairement à un calcul sur des objets Date.
		aVenir: !!row.event_at && row.event_at >= new Date().toISOString().slice(0, 10),
		cover: media ? { url: `/media/${media.filename}`, alt: media.alt } : null
	};
}

/** Les commentaires publics sortent sans empreinte d'IP ni agent utilisateur. */
export function presentComment(row: Comment): CommentaireVue {
	return {
		id: row.id,
		authorName: row.author_name,
		body: row.body,
		createdAt: row.created_at
	};
}

/**
 * Une source partagée sort sans empreinte d'IP. Le nom du site est calculé ici
 * (« youtube.com », « cairn.info ») pour que la liste dise d'un coup d'œil
 * vers quoi mène le lien.
 */
export function presentSource(row: Source): SourceVue {
	return {
		id: row.id,
		title: row.title,
		url: row.url,
		site: nomDuSite(row.url),
		note: row.note,
		authorName: row.author_name,
		createdAt: row.created_at
	};
}

function nomDuSite(url: string): string {
	if (!url) return '';
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

export type { PublicationVue, CommentaireVue, SourceVue };

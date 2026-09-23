import { listPublicationManagerProfiles, type Comment, type PublicationListItem, type Publication, type Source } from './content.ts';
import { getMedia } from './media.ts';
import { getAdmin, publicProfileAnchor } from './auth.ts';
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
	const carte = row.event_map_media_id ? getMedia(row.event_map_media_id) : undefined;
	const auteur = row.byline_admin_id ? getAdmin(row.byline_admin_id) : undefined;
	const responsablesAdmins = listPublicationManagerProfiles(row.id);
	const urlProfil = (admin: { username: string; profile_visible: number; profile_name: string }) =>
		admin.profile_visible && admin.profile_name ? `/le-groupe#${publicProfileAnchor(admin)}` : null;
	const responsables = responsablesAdmins.map((admin) => ({
		name: admin.profile_name || admin.display_name,
		profileUrl: urlProfil(admin)
	}));
	if (row.event_managers.trim()) responsables.push({ name: row.event_managers.trim(), profileUrl: null });
	return {
		id: row.id,
		kind: row.kind,
		slug: row.slug,
		title: row.title,
		summary: row.summary,
		layoutStyle: row.layout_style,
		status: row.status,
		pinned: !!row.pinned,
		commentsOpen: !!row.comments_open,
		publishedAt: row.published_at,
		updatedAt: row.updated_at,
		authorName: row.author_name,
		authorAdminId: row.byline_admin_id,
		authorProfileUrl: auteur && !auteur.disabled_at ? urlProfil(auteur) : null,
		commentCount: 'comment_count' in row ? Number(row.comment_count) : 0,
		eventAt: row.event_at,
		eventCategory: row.event_category,
		actionCategory: row.action_category,
		eventStartTime: row.event_start_time,
		eventEndTime: row.event_end_time,
		eventLocation: row.event_location,
		eventAddress: row.event_address,
		eventLocationUrl: row.event_location_url,
		eventManagers: row.event_managers,
		eventManagerAdminIds: responsablesAdmins.map((admin) => admin.id),
		eventManagerPeople: responsables,
		eventSignupUrl: row.event_signup_url,
		eventMeetingPoint: row.event_meeting_point,
		eventMap: carte ? { url: `/media/${carte.filename}`, alt: carte.alt } : null,
		eventMapEmbedUrl: row.event_map_embed_url,
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
		createdAt: row.created_at,
		droitsDiffusion: row.droits_diffusion,
		pdf: row.pdf_filename
			? {
					url: `/bibliotheque/fichiers/${row.pdf_filename}`,
					nom: row.pdf_original_name,
					octets: row.pdf_bytes ?? 0
				}
			: null
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

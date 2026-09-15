import type { PublicationInput, Kind, Status } from './content.ts';
import { storeUpload } from './media.ts';

/**
 * Lecture et validation du formulaire de publication, partagée entre la
 * création et la modification pour que les deux se comportent exactement
 * pareil.
 */
export class ErreurFormulaire extends Error {}

export async function lirePublication(
	form: FormData,
	adminId: number,
	couvertureActuelle: number | null
): Promise<PublicationInput> {
	const kind = String(form.get('kind') ?? 'article');
	const status = String(form.get('status') ?? 'draft');
	const title = String(form.get('title') ?? '').trim();
	const summary = String(form.get('summary') ?? '').trim();
	const body = String(form.get('body') ?? '');
	const authorName = String(form.get('authorName') ?? '').trim();
	const eventAt = String(form.get('eventAt') ?? '').trim();

	if (kind !== 'article' && kind !== 'actu') throw new ErreurFormulaire('Type de publication inconnu.');
	if (status !== 'draft' && status !== 'published') throw new ErreurFormulaire('État inconnu.');
	if (!title) throw new ErreurFormulaire('Le titre est obligatoire.');
	if (title.length > 200) throw new ErreurFormulaire('Le titre est trop long (200 caractères maximum).');
	if (summary.length > 500) throw new ErreurFormulaire('Le chapô est trop long (500 caractères maximum).');
	if (body.length > 200_000) throw new ErreurFormulaire('Le texte est trop long.');
	if (eventAt && !/^\d{4}-\d{2}-\d{2}$/.test(eventAt)) {
		throw new ErreurFormulaire("La date de l'action est invalide.");
	}

	// Image de couverture : suppression, remplacement, ou statu quo.
	let coverMediaId = couvertureActuelle;
	if (form.get('retirerCouverture') === '1') coverMediaId = null;

	const fichier = form.get('cover');
	if (fichier instanceof File && fichier.size > 0) {
		try {
			const media = await storeUpload(fichier, String(form.get('coverAlt') ?? ''), adminId);
			coverMediaId = media.id;
		} catch (err) {
			throw new ErreurFormulaire((err as Error).message);
		}
	}

	return {
		kind: kind as Kind,
		status: status as Status,
		title,
		summary,
		body,
		authorName,
		commentsOpen: form.get('commentsOpen') === '1',
		pinned: form.get('pinned') === '1',
		coverMediaId,
		eventAt: eventAt || null
	};
}

/** Valeurs à renvoyer au formulaire après une erreur, pour ne rien perdre. */
export function valeursSaisies(form: FormData) {
	return {
		kind: String(form.get('kind') ?? 'article'),
		title: String(form.get('title') ?? ''),
		summary: String(form.get('summary') ?? ''),
		body: String(form.get('body') ?? ''),
		authorName: String(form.get('authorName') ?? ''),
		status: String(form.get('status') ?? 'draft'),
		commentsOpen: form.get('commentsOpen') === '1',
		pinned: form.get('pinned') === '1',
		eventAt: String(form.get('eventAt') ?? '')
	};
}

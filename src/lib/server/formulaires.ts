import type { PublicationInput, Kind, Status } from './content.ts';
import { storeUpload } from './media.ts';
import { renderMarkdown } from './markdown.ts';
import { listAdmins } from './auth.ts';

/**
 * Lecture et validation du formulaire de publication, partagée entre la
 * création et la modification pour que les deux se comportent exactement
 * pareil.
 */
export class ErreurFormulaire extends Error {}

/** Accepte le code iframe copié depuis Google Maps, ou son URL seule. */
function lireCarteIntegree(valeur: FormDataEntryValue | null): string {
	const brut = String(valeur ?? '').trim();
	if (!brut) return '';
	if (brut.length > 8_000) throw new ErreurFormulaire('Le code de la carte est trop long.');

	const attributSrc = brut.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
	let adresse = (attributSrc ?? brut).trim();
	// Tolère aussi un lien Markdown accidentellement collé dans l’attribut src.
	const lienMarkdown = adresse.match(/\]\((https:\/\/[^)]+)\)/i);
	if (lienMarkdown) adresse = lienMarkdown[1];
	adresse = adresse.replaceAll('&amp;', '&');

	let url: URL;
	try {
		url = new URL(adresse);
	} catch {
		throw new ErreurFormulaire("Le code de la carte Google Maps n’est pas reconnu.");
	}
	if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || !url.pathname.startsWith('/maps/embed')) {
		throw new ErreurFormulaire('Utilisez le code d’intégration fourni par Google Maps.');
	}
	if (url.href.length > 5_000) throw new ErreurFormulaire('Le lien de la carte est trop long.');
	return url.href;
}

export async function lirePublication(
	form: FormData,
	adminId: number,
	couvertureActuelle: number | null,
	carteActuelle: number | null = null
): Promise<PublicationInput> {
	const typeAffiche = String(form.get('kind') ?? 'article');
	const kind = ['action', 'reunion', 'formation'].includes(typeAffiche) ? 'actu' : typeAffiche;
	const status = String(form.get('status') ?? 'draft');
	const title = String(form.get('title') ?? '').trim();
	const summary = String(form.get('summary') ?? '').trim();
	const body = String(form.get('body') ?? '');
	const choixAuteur = String(form.get('authorAdminId') ?? '').trim();
	const admins = listAdmins().filter((admin) => !admin.disabled_at);
	const auteurAdminId = /^\d+$/.test(choixAuteur) ? Number(choixAuteur) : null;
	const auteurAdmin = auteurAdminId ? admins.find((admin) => admin.id === auteurAdminId) : undefined;
	if (auteurAdminId && !auteurAdmin) throw new ErreurFormulaire("L’auteur choisi n’est plus disponible.");
	const authorName = auteurAdmin
		? auteurAdmin.profile_name || auteurAdmin.display_name
		: String(form.get('authorName') ?? '').trim();
	const eventAt = String(form.get('eventAt') ?? '').trim();
	// Les types datés déterminent directement leur catégorie d'agenda. Un apéro
	// reste toujours un apéro ; les publications ordinaires n'ont pas de catégorie.
	const eventCategory =
		typeAffiche === 'action' || typeAffiche === 'reunion' || typeAffiche === 'formation'
			? typeAffiche
			: kind === 'apero'
				? 'apero'
				: 'autre';
	const actionCategory = String(form.get('actionCategory') ?? 'autre');
	const eventStartTime = String(form.get('eventStartTime') ?? '').trim();
	const eventEndTime = String(form.get('eventEndTime') ?? '').trim();
	const eventLocation = String(form.get('eventLocation') ?? '').trim();
	const eventAddress = String(form.get('eventAddress') ?? '').trim();
	const eventLocationUrl = String(form.get('eventLocationUrl') ?? '').trim();
	const eventManagers = String(form.get('eventManagers') ?? '').trim();
	const eventManagerAdminIds = form
		.getAll('eventManagerAdminIds')
		.map((valeur) => Number(valeur))
		.filter((id) => Number.isInteger(id) && admins.some((admin) => admin.id === id));
	const eventSignupUrl = String(form.get('eventSignupUrl') ?? '').trim();
	const eventMeetingPoint = String(form.get('eventMeetingPoint') ?? '').trim();
	const eventMapEmbedUrl = lireCarteIntegree(form.get('eventMapEmbed'));

	if (!['article', 'actu', 'action', 'reunion', 'formation', 'apero', 'revue'].includes(typeAffiche)) {
		throw new ErreurFormulaire('Type de publication inconnu.');
	}

	if (status !== 'draft' && status !== 'published') throw new ErreurFormulaire('État inconnu.');
	if (!title) throw new ErreurFormulaire('Le titre est obligatoire.');
	if (title.length > 200) throw new ErreurFormulaire('Le titre est trop long (200 caractères maximum).');
	if (summary.length > 500) throw new ErreurFormulaire('Le chapô est trop long (500 caractères maximum).');
	if (body.length > 200_000) throw new ErreurFormulaire('Le texte est trop long.');
	if (eventAt && !/^\d{4}-\d{2}-\d{2}$/.test(eventAt)) {
		throw new ErreurFormulaire("La date de l'action est invalide.");
	}
	// Un apéro sans date n'a pas de sens : c'est elle qui le place dans la
	// liste, avant ou après la soirée.
	if (['action', 'reunion', 'formation', 'apero'].includes(typeAffiche) && !eventAt) {
		throw new ErreurFormulaire('Ce type de publication a toujours une date : renseignez la date du rendez-vous.');
	}
	if (!['action', 'reunion', 'apero', 'formation', 'autre'].includes(eventCategory)) {
		throw new ErreurFormulaire("La catégorie de l'événement est invalide.");
	}
	if (typeAffiche === 'action' && !['porte-a-porte', 'tractage', 'collage'].includes(actionCategory)) {
		throw new ErreurFormulaire("La catégorie de l'action est invalide.");
	}
	if (eventStartTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventStartTime)) {
		throw new ErreurFormulaire("L'heure de début est invalide.");
	}
	if (eventEndTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventEndTime)) {
		throw new ErreurFormulaire("L'heure de fin est invalide.");
	}
	if (eventStartTime && eventEndTime && eventEndTime <= eventStartTime) {
		throw new ErreurFormulaire("L'heure de fin doit être après l'heure de début.");
	}
	for (const [url, libelle] of [[eventLocationUrl, 'Le lien du lieu'], [eventSignupUrl, "Le lien d'inscription"]] as const) {
		if (url && !/^https?:\/\//i.test(url)) throw new ErreurFormulaire(`${libelle} doit commencer par http:// ou https://.`);
		if (url.length > 500) throw new ErreurFormulaire(`${libelle} est trop long.`);
	}
	if (
		eventLocation.length > 200 ||
		eventAddress.length > 300 ||
		eventManagers.length > 300 ||
		eventMeetingPoint.length > 300
	) {
		throw new ErreurFormulaire('Les informations pratiques sont trop longues.');
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

	// Capture de carte : image locale uniquement. Le service cartographique
	// n'est contacté qu'au clic sur le lien public.
	let eventMapMediaId = carteActuelle;
	if (form.get('retirerCarte') === '1') eventMapMediaId = null;
	const fichierCarte = form.get('eventMap');
	if (fichierCarte instanceof File && fichierCarte.size > 0) {
		try {
			const carte = await storeUpload(
				fichierCarte,
				String(form.get('eventMapAlt') ?? '').trim() || `Carte du lieu de l’action`,
				adminId
			);
			eventMapMediaId = carte.id;
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
		authorAdminId: auteurAdmin?.id ?? null,
		commentsOpen: form.get('commentsOpen') === '1',
		pinned: form.get('pinned') === '1',
		coverMediaId,
		eventAt: eventAt || null,
		eventCategory: eventCategory as PublicationInput['eventCategory'],
		actionCategory: actionCategory as PublicationInput['actionCategory'],
		eventStartTime,
		eventEndTime,
		eventLocation,
		eventAddress,
		eventLocationUrl,
		eventManagers,
		eventManagerAdminIds,
		eventSignupUrl,
		eventMeetingPoint,
		eventMapMediaId,
		eventMapEmbedUrl
	};
}

/**
 * Aperçu du texte : les valeurs saisies, renvoyées telles quelles, plus le
 * texte rendu en HTML par le même code que les pages publiques. Rien n'est
 * enregistré.
 */
export function apercuPublication(form: FormData) {
	return { ...valeursSaisies(form), apercu: renderMarkdown(String(form.get('body') ?? '')) };
}

/** Valeurs à renvoyer au formulaire après une erreur, pour ne rien perdre. */
export function valeursSaisies(form: FormData) {
	return {
		kind: String(form.get('kind') ?? 'article'),
		title: String(form.get('title') ?? ''),
		summary: String(form.get('summary') ?? ''),
		body: String(form.get('body') ?? ''),
		authorName: String(form.get('authorName') ?? ''),
		authorAdminId: String(form.get('authorAdminId') ?? ''),
		status: String(form.get('status') ?? 'draft'),
		commentsOpen: form.get('commentsOpen') === '1',
		pinned: form.get('pinned') === '1',
		eventAt: String(form.get('eventAt') ?? ''),
		eventCategory: String(form.get('eventCategory') ?? 'autre'),
		actionCategory: String(form.get('actionCategory') ?? 'autre'),
		eventStartTime: String(form.get('eventStartTime') ?? ''),
		eventEndTime: String(form.get('eventEndTime') ?? ''),
		eventLocation: String(form.get('eventLocation') ?? ''),
		eventAddress: String(form.get('eventAddress') ?? ''),
		eventLocationUrl: String(form.get('eventLocationUrl') ?? ''),
		eventManagers: String(form.get('eventManagers') ?? ''),
		eventManagerAdminIds: form.getAll('eventManagerAdminIds').map(Number).filter(Number.isInteger),
		eventSignupUrl: String(form.get('eventSignupUrl') ?? ''),
		eventMeetingPoint: String(form.get('eventMeetingPoint') ?? ''),
		eventMapEmbed: String(form.get('eventMapEmbed') ?? '')
	};
}

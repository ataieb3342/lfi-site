/**
 * Données structurées (schema.org, au format JSON-LD).
 *
 * C'est un petit bloc de données, invisible pour le visiteur, que Google lit
 * en plus de la page. Il ne fait pas monter un site à lui seul, mais il dit
 * explicitement au moteur ce qu'une page contient — un article, une soirée
 * avec une date et une adresse, une organisation locale — au lieu de le lui
 * faire deviner. C'est ce qui permet d'apparaître avec une date, un fil
 * d'Ariane ou une fiche d'événement dans les résultats, donc d'être cliqué.
 *
 * Tout est construit ici, à partir des mêmes données que la page : un bloc qui
 * annoncerait autre chose que ce qui est affiché est considéré comme une
 * tromperie et peut faire perdre le bénéfice de l'ensemble.
 *
 * Les fonctions renvoient des objets ordinaires ; c'est
 * `Metadonnees.svelte` qui les écrit dans la page.
 */

import type { PublicationVue } from '$lib/types';

/** Cadre habituel des apéros, tel qu'il sort des réglages. */
export type CadreApero = {
	rythme: string;
	heure: string;
	lieu: string;
	adresse: string;
	presentation: string;
};

export type Identite = {
	siteName: string;
	tagline: string;
	description: string;
	contactEmail: string;
};

/**
 * L'organisation elle-même, pour l'accueil. `areaServed` et `address` disent
 * au moteur que le groupe est à Dijon : c'est ce qui rattache le site aux
 * recherches locales (« la france insoumise dijon »).
 */
export function organisation(origine: string, identite: Identite, cadre: CadreApero) {
	const fiche: Record<string, unknown> = {
		'@type': 'Organization',
		'@id': `${origine}/#organisation`,
		name: identite.siteName,
		alternateName: identite.tagline,
		description: identite.description,
		url: `${origine}/`,
		logo: `${origine}/favicon.svg`,
		areaServed: { '@type': 'City', name: 'Dijon' },
		address: { '@type': 'PostalAddress', addressLocality: 'Dijon', postalCode: '21000', addressCountry: 'FR' },
		parentOrganization: {
			'@type': 'Organization',
			name: 'La France insoumise',
			url: 'https://lafranceinsoumise.fr'
		}
	};
	if (identite.contactEmail) fiche.email = identite.contactEmail;
	if (cadre.lieu) fiche.location = lieuApero(cadre);

	return [
		fiche,
		{
			'@type': 'WebSite',
			'@id': `${origine}/#site`,
			name: identite.siteName,
			url: `${origine}/`,
			inLanguage: 'fr-FR',
			publisher: { '@id': `${origine}/#organisation` }
		}
	];
}

/**
 * La carte de visite du groupe, en version courte, à joindre à toute page qui
 * s'y réfère (`publisher`, `organizer`).
 *
 * Un renvoi par identifiant — « l'éditeur, c'est #organisation » — n'est
 * résolu qu'à l'intérieur d'une même page. Sans ce bloc, l'article dirait
 * « publié par » en pointant dans le vide, et le moteur écarterait la fiche
 * entière faute d'éditeur nommé.
 */
export function editeur(origine: string, identite: Identite) {
	return {
		'@type': 'Organization',
		'@id': `${origine}/#organisation`,
		name: identite.siteName,
		url: `${origine}/`,
		logo: { '@type': 'ImageObject', url: `${origine}/favicon.svg` }
	};
}

/** Une publication ordinaire : article, actualité, revue de presse. */
export function articleStructure(
	origine: string,
	adresse: string,
	p: PublicationVue,
	resume: string,
	identite: Identite
) {
	const fiche: Record<string, unknown> = {
		'@type': p.kind === 'actu' ? 'NewsArticle' : 'Article',
		headline: p.title,
		description: resume,
		inLanguage: 'fr-FR',
		mainEntityOfPage: adresse,
		url: adresse,
		datePublished: p.publishedAt ?? p.updatedAt,
		dateModified: p.updatedAt,
		author: { '@type': 'Organization', name: p.authorName || identite.siteName },
		publisher: { '@id': `${origine}/#organisation` }
	};
	if (p.cover) fiche.image = origine + p.cover.url;
	return fiche;
}

/**
 * Un apéro : c'est un événement, avec une date et une adresse. Le déclarer
 * comme tel est ce qui permet à Google de l'afficher comme un rendez-vous et
 * non comme un article de plus.
 */
export function evenementApero(
	origine: string,
	adresse: string,
	p: PublicationVue,
	resume: string,
	cadre: CadreApero,
	identite: Identite
) {
	const fiche: Record<string, unknown> = {
		'@type': 'Event',
		name: p.title,
		description: resume,
		inLanguage: 'fr-FR',
		url: adresse,
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
		eventStatus: 'https://schema.org/EventScheduled',
		organizer: { '@id': `${origine}/#organisation` },
		isAccessibleForFree: true
	};
	if (p.eventAt) fiche.startDate = debutDeSoiree(p.eventAt, cadre.heure);
	if (cadre.lieu) fiche.location = lieuApero(cadre);
	if (p.cover) fiche.image = origine + p.cover.url;
	return fiche;
}

/**
 * Le fil d'Ariane, affiché par Google sous le titre du résultat à la place de
 * l'adresse brute : « Accueil › Articles › Le titre » se lit, pas « /articles/… ».
 */
export function filAriane(origine: string, etapes: { nom: string; chemin: string }[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: etapes.map((e, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: e.nom,
			item: origine + e.chemin
		}))
	};
}

/** Le bar où se tient l'apéro, adresse comprise. */
function lieuApero(cadre: CadreApero) {
	const lieu: Record<string, unknown> = { '@type': 'Place', name: cadre.lieu };
	if (cadre.adresse) {
		// L'adresse est saisie d'un bloc dans les réglages (« 6 bis rue Musette,
		// 21000 Dijon ») : on la donne telle quelle en rue, et on répète la ville
		// et le code postal, qui sont ce que le moteur utilise pour le local.
		lieu.address = {
			'@type': 'PostalAddress',
			streetAddress: cadre.adresse.split(',')[0].trim(),
			postalCode: (cadre.adresse.match(/\b\d{5}\b/) ?? [''])[0],
			addressLocality: 'Dijon',
			addressCountry: 'FR'
		};
	}
	return lieu;
}

/**
 * « 2026-09-28 » + « 19 h 30 » → « 2026-09-28T19:30 ».
 *
 * Sans fuseau horaire volontairement : schema.org l'accepte et l'interprète
 * comme l'heure locale du lieu, ce qui est exactement ce qu'on veut. Écrire
 * « +02:00 » en dur serait faux la moitié de l'année.
 */
function debutDeSoiree(jour: string, heure: string): string {
	const m = heure.match(/(\d{1,2})\s*h\s*(\d{1,2})?/i);
	if (!m) return jour;
	return `${jour}T${m[1].padStart(2, '0')}:${(m[2] ?? '0').padStart(2, '0')}`;
}

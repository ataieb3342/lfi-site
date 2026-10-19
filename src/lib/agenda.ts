import type { PublicationVue } from '$lib/types';
import type { CadreApero } from '$lib/donnees-structurees';

/**
 * L'ajout d'un rendez-vous à l'agenda du visiteur.
 *
 * Deux portes, parce qu'il n'existe pas de format que tout le monde ouvre de
 * la même façon :
 *
 * - un fichier `.ics` (`/<rubrique>/<slug>/agenda.ics`), le format commun des
 *   agendas : l'iPhone, le Mac, Outlook et Thunderbird proposent de l'ajouter
 *   dès qu'on l'ouvre ;
 * - un lien vers Google Agenda, qui ouvre le rendez-vous prérempli. Sur
 *   Android, ouvrir un `.ics` donne souvent un fichier téléchargé et rien de
 *   plus : le lien est plus sûr.
 *
 * Le lien Google est une simple adresse, comme les boutons de partage : rien
 * ne part vers Google tant que le visiteur n'a pas cliqué.
 *
 * Les heures sont écrites en heure de Paris, jamais converties en UTC : le
 * site ne connaît que l'heure affichée sur la fiche, et c'est elle qui doit
 * apparaître dans l'agenda, été comme hiver.
 */

/** Sans heure de fin, un rendez-vous est inscrit pour deux heures. */
const DUREE_PAR_DEFAUT_MIN = 120;

export type RendezVous = {
	titre: string;
	/** AAAA-MM-JJ */
	jour: string;
	/** « HH:MM », ou null : le rendez-vous occupe alors la journée. */
	debut: string | null;
	fin: string | null;
	lieu: string;
	description: string;
	adresse: string;
};

/**
 * Le rendez-vous tel que la fiche l'affiche : pour un apéro, les horaires et
 * le lieu de la fiche, sinon ceux des réglages (même règle que la page).
 */
export function rendezVous(p: PublicationVue, cadre: CadreApero, description: string, adresse: string): RendezVous | null {
	if (!p.eventAt) return null;
	let debut = heureValide(p.eventStartTime);
	let lieu = lieuComplet(p.eventLocation, p.eventAddress);
	if (p.kind === 'apero') {
		debut ??= heureEcrite(cadre.heure);
		if (!p.eventLocation && !p.eventAddress) lieu = lieuComplet(cadre.lieu, cadre.adresse);
	}
	const fin = debut ? (heureValide(p.eventEndTime) ?? ajouterMinutes(debut, DUREE_PAR_DEFAUT_MIN)) : null;
	return { titre: p.title, jour: p.eventAt, debut, fin, lieu, description, adresse };
}

/** Le lien qui ouvre Google Agenda avec le rendez-vous prérempli. */
export function lienGoogleAgenda(r: RendezVous): string {
	const dates = r.debut && r.fin
		? `${horodatage(r.jour, r.debut)}/${horodatage(finDuJour(r), r.fin)}`
		: `${compact(r.jour)}/${compact(lendemain(r.jour))}`;
	const parametres = new URLSearchParams({
		action: 'TEMPLATE',
		text: r.titre,
		dates,
		ctz: 'Europe/Paris',
		details: [r.description, r.adresse].filter(Boolean).join('\n\n'),
		location: r.lieu
	});
	return `https://calendar.google.com/calendar/render?${parametres}`;
}

/** Le fichier `.ics` d'un rendez-vous (RFC 5545). */
export function fichierIcs(r: RendezVous, uid: string, nomDuSite: string): string {
	const lignes = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:-//${texte(nomDuSite)}//Agenda//FR`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		...(r.debut ? FUSEAU_PARIS : []),
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
		...(r.debut && r.fin
			? [
					`DTSTART;TZID=Europe/Paris:${horodatage(r.jour, r.debut)}`,
					`DTEND;TZID=Europe/Paris:${horodatage(finDuJour(r), r.fin)}`
				]
			: [`DTSTART;VALUE=DATE:${compact(r.jour)}`, `DTEND;VALUE=DATE:${compact(lendemain(r.jour))}`]),
		`SUMMARY:${texte(r.titre)}`,
		...(r.lieu ? [`LOCATION:${texte(r.lieu)}`] : []),
		...(r.description ? [`DESCRIPTION:${texte(r.description)}`] : []),
		`URL:${r.adresse}`,
		'END:VEVENT',
		'END:VCALENDAR'
	];
	return lignes.map(plier).join('\r\n') + '\r\n';
}

/**
 * La règle de l'heure d'été en France, pour que les agendas qui ne
 * connaissent pas « Europe/Paris » par son nom placent tout de même le
 * rendez-vous à la bonne heure.
 */
const FUSEAU_PARIS = [
	'BEGIN:VTIMEZONE',
	'TZID:Europe/Paris',
	'BEGIN:DAYLIGHT',
	'TZOFFSETFROM:+0100',
	'TZOFFSETTO:+0200',
	'TZNAME:CEST',
	'DTSTART:19700329T020000',
	'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
	'END:DAYLIGHT',
	'BEGIN:STANDARD',
	'TZOFFSETFROM:+0200',
	'TZOFFSETTO:+0100',
	'TZNAME:CET',
	'DTSTART:19701025T030000',
	'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
	'END:STANDARD',
	'END:VTIMEZONE'
];

/** « Place Darcy » + « Place Darcy, 21000 Dijon » ne répète pas le nom. */
function lieuComplet(nom: string, adresse: string): string {
	if (nom && adresse.toLowerCase().startsWith(nom.toLowerCase())) return adresse;
	return [nom, adresse].filter(Boolean).join(', ');
}

function heureValide(heure: string): string | null {
	return /^\d{2}:\d{2}$/.test(heure) ? heure : null;
}

/** « 19 h 30 » (réglages des apéros) → « 19:30 ». */
function heureEcrite(heure: string): string | null {
	const m = heure.match(/(\d{1,2})\s*h\s*(\d{1,2})?/i);
	return m ? `${m[1].padStart(2, '0')}:${(m[2] ?? '0').padStart(2, '0')}` : null;
}

function ajouterMinutes(heure: string, minutes: number): string {
	const [h, m] = heure.split(':').map(Number);
	const total = (h * 60 + m + minutes) % (24 * 60);
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Une soirée qui finit après minuit finit le lendemain. */
function finDuJour(r: RendezVous): string {
	return r.debut && r.fin && r.fin <= r.debut ? lendemain(r.jour) : r.jour;
}

function lendemain(jour: string): string {
	// Calcul en UTC : il ne s'agit que du calendrier, pas d'une heure réelle.
	const d = new Date(`${jour}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

function compact(jour: string): string {
	return jour.replace(/-/g, '');
}

function horodatage(jour: string, heure: string): string {
	return `${compact(jour)}T${heure.replace(':', '')}00`;
}

/** Les virgules, points-virgules et retours à la ligne ont un sens en ICS. */
function texte(valeur: string): string {
	return valeur.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Une ligne ICS ne dépasse pas 75 octets : au-delà, elle continue à la suivante. */
function plier(ligne: string): string {
	const encodeur = new TextEncoder();
	const morceaux: string[] = [];
	let courant = '';
	let octets = 0;
	for (const caractere of ligne) {
		const taille = encodeur.encode(caractere).length;
		const limite = morceaux.length ? 74 : 75; // l'espace de continuation compte
		if (octets + taille > limite) {
			morceaux.push(courant);
			courant = '';
			octets = 0;
		}
		courant += caractere;
		octets += taille;
	}
	morceaux.push(courant);
	return morceaux.join('\r\n ');
}

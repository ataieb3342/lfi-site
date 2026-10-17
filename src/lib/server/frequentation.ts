import { createHash, randomBytes } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db.ts';
import { adressesBloquees, cleAdresse } from './limiteur.ts';

/**
 * La fréquentation du site, comptée par le site lui-même.
 *
 * Aucun outil extérieur, aucun cookie, aucun script : tout part de
 * hooks.server.ts et de ce que chaque requête apporte de toute façon (la page
 * demandée, le site d'où l'on vient, le nom du navigateur).
 *
 * Ce qui est conservé, et rien d'autre :
 *  - par jour : le nombre de pages vues, de visiteurs, de passages de robots ;
 *  - par jour et par page : le nombre de vues ;
 *  - par jour et par site d'origine : le nombre d'arrivées (« google.com ») ;
 *  - par minute : le nombre de requêtes reçues, bloquées, en erreur, et
 *    d'adresses différentes. C'est ce qui montre une attaque.
 *
 * Compter des visiteurs sans les suivre : on calcule une empreinte de
 * l'adresse IP et du navigateur, avec un sel tiré au hasard chaque jour et
 * gardé en mémoire seulement. À minuit, le sel est oublié sans avoir jamais
 * été écrit nulle part : plus personne, nous compris, ne peut relier deux
 * visites ni remonter à une adresse. Seul le total part en base. Un
 * redémarrage du site oublie aussi le sel : quelqu'un qui revient le même
 * jour après une mise à jour compte alors deux fois. Les chiffres sont des
 * ordres de grandeur, pas une comptabilité.
 *
 * Les compteurs vivent en mémoire et sont versés en base une fois par minute,
 * en une seule transaction : sous une vague de centaines de requêtes par
 * seconde, écrire chacune ferait le travail de l'attaquant à sa place.
 */

/**
 * Une minute devient un « pic » au-delà de 600 requêtes, soit dix par seconde.
 * Le site en reçoit d'habitude quelques dizaines par minute.
 */
export const SEUIL_PIC = 600;

/** Deux minutes de pic séparées de moins de cinq minutes forment un même épisode. */
const ECART_PIC_MINUTES = 5;

/**
 * Les robots s'annoncent presque tous : moteurs de recherche, aperçus de lien
 * des messageries, outils en ligne de commande, et la vérification de santé de
 * Docker (« node »). Ils sont comptés à part, pas comme des visiteurs.
 */
const ROBOTS =
	/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|wget|python|go-http|java\/|^node$|headless|lighthouse|monitor/i;

/** Quelques noms rendus lisibles. Les autres sites gardent leur nom de domaine. */
const RENOMMER: Record<string, string> = {
	't.co': 'x.com',
	'com.google.android.gm': 'gmail',
	'com.google.android.googlequicksearchbox': 'google.com'
};

/**
 * Des bornes, pour qu'un robot qui invente des adresses de page ou des sites
 * d'origine ne puisse pas remplir la base : au-delà, tout tombe dans
 * « (autres) ».
 */
const MAX_PAGES_PAR_JOUR = 2000;
const MAX_PROVENANCES_PAR_JOUR = 300;
const MAX_VISITEURS_PAR_JOUR = 200_000;
const MAX_ADRESSES_PAR_MINUTE = 50_000;
const AUTRES = '(autres)';

type Journee = {
	jour: string;
	sel: Buffer;
	/** Empreintes des visiteurs du jour. En mémoire seulement, jamais en base. */
	visiteurs: Set<string>;
	pages: Set<string>;
	provenances: Set<string>;
};

type Cumul = {
	pagesVues: number;
	visiteurs: number;
	robots: number;
	pages: Map<string, number>;
	provenances: Map<string, number>;
};

type Minute = { requetes: number; bloquees: number; erreurs: number; adresses: Set<string> };

let journee: Journee | null = null;
const cumuls = new Map<string, Cumul>();
const minutes = new Map<string, Minute>();

const FORMAT_JOUR = new Intl.DateTimeFormat('fr-FR', {
	timeZone: 'Europe/Paris',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** « 2026-10-17 » : la date du jour à Paris, et non en UTC, pour que minuit soit minuit. */
export function jourParis(date = new Date()): string {
	const parties = Object.fromEntries(FORMAT_JOUR.formatToParts(date).map((p) => [p.type, p.value]));
	return `${parties.year}-${parties.month}-${parties.day}`;
}

/** « 2026-10-17T06:32 » : la minute, en UTC comme toutes les dates en base. */
function cleMinute(date = new Date()): string {
	return date.toISOString().slice(0, 16);
}

function journeeCourante(): Journee {
	const jour = jourParis();
	if (journee?.jour !== jour) {
		journee = { jour, sel: randomBytes(16), visiteurs: new Set(), pages: new Set(), provenances: new Set() };
	}
	return journee;
}

function cumulDu(jour: string): Cumul {
	let cumul = cumuls.get(jour);
	if (!cumul) {
		cumul = { pagesVues: 0, visiteurs: 0, robots: 0, pages: new Map(), provenances: new Map() };
		cumuls.set(jour, cumul);
	}
	return cumul;
}

function minuteCourante(): Minute {
	const cle = cleMinute();
	let minute = minutes.get(cle);
	if (!minute) {
		minute = { requetes: 0, bloquees: 0, erreurs: 0, adresses: new Set() };
		minutes.set(cle, minute);
	}
	return minute;
}

function ajouter(compteurs: Map<string, number>, cle: string) {
	compteurs.set(cle, (compteurs.get(cle) ?? 0) + 1);
}

/** La valeur elle-même tant que la borne n'est pas atteinte, « (autres) » ensuite. */
function borner(dejaVues: Set<string>, valeur: string, max: number): string {
	if (dejaVues.has(valeur)) return valeur;
	if (dejaVues.size >= max) return AUTRES;
	dejaVues.add(valeur);
	return valeur;
}

/**
 * Le site d'où arrive le visiteur, d'après l'en-tête Referer : '' pour un
 * accès direct (adresse tapée, favori, lien ouvert depuis une application),
 * null quand il vient d'une autre page du site.
 */
function provenanceDe(referent: string | null, hote: string): string | null {
	if (!referent) return '';
	let nom: string;
	try {
		nom = new URL(referent).hostname.toLowerCase();
	} catch {
		return '';
	}
	const sansPrefixe = (h: string) => h.replace(/^(www|m|l|lm|mobile)\./, '');
	nom = sansPrefixe(nom);
	if (!nom) return '';
	if (nom === sansPrefixe(hote.toLowerCase())) return null;
	return RENOMMER[nom] ?? nom.slice(0, 100);
}

/** À appeler pour chaque requête, servie ou refusée. */
export function compterRequete(adresse: string, bloquee: boolean) {
	demarrer();
	const minute = minuteCourante();
	minute.requetes++;
	if (bloquee) minute.bloquees++;
	if (minute.adresses.size < MAX_ADRESSES_PAR_MINUTE) minute.adresses.add(cleAdresse(adresse));
}

/**
 * À appeler avec chaque réponse servie. Ne compte comme page vue qu'une page
 * réellement affichée : une requête GET réussie qui renvoie du HTML, ou les
 * données d'une page quand le visiteur navigue sans recharger (SvelteKit ne
 * redemande alors que les données). Les images, les flux, l'administration et
 * les administrateurs connectés ne comptent pas.
 */
export function compterReponse(event: RequestEvent, reponse: Response, adresse: string) {
	if (reponse.status >= 500) minuteCourante().erreurs++;

	if (event.request.method !== 'GET' || reponse.status !== 200) return;
	if (adresse === 'inconnue' || event.locals.admin) return;
	const chemin = event.url.pathname;
	if (chemin.startsWith('/admin')) return;
	const document = !event.isDataRequest;
	if (document && !(reponse.headers.get('content-type') ?? '').startsWith('text/html')) return;

	const jour = journeeCourante();
	const cumul = cumulDu(jour.jour);
	const navigateur = event.request.headers.get('user-agent') ?? '';
	if (!navigateur || ROBOTS.test(navigateur)) {
		cumul.robots++;
		return;
	}

	cumul.pagesVues++;
	ajouter(cumul.pages, borner(jour.pages, chemin.slice(0, 200), MAX_PAGES_PAR_JOUR));

	const empreinte = createHash('sha256')
		.update(jour.sel)
		.update(adresse)
		.update('\n')
		.update(navigateur)
		.digest('base64url')
		.slice(0, 16);
	if (!jour.visiteurs.has(empreinte) && jour.visiteurs.size < MAX_VISITEURS_PAR_JOUR) {
		jour.visiteurs.add(empreinte);
		cumul.visiteurs++;
	}

	// Seul le premier chargement dit d'où l'on vient : ensuite, le visiteur
	// arrive de nos propres pages.
	if (document) {
		const provenance = provenanceDe(event.request.headers.get('referer'), event.url.hostname);
		if (provenance !== null) {
			ajouter(cumul.provenances, borner(jour.provenances, provenance, MAX_PROVENANCES_PAR_JOUR));
		}
	}
}

/**
 * Verse les compteurs en base. Les minutes ne sont versées qu'une fois
 * terminées, sauf à l'arrêt du site (`tout`), où rien ne doit être perdu.
 */
export function verserEnBase(tout = false) {
	if (cumuls.size === 0 && minutes.size === 0) return;
	const base = db();
	const enCours = cleMinute();
	const minutesVersees: string[] = [];

	base.exec('begin');
	try {
		const jourSql = base.prepare(`
			insert into frequentation_jours (jour, pages_vues, visiteurs, robots) values (?, ?, ?, ?)
			on conflict (jour) do update set
				pages_vues = pages_vues + excluded.pages_vues,
				visiteurs = visiteurs + excluded.visiteurs,
				robots = robots + excluded.robots
		`);
		const pageSql = base.prepare(`
			insert into frequentation_pages (jour, chemin, vues) values (?, ?, ?)
			on conflict (jour, chemin) do update set vues = vues + excluded.vues
		`);
		const provenanceSql = base.prepare(`
			insert into frequentation_provenances (jour, provenance, arrivees) values (?, ?, ?)
			on conflict (jour, provenance) do update set arrivees = arrivees + excluded.arrivees
		`);
		const minuteSql = base.prepare(`
			insert into trafic_minutes (minute, requetes, bloquees, erreurs, adresses) values (?, ?, ?, ?, ?)
			on conflict (minute) do update set
				requetes = requetes + excluded.requetes,
				bloquees = bloquees + excluded.bloquees,
				erreurs = erreurs + excluded.erreurs,
				adresses = max(adresses, excluded.adresses)
		`);

		for (const [jour, cumul] of cumuls) {
			jourSql.run(jour, cumul.pagesVues, cumul.visiteurs, cumul.robots);
			for (const [chemin, vues] of cumul.pages) pageSql.run(jour, chemin, vues);
			for (const [provenance, arrivees] of cumul.provenances) provenanceSql.run(jour, provenance, arrivees);
		}
		for (const [cle, minute] of minutes) {
			if (cle >= enCours && !tout) continue;
			minuteSql.run(cle, minute.requetes, minute.bloquees, minute.erreurs, minute.adresses.size);
			minutesVersees.push(cle);
		}
		base.exec('commit');
	} catch (err) {
		base.exec('rollback');
		console.error('[fréquentation] enregistrement impossible', err);
		return;
	}

	cumuls.clear();
	for (const cle of minutesVersees) minutes.delete(cle);
}

let demarre = false;
function demarrer() {
	if (demarre) return;
	demarre = true;
	setInterval(() => verserEnBase(), 60_000).unref();
	// Émis par adapter-node quand Docker arrête le conteneur (mise à jour) :
	// la minute en cours est versée au lieu d'être perdue.
	process.on('sveltekit:shutdown', () => verserEnBase(true));
}

// ----------------------------------------------------------------- lecture

export type JourFrequentation = { jour: string; pagesVues: number; visiteurs: number; robots: number };
export type TranchesTrafic = { debut: string; servies: number; bloquees: number };
export type Pic = {
	debut: string;
	fin: string;
	requetes: number;
	bloquees: number;
	erreurs: number;
	parMinute: number;
	adresses: number;
	/** Attaque probable, plutôt qu'un article très partagé (voir `attaqueProbable`). */
	attaque: boolean;
};

/**
 * Une attaque se reconnaît à ses requêtes bloquées, ou à des adresses qui
 * demandent chacune bien plus qu'un lecteur (soixante requêtes par minute et
 * par adresse, au plus fort). Beaucoup d'adresses différentes et peu de
 * blocages, c'est plutôt un article qui circule.
 */
function attaqueProbable(pic: Pic): boolean {
	return pic.bloquees >= pic.requetes * 0.2 || pic.parMinute / Math.max(1, pic.adresses) >= 60;
}

type LigneMinute = { minute: string; requetes: number; bloquees: number; erreurs: number; adresses: number };

/** Les `nombre` derniers jours, aujourd'hui compris, du plus ancien au plus récent. */
function derniersJours(nombre: number): string[] {
	const [annee, mois, jour] = jourParis().split('-').map(Number);
	return Array.from({ length: nombre }, (_, i) =>
		new Date(Date.UTC(annee, mois - 1, jour - (nombre - 1 - i))).toISOString().slice(0, 10)
	);
}

/** Regroupe les minutes de pic consécutives en épisodes, du plus récent au plus ancien. */
function regrouperPics(lignes: LigneMinute[]): Pic[] {
	const pics: Pic[] = [];
	let courant: Pic | null = null;
	for (const ligne of lignes) {
		const debut = new Date(`${ligne.minute}Z`).getTime();
		const finCourant = courant ? new Date(`${courant.fin}Z`).getTime() : 0;
		if (!courant || debut - finCourant > ECART_PIC_MINUTES * 60_000) {
			courant = {
				debut: ligne.minute,
				fin: ligne.minute,
				requetes: 0,
				bloquees: 0,
				erreurs: 0,
				parMinute: 0,
				adresses: 0,
				attaque: false
			};
			pics.push(courant);
		}
		courant.fin = ligne.minute;
		courant.requetes += ligne.requetes;
		courant.bloquees += ligne.bloquees;
		courant.erreurs += ligne.erreurs;
		courant.parMinute = Math.max(courant.parMinute, ligne.requetes);
		courant.adresses = Math.max(courant.adresses, ligne.adresses);
	}
	for (const pic of pics) pic.attaque = attaqueProbable(pic);
	return pics.reverse();
}

function picsDepuis(depuis: Date): Pic[] {
	const lignes = db()
		.prepare(
			'select minute, requetes, bloquees, erreurs, adresses from trafic_minutes where minute >= ? and requetes >= ? order by minute'
		)
		.all(cleMinute(depuis), SEUIL_PIC) as LigneMinute[];
	return regrouperPics(lignes);
}

/** Le pic le plus récent des dernières 48 heures, pour l'alerte du tableau de bord. */
export function picRecent(): Pic | null {
	verserEnBase();
	return picsDepuis(new Date(Date.now() - 48 * 3600_000))[0] ?? null;
}

/** Résumé pour le tableau de bord : visiteurs du jour et des sept derniers jours. */
export function resumeFrequentation(): { aujourdhui: number; semaine: number } {
	verserEnBase();
	const jours = derniersJours(7);
	const ligne = db()
		.prepare(
			`select coalesce(sum(visiteurs), 0) as semaine,
				coalesce(sum(case when jour = ? then visiteurs end), 0) as aujourdhui
			 from frequentation_jours where jour >= ?`
		)
		.get(jours[6], jours[0]) as { semaine: number; aujourdhui: number };
	return { aujourdhui: ligne.aujourdhui, semaine: ligne.semaine };
}

/** Tout ce qu'affiche la page Fréquentation de l'administration. */
export function lireFrequentation() {
	verserEnBase();
	const base = db();

	const jours = derniersJours(30);
	const lignesJours = base
		.prepare('select jour, pages_vues, visiteurs, robots from frequentation_jours where jour >= ?')
		.all(jours[0]) as { jour: string; pages_vues: number; visiteurs: number; robots: number }[];
	const parJour = new Map(lignesJours.map((l) => [l.jour, l]));
	const trenteJours: JourFrequentation[] = jours.map((jour) => {
		const ligne = parJour.get(jour);
		return { jour, pagesVues: ligne?.pages_vues ?? 0, visiteurs: ligne?.visiteurs ?? 0, robots: ligne?.robots ?? 0 };
	});

	const pages = base
		.prepare(
			'select chemin, sum(vues) as vues from frequentation_pages where jour >= ? group by chemin order by vues desc limit 15'
		)
		.all(jours[0]) as { chemin: string; vues: number }[];

	const provenances = base
		.prepare(
			`select provenance, sum(arrivees) as arrivees from frequentation_provenances
			 where jour >= ? group by provenance order by arrivees desc limit 10`
		)
		.all(jours[0]) as { provenance: string; arrivees: number }[];

	// Le trafic des dernières 24 heures, par demi-heures. La minute en cours
	// n'est pas encore en base : on la reprend de la mémoire.
	const maintenant = Date.now();
	const DEMI_HEURE = 30 * 60_000;
	const premiere = Math.floor((maintenant - 24 * 3600_000) / DEMI_HEURE) * DEMI_HEURE + DEMI_HEURE;
	const tranches: TranchesTrafic[] = [];
	for (let t = premiere; t <= maintenant; t += DEMI_HEURE) {
		tranches.push({ debut: cleMinute(new Date(t)), servies: 0, bloquees: 0 });
	}
	const lignesMinutes = base
		.prepare('select minute, requetes, bloquees from trafic_minutes where minute >= ?')
		.all(tranches[0].debut) as { minute: string; requetes: number; bloquees: number }[];
	const enMemoire = [...minutes].map(([minute, m]) => ({ minute, requetes: m.requetes, bloquees: m.bloquees }));
	for (const ligne of [...lignesMinutes, ...enMemoire]) {
		const indice = Math.floor((new Date(`${ligne.minute}Z`).getTime() - premiere) / DEMI_HEURE);
		const tranche = tranches[indice];
		if (!tranche) continue;
		tranche.servies += ligne.requetes - ligne.bloquees;
		tranche.bloquees += ligne.bloquees;
	}

	// Un pic est « en cours » si la minute qui vient de s'achever, ou celle qui
	// commence, dépasse le seuil : on affiche alors la plus chargée des deux.
	const minuteEnCours = minutes.get(cleMinute());
	const precedente = (base
		.prepare('select requetes, bloquees from trafic_minutes where minute = ?')
		.get(cleMinute(new Date(maintenant - 60_000))) as { requetes: number; bloquees: number } | undefined) ?? {
		requetes: 0,
		bloquees: 0
	};
	const courante = { requetes: minuteEnCours?.requetes ?? 0, bloquees: minuteEnCours?.bloquees ?? 0 };
	const plusChargee = courante.requetes >= precedente.requetes ? courante : precedente;

	return {
		trenteJours,
		pages,
		provenances,
		tranches,
		pics: picsDepuis(new Date(maintenant - 90 * 24 * 3600_000)).slice(0, 20),
		maintenant: {
			requetesMinute: courante.requetes,
			adressesBloquees: adressesBloquees(),
			picEnCours: plusChargee.requetes >= SEUIL_PIC ? plusChargee : null,
			enLigneDepuis: new Date(maintenant - process.uptime() * 1000).toISOString(),
			memoireMo: Math.round(process.memoryUsage().rss / 1024 / 1024)
		}
	};
}

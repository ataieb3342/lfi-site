import type { PageServerLoad } from './$types';
import type { PublicationVue } from '$lib/types';
import { listAgenda, listPinnedPublished, listPublished } from '$lib/server/content';
import { presentMediaRecommande, presentPublication } from '$lib/server/present';
import { listMediasRecommandes } from '$lib/server/medias-recommandes';

/**
 * Nombre de rendez-vous du fil « Les prochains rendez-vous ». Un nombre et non
 * une durée : avec une fenêtre de quinze jours, le fil n'en montrait que deux
 * quand le suivant tombait le seizième jour, et se vidait entre deux périodes
 * chargées.
 */
const DANS_LE_FIL = 6;
/** Rendez-vous suivants, listés dans la colonne « Plus tard dans l'agenda ». */
const PLUS_TARD = 5;

/** AAAA-MM-JJ à l'heure du serveur, comme la page /agenda. */
function jourIso(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Un rendez-vous qui revient (le rassemblement de chaque samedi : une fiche
 * par date) n'apparaît qu'une fois, à sa prochaine date. Les suivantes sont
 * seulement comptées : six fois le même titre remplissaient la page. Quand
 * toutes les dates sont espacées d'une semaine, `rythme` le dit en clair :
 * « Chaque samedi ».
 */
function regrouperRepetitions<T extends PublicationVue>(liste: T[]) {
	const resultat: (T & { autresDates: number; rythme: string | null })[] = [];
	const dates = new Map<string, string[]>();
	for (const publication of liste) {
		const deja = publication.aVenir ? dates.get(publication.title) : undefined;
		// Un même intitulé à une autre date est une répétition. Deux rendez-vous
		// réellement distincts le même jour doivent en revanche rester visibles.
		if (deja && publication.eventAt && !deja.includes(publication.eventAt)) {
			if (publication.eventAt) deja.push(publication.eventAt);
			continue;
		}
		resultat.push({ ...publication, autresDates: 0, rythme: null });
		if (publication.aVenir && !dates.has(publication.title)) {
			dates.set(publication.title, publication.eventAt ? [publication.eventAt] : []);
		}
	}
	for (const ligne of resultat) {
		const toutes = dates.get(ligne.title) ?? [];
		ligne.autresDates = Math.max(0, toutes.length - 1);
		const hebdomadaire =
			toutes.length > 1 &&
			toutes.every((date, i) => i === 0 || joursEntre(toutes[i - 1], date) === 7);
		if (hebdomadaire) {
			const jour = new Date(`${toutes[0]}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long' });
			ligne.rythme = `Chaque ${jour}`;
		}
	}
	return resultat;
}

function joursEntre(avant: string, apres: string): number {
	return Math.round((Date.parse(`${apres}T12:00:00Z`) - Date.parse(`${avant}T12:00:00Z`)) / 86_400_000);
}

export const load: PageServerLoad = async () => {
	const articles = listPublished({ kind: 'article', limit: 12 }).map(presentPublication);
	// La une est choisie et rangée à la main (Administration → À la une). Si
	// elle est vide, la section disparaît au lieu d'y maintenir le dernier
	// article publié.
	const aLaUne = listPinnedPublished().map(presentPublication);
	const idsALaUne = new Set(aLaUne.map((publication) => publication.id));

	// Le fil des prochains rendez-vous : événements, formations et apéros
	// confondus, dans l'ordre du calendrier, à partir d'aujourd'hui. Toutes
	// les dates à venir sont lues : c'est ce qui permet de reconnaître un
	// rendez-vous hebdomadaire.
	const maintenant = new Date();
	const aujourdhui = jourIso(maintenant);
	const demain = jourIso(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1));
	const aVenir = regrouperRepetitions(listAgenda(aujourdhui, '9999-12-31').map(presentPublication));
	const prochainsRendezVous = aVenir.slice(0, DANS_LE_FIL).map((rdv) => ({
		...rdv,
		jour: rdv.eventAt === aujourdhui ? 'Aujourd’hui' : rdv.eventAt === demain ? 'Demain' : null
	}));
	// La colonne de droite prend la suite du fil, sans le répéter.
	const plusTard = aVenir.slice(DANS_LE_FIL, DANS_LE_FIL + PLUS_TARD).filter((rdv) => !idsALaUne.has(rdv.id));

	return {
		aLaUne,
		articles: articles.filter((article) => !idsALaUne.has(article.id)).slice(0, 5),
		prochainsRendezVous,
		plusTard,
		// Les médias cochés « Sur l'accueil » dans l'administration.
		medias: listMediasRecommandes({ accueil: true }).map(presentMediaRecommande)
	};
};

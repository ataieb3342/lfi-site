import type { PageServerLoad } from './$types';
import type { PublicationVue } from '$lib/types';
import { listAgenda, listPinnedPublished, listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

/** Nombre de jours couverts par le fil « Les prochains jours ». */
const HORIZON = 15;

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
		if (deja) {
			if (publication.eventAt) deja.push(publication.eventAt);
			continue;
		}
		resultat.push({ ...publication, autresDates: 0, rythme: null });
		if (publication.aVenir) dates.set(publication.title, publication.eventAt ? [publication.eventAt] : []);
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
	const epinglees = listPinnedPublished().map(presentPublication);
	// Tant que rien n'est explicitement épinglé, l'article le plus récent garde
	// le rôle historique de une. Dès qu'une ou plusieurs fiches sont choisies,
	// elles prennent toutes place dans la section, quel que soit leur type.
	const aLaUne = epinglees.length ? epinglees : articles.slice(0, 1);
	const idsALaUne = new Set(aLaUne.map((publication) => publication.id));

	// Le fil des prochains jours : actions, événements, formations et apéros
	// confondus, dans l'ordre du calendrier.
	const maintenant = new Date();
	const aujourdhui = jourIso(maintenant);
	const demain = jourIso(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1));
	const fin = jourIso(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + HORIZON));
	// Toutes les dates à venir sont lues, pas seulement celles du fil : c'est
	// ce qui permet de reconnaître un rendez-vous hebdomadaire.
	const aVenir = regrouperRepetitions(listAgenda(aujourdhui, '9999-12-31').map(presentPublication));
	const prochainsJours = aVenir
		.filter((rdv) => rdv.eventAt! < fin)
		.filter((rdv) => !idsALaUne.has(rdv.id))
		.slice(0, 8)
		.map((rdv) => ({
			...rdv,
			jour: rdv.eventAt === aujourdhui ? 'Aujourd’hui' : rdv.eventAt === demain ? 'Demain' : null
		}));

	// La colonne « Actualités » ne répète pas ce que le fil montre déjà : elle
	// garde les brèves, les comptes rendus et les rendez-vous plus lointains.
	const dansLeFil = new Set(prochainsJours.map((rdv) => rdv.title));
	const actus = regrouperRepetitions(
		listPublished({ kind: 'actu', limit: 30, ordre: 'agenda' }).map(presentPublication)
	).filter((actu) => !dansLeFil.has(actu.title) && !idsALaUne.has(actu.id));

	return {
		aLaUne,
		articles: articles.filter((article) => !idsALaUne.has(article.id)).slice(0, 5),
		prochainsJours,
		actus: actus.slice(0, 5)
	};
};

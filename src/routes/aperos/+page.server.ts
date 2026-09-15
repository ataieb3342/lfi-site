import type { PageServerLoad } from './$types';
import { countApprovedSources, listPublished } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

/**
 * La page des apéros thématiques.
 *
 * Elle a sa propre route plutôt que de passer par la page générique de
 * rubrique : le prochain apéro est mis en avant, et les précédents forment une
 * archive des thèmes abordés. Un apéro est une publication de type « apero »
 * dont la date d'action est celle de la soirée ; sa fiche est publiée avant
 * (l'annonce du thème), puis complétée après (le résumé des échanges).
 */
export const load: PageServerLoad = async () => {
	// Deux ans d'apéros à raison d'un toutes les deux semaines : largement assez
	// pour s'épargner une pagination.
	const tous = listPublished({ kind: 'apero', limit: 120, ordre: 'archives' }).map((ligne) => ({
		...presentPublication(ligne),
		// Vrai dès que quelqu'un a écrit le résumé : avant, la fiche passée
		// affiche « résumé à venir » plutôt qu'une page vide.
		resumeDisponible: ligne.body.trim().length > 0,
		// Le dossier partagé : ce que les uns et les autres proposent de lire
		// ou de voir avant la soirée.
		nombreSources: countApprovedSources(ligne.id)
	}));

	return {
		aVenir: tous.filter((a) => a.aVenir),
		passes: tous.filter((a) => !a.aVenir)
	};
};

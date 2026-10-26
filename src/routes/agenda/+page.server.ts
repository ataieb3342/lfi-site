import type { PageServerLoad } from './$types';
import { listAgenda, type CategorieEvenement } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

function moisValide(valeur: string | null): string | null {
	return valeur && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(valeur) ? valeur : null;
}

function decalerMois(mois: string, decalage: number): string {
	const [annee, numero] = mois.split('-').map(Number);
	// UTC évite qu'un changement d'heure transforme le premier du mois en veille.
	const date = new Date(Date.UTC(annee, numero - 1 + decalage, 1));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Les filtres de l'agenda, dans l'ordre des pastilles. */
const TYPES: CategorieEvenement[] = ['reunion', 'formation', 'apero'];

/** Au-delà, la liste renvoie au calendrier : personne ne lit soixante lignes. */
const MAX_LISTE = 40;

/**
 * Deux vues de la même page, choisies par l'adresse et non par un script :
 *
 * - la **liste** (par défaut) : tous les rendez-vous à venir, regroupés par
 *   mois. C'est ce qu'on cherche en arrivant - « qu'est-ce qu'il y a
 *   bientôt ? » - et la seule vue lisible sur téléphone ;
 * - le **calendrier** (`?vue=calendrier&mois=AAAA-MM`) : un mois en grille,
 *   pour se projeter ou retrouver un rendez-vous passé.
 *
 * Le filtre par type (`?type=`) vaut pour les deux. Il est appliqué par le
 * serveur : les pastilles sont des liens, elles marchent sans JavaScript et
 * une vue filtrée se partage.
 */
export const load: PageServerLoad = async ({ url }) => {
	const maintenant = new Date();
	const aujourdhui = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;
	const typeDemande = url.searchParams.get('type');
	const type = TYPES.includes(typeDemande as CategorieEvenement) ? (typeDemande as CategorieEvenement) : null;
	const filtrer = <T extends { eventCategory: string }>(liste: T[]) =>
		type ? liste.filter((rdv) => rdv.eventCategory === type) : liste;

	const moisDemande = moisValide(url.searchParams.get('mois'));
	const calendrier = url.searchParams.get('vue') === 'calendrier' || moisDemande !== null;
	const moisCourant = aujourdhui.slice(0, 7);

	if (calendrier) {
		const mois = moisDemande ?? moisCourant;
		const suivant = decalerMois(mois, 1);
		return {
			vue: 'calendrier' as const,
			type,
			aujourdhui,
			mois,
			moisPrecedent: decalerMois(mois, -1),
			moisSuivant: suivant,
			rendezVous: filtrer(listAgenda(`${mois}-01`, `${suivant}-01`).map(presentPublication))
		};
	}

	const aVenir = filtrer(listAgenda(aujourdhui, '9999-12-31').map(presentPublication));
	return {
		vue: 'liste' as const,
		type,
		aujourdhui,
		mois: moisCourant,
		rendezVous: aVenir.slice(0, MAX_LISTE),
		reste: Math.max(0, aVenir.length - MAX_LISTE)
	};
};

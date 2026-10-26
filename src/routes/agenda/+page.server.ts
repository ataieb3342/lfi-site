import type { PageServerLoad } from './$types';
import { listAgenda } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';

function moisValide(valeur: string | null): string {
	if (valeur && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(valeur)) return valeur;
	// Le mois courant suit le fuseau du serveur, comme date('now') dans les
	// autres requêtes d'agenda du site.
	const maintenant = new Date();
	return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
}

function decalerMois(mois: string, decalage: number): string {
	const [annee, numero] = mois.split('-').map(Number);
	// UTC évite qu'un changement d'heure transforme le premier du mois en veille.
	const date = new Date(Date.UTC(annee, numero - 1 + decalage, 1));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Nombre de rendez-vous de la liste « À venir », au-dessus du calendrier. */
const A_VENIR = 10;

export const load: PageServerLoad = async ({ url }) => {
	const mois = moisValide(url.searchParams.get('mois'));
	const debut = `${mois}-01`;
	const suivant = decalerMois(mois, 1);
	const maintenant = new Date();
	const aujourdhui = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;

	return {
		mois,
		moisPrecedent: decalerMois(mois, -1),
		moisSuivant: suivant,
		evenements: listAgenda(debut, `${suivant}-01`).map(presentPublication),
		// Le calendrier d'un mois se lit mal sur téléphone : la liste des
		// prochains rendez-vous, elle, se lit partout. C'est elle qui a pris la
		// place de l'ancienne page Actualités.
		aVenir: listAgenda(aujourdhui, '9999-12-31').slice(0, A_VENIR).map(presentPublication)
	};
};

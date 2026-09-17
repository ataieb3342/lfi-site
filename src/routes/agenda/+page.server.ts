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

export const load: PageServerLoad = async ({ url }) => {
	const mois = moisValide(url.searchParams.get('mois'));
	const debut = `${mois}-01`;
	const suivant = decalerMois(mois, 1);

	return {
		mois,
		moisPrecedent: decalerMois(mois, -1),
		moisSuivant: suivant,
		evenements: listAgenda(debut, `${suivant}-01`).map(presentPublication)
	};
};

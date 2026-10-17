import type { PageServerLoad } from './$types';
import { lireFrequentation, SEUIL_PIC } from '$lib/server/frequentation';
import { titresParSlug } from '$lib/server/content';
import { lienPublication } from '$lib/format';
import { OUTILS, urlOutil } from '$lib/boite-a-outils';
import { JEUX, urlJeu } from '$lib/jeux';

/** Pour afficher un titre plutôt qu'une adresse dans la liste des pages lues. */
const PAGES_FIXES: Record<string, string> = {
	'/': 'Accueil',
	'/articles': 'Articles',
	'/actualites': 'Actualités',
	'/agenda': 'Agenda',
	'/aperos': 'Apéros',
	'/revue-de-presse': 'Revue de presse',
	'/bibliotheque': 'Bibliothèque',
	'/boite-a-outils': 'Boîte à outils',
	'/jeux': 'Jeux',
	'/medias': 'Médias recommandés',
	'/le-groupe': 'Le groupe',
	'/nous-rejoindre': 'Nous rejoindre',
	'/confidentialite': 'Confidentialité',
	'/mentions-legales': 'Mentions légales'
};

export const load: PageServerLoad = async () => {
	const frequentation = lireFrequentation();

	const titres = new Map(Object.entries(PAGES_FIXES));
	for (const outil of OUTILS) titres.set(urlOutil(outil), outil.titre);
	for (const jeu of JEUX) titres.set(urlJeu(jeu), jeu.titre);
	const slugs = frequentation.pages.map((p) => p.chemin.split('/').pop() ?? '').filter(Boolean);
	for (const p of titresParSlug(slugs)) titres.set(lienPublication(p.kind, p.slug), p.title);

	return {
		...frequentation,
		pages: frequentation.pages.map((p) => ({ ...p, titre: titres.get(p.chemin) ?? null })),
		seuilPic: SEUIL_PIC
	};
};

import type { RequestHandler } from './$types';
import { listPublished } from '$lib/server/content';
import { RUBRIQUE_PAR_KIND } from '$lib/rubriques';
import { JEUX, urlJeu } from '$lib/jeux';
import { OUTILS, urlOutil } from '$lib/boite-a-outils';
import type { Kind } from '$lib/rubriques';

/**
 * Les pages qui ne viennent pas de la base.
 *
 * Les mentions légales et la page de confidentialité n'y sont volontairement
 * pas : elles portent un `noindex`, et annoncer dans le plan du site une page
 * qu'on demande par ailleurs de ne pas indexer est contradictoire — la console
 * de Google le signale comme une erreur.
 */
const PAGES_FIXES = [
	'/',
	'/articles',
	'/actualites',
	'/aperos',
	'/revue-de-presse',
	'/bibliotheque',
	'/boite-a-outils',
	'/jeux',
	'/le-groupe',
	'/nous-rejoindre',
	...OUTILS.map(urlOutil),
	...JEUX.map(urlJeu)
];

/** Les pages de liste, datées de leur publication la plus récente. */
const LISTES: Record<string, Kind> = {
	'/articles': 'article',
	'/actualites': 'actu',
	'/aperos': 'apero',
	'/revue-de-presse': 'revue'
};

export const GET: RequestHandler = async ({ url }) => {
	const base = url.origin;
	const publications = listPublished({ limit: 500 });

	// Dernière modification par type, pour dater les pages de liste : un plan du
	// site qui dit « rien n'a bougé » évite au moteur de recharger pour rien, et
	// une date fraîche sur /actualites l'incite à revenir vite après une publication.
	const dernierParKind = new Map<string, string>();
	for (const p of publications) {
		const jour = (p.updated_at ?? p.created_at).slice(0, 10);
		const connu = dernierParKind.get(p.kind);
		if (!connu || jour > connu) dernierParKind.set(p.kind, jour);
	}

	const ligne = (chemin: string, jour?: string) =>
		`	<url><loc>${base}${chemin}</loc>${jour ? `<lastmod>${jour}</lastmod>` : ''}</url>`;

	// L'accueil est daté de la publication la plus récente, tous types confondus.
	const dernierTout = [...dernierParKind.values()].sort().pop();

	const urls = [
		...PAGES_FIXES.map((chemin) =>
			ligne(chemin, chemin === '/' ? dernierTout : dernierParKind.get(LISTES[chemin]))
		),
		...publications.map((p) =>
			ligne(
				`/${RUBRIQUE_PAR_KIND[p.kind]}/${p.slug}`,
				(p.updated_at ?? p.created_at).slice(0, 10)
			)
		)
	].join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }
	);
};

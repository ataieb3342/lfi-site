import type { RequestHandler } from './$types';
import { listPublished } from '$lib/server/content';
import { RUBRIQUE_PAR_KIND } from '$lib/rubriques';
import { JEUX, urlJeu } from '$lib/jeux';

const PAGES_FIXES = [
	'/',
	'/articles',
	'/actualites',
	'/aperos',
	'/bibliotheque',
	'/le-groupe',
	'/nous-rejoindre',
	'/mentions-legales',
	'/confidentialite',
	...JEUX.map(urlJeu)
];

export const GET: RequestHandler = async ({ url }) => {
	const base = url.origin;
	const publications = listPublished({ limit: 500 });

	const urls = [
		...PAGES_FIXES.map((chemin) => `	<url><loc>${base}${chemin}</loc></url>`),
		...publications.map(
			(p) =>
				`	<url><loc>${base}/${RUBRIQUE_PAR_KIND[p.kind]}/${p.slug}</loc><lastmod>${(p.updated_at ?? p.created_at).slice(0, 10)}</lastmod></url>`
		)
	].join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }
	);
};

import type { RequestHandler } from './$types';
import { modeDemo } from '$lib/server/demo';

/**
 * Généré plutôt que statique, afin d'indiquer au moteur de recherche l'adresse
 * absolue du plan du site — quel que soit le domaine sur lequel le site tourne.
 */
export const GET: RequestHandler = async ({ url }) => {
	// Le site de démonstration ne doit pas être indexé du tout.
	const corps = modeDemo()
		? 'User-agent: *\nDisallow: /\n'
		: `User-agent: *
Disallow: /admin
Disallow: /media

Sitemap: ${url.origin}/sitemap.xml
`;
	return new Response(corps, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
	});
};

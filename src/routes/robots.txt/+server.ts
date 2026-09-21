import type { RequestHandler } from './$types';
import { modeDemo } from '$lib/server/demo';

/**
 * Généré plutôt que statique, afin d'indiquer au moteur de recherche l'adresse
 * absolue du plan du site — quel que soit le domaine sur lequel le site tourne.
 *
 * Seule l'administration est interdite. `/media` l'était aussi : c'était une
 * erreur. Ce sont les images des publications, celles-là mêmes qu'on annonce
 * en aperçu (`og:image`) quand un lien est partagé. Interdites au robot,
 * elles n'apparaissent ni dans Google Images, ni dans la vignette d'un partage
 * sur un réseau social — le lien s'affiche alors nu, et il est moins cliqué.
 *
 * Les pages à tenir hors de l'index et qui ne sont pas l'administration — les
 * résultats de recherche de la bibliothèque, les mentions légales — portent un
 * `noindex` dans leur en-tête (voir `Metadonnees.svelte`). C'est volontaire :
 * une page interdite ici ne serait jamais lue, donc son `noindex` ne serait
 * jamais vu, et une adresse déjà connue de Google y resterait indéfiniment.
 */
export const GET: RequestHandler = async ({ url }) => {
	// Le site de démonstration ne doit pas être indexé du tout.
	const corps = modeDemo()
		? 'User-agent: *\nDisallow: /\n'
		: `User-agent: *
Disallow: /admin

Sitemap: ${url.origin}/sitemap.xml
`;
	return new Response(corps, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
	});
};

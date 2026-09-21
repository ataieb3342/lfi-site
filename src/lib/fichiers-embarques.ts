import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Les fichiers des jeux et des outils de la boîte à outils, lus une fois pour toutes
 * à la compilation et embarqués dans le site. Il n'y a donc rien à copier au
 * déploiement : le dossier `build/` contient tout.
 *
 * `import.meta.glob` est une fonctionnalité de Vite, pas de Node : ce module
 * ne doit pas être importé par un script de maintenance. C'est aussi pourquoi
 * il n'est pas dans `src/lib/server/`.
 */
const FICHIERS = import.meta.glob('/src/lib/{jeux,boite-a-outils}/*/*.{html,js,css}', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/**
 * Les images, lues séparément : `?raw` les rendrait en texte et les
 * abîmerait. `?inline` les embarque en base64, qu'on redécode ici pour
 * renvoyer les octets d'origine. Elles restent donc dans `build/`, comme le
 * reste, sans rien à copier au déploiement.
 *
 * Le SVG n'est pas dans la liste, et ne doit pas y entrer : c'est du XML qui
 * peut porter du JavaScript. Les SVG du site (le logo, le favicon) sont
 * écrits dans les composants, pas servis par ici.
 */
const IMAGES = import.meta.glob('/src/lib/{jeux,boite-a-outils}/*/*.{png,jpg,jpeg,webp,gif}', {
	query: '?inline',
	import: 'default',
	eager: true
}) as Record<string, string>;

/** Seules ces extensions sont servies ; tout le reste est introuvable. */
const TYPES: Record<string, string> = {
	html: 'text/html; charset=utf-8',
	js: 'text/javascript; charset=utf-8',
	css: 'text/css; charset=utf-8',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif'
};

/** Vrai pour les extensions servies en binaire plutôt qu'en texte. */
const EST_IMAGE = (extension: string) => extension in TYPES && !['html', 'js', 'css'].includes(extension);

/**
 * Politique de sécurité de ces pages. Comme pour le reste du site, tout est
 * interdit par défaut : seuls le script et la feuille de style de la page,
 * servis par nous, peuvent se charger. Aucun appel réseau, aucune police,
 * aucun contenu extérieur.
 *
 * Elle est écrite ici une seule fois, pour les jeux comme pour les modules :
 * l'assouplir à un endroit sans y penser à l'autre serait trop facile.
 */
const CSP = [
	"default-src 'none'",
	"script-src 'self'",
	"style-src 'self'",
	"style-src-attr 'unsafe-inline'",
	"img-src 'self' data:",
	"form-action 'none'",
	"base-uri 'none'",
	"frame-ancestors 'none'"
].join('; ');

/**
 * Renvoie un fichier d'un jeu ou d'un outil, ou 404 si le dossier demandé
 * n'est pas dans la liste (`src/lib/jeux.ts`, `src/lib/boite-a-outils.ts`) ou si le
 * fichier n'existe pas. Un dossier présent sur le disque mais absent de la
 * liste n'est jamais servi.
 */
export function servirFichierEmbarque(
	racine: 'jeux' | 'boite-a-outils',
	dossiersAutorises: readonly string[],
	dossier: string,
	fichier: string
): Response {
	if (!dossiersAutorises.includes(dossier)) error(404, 'Page introuvable');

	const extension = fichier.split('.').pop() ?? '';
	const type = TYPES[extension];
	const chemin = `/src/lib/${racine}/${dossier}/${fichier}`;
	const image = EST_IMAGE(extension);
	const contenu = image ? IMAGES[chemin] : FICHIERS[chemin];
	if (!type || contenu === undefined) error(404, 'Page introuvable');

	const headers: Record<string, string> = {
		'Content-Type': type,
		// En développement, rien n'est gardé en cache : sans cela, le navigateur
		// sert pendant une heure la version précédente d'un jeu ou d'un module
		// qu'on vient de modifier, et on cherche longtemps une erreur qui n'existe
		// plus. En production, une heure de cache est au contraire souhaitable.
		'Cache-Control': dev ? 'no-store' : 'public, max-age=3600'
	};
	if (extension === 'html') headers['Content-Security-Policy'] = CSP;

	// `contenu` est ici une adresse « data: » ; on ne renvoie que les octets.
	const corps = image ? Buffer.from(contenu.split(',')[1] ?? '', 'base64') : contenu;
	return new Response(corps, { headers });
}

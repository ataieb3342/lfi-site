import { error } from '@sveltejs/kit';
import { JEUX } from '$lib/jeux';

/**
 * Les fichiers des jeux, lus une fois pour toutes à la compilation et embarqués
 * dans le site. Il n'y a donc rien à copier au déploiement : le dossier `build/`
 * contient tout.
 *
 * `import.meta.glob` est une fonctionnalité de Vite, pas de Node : ce module
 * ne doit pas être importé par un script de maintenance.
 */
const FICHIERS = import.meta.glob('/src/lib/jeux/*/*', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/** Seules ces extensions sont servies ; tout le reste est introuvable. */
const TYPES: Record<string, string> = {
	html: 'text/html; charset=utf-8',
	js: 'text/javascript; charset=utf-8',
	css: 'text/css; charset=utf-8'
};

/**
 * Politique de sécurité des pages de jeu. Comme pour le reste du site, tout est
 * interdit par défaut : seuls le script et la feuille de style du jeu, servis
 * par nous, peuvent se charger. Aucun appel réseau, aucune police, aucun
 * contenu extérieur.
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

/** Renvoie un fichier d'un jeu, ou 404 si le jeu ou le fichier n'existe pas. */
export function servirFichierDeJeu(dossier: string, fichier: string): Response {
	if (!JEUX.some((jeu) => jeu.dossier === dossier)) error(404, 'Page introuvable');

	const extension = fichier.split('.').pop() ?? '';
	const type = TYPES[extension];
	const contenu = FICHIERS[`/src/lib/jeux/${dossier}/${fichier}`];
	if (!type || contenu === undefined) error(404, 'Page introuvable');

	const headers: Record<string, string> = {
		'Content-Type': type,
		'Cache-Control': 'public, max-age=3600'
	};
	if (extension === 'html') headers['Content-Security-Policy'] = CSP;

	return new Response(contenu, { headers });
}

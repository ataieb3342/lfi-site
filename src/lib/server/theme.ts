/**
 * Choix d'affichage du visiteur : clair, sombre, ou automatique (le thème
 * suit alors le réglage de son système).
 *
 * Le choix est conservé dans un cookie et relu par le serveur, qui écrit
 * data-theme sur la balise <html> avant d'envoyer la page. Ainsi la page
 * arrive déjà dans le bon thème, sans script en ligne et donc sans toucher
 * à la politique de sécurité.
 */
export const THEME_COOKIE = 'theme';

export const THEMES = ['auto', 'clair', 'sombre'] as const;
export type Theme = (typeof THEMES)[number];

export function lireTheme(valeur: string | undefined): Theme {
	return (THEMES as readonly string[]).includes(valeur ?? '') ? (valeur as Theme) : 'auto';
}

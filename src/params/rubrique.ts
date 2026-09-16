import type { ParamMatcher } from '@sveltejs/kit';

/**
 * Limite le paramètre [rubrique] aux quatre rubriques de publication.
 * Grâce à ce filtre, les pages fixes (/le-groupe, /mentions-legales…) ne sont
 * jamais capturées par la route générique.
 *
 * La liste des apéros a sa propre page (src/routes/aperos), qui l'emporte sur
 * la route générique ; seule la page d'un apéro (/aperos/mon-theme) passe ici.
 */
export const match: ParamMatcher = (param) =>
	param === 'articles' ||
	param === 'actualites' ||
	param === 'aperos' ||
	param === 'revue-de-presse';

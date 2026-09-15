import type { ParamMatcher } from '@sveltejs/kit';

/**
 * Limite le paramètre [rubrique] à « articles » et « actualites ».
 * Grâce à ce filtre, les pages fixes (/le-groupe, /mentions-legales…) ne sont
 * jamais capturées par la route générique.
 */
export const match: ParamMatcher = (param) => param === 'articles' || param === 'actualites';

/**
 * Le site range ses publications en deux familles, d'après la question que se
 * pose le visiteur :
 *
 * - « Où est-ce que je peux venir ? » : l'agenda. Les événements et les
 *   formations (`actu`) et les apéros (`apero`), tous datés.
 * - « Qu'est-ce que vous faites, qu'est-ce que vous pensez ? » : « À lire ».
 *   Les articles, sans date de rendez-vous, qu'ils fassent trois lignes ou
 *   trois pages.
 *
 * La revue de presse, la brève et le retour d'action ont existé : sept types
 * pour un groupe local, c'était trop, et l'équipe elle-même se trompait de
 * case. Ils sont devenus des articles (migration 021). Leurs anciennes
 * adresses redirigent : /revue-de-presse vers /articles, /actualites vers
 * /agenda (voir `src/params/rubrique.ts`).
 */
export type Rubrique = 'articles' | 'actualites' | 'aperos';
export type Kind = 'article' | 'actu' | 'apero';

export const KIND_PAR_RUBRIQUE: Record<Rubrique, Kind> = {
	articles: 'article',
	actualites: 'actu',
	aperos: 'apero'
};

export const RUBRIQUE_PAR_KIND: Record<Kind, Rubrique> = {
	article: 'articles',
	actu: 'actualites',
	apero: 'aperos'
};

/**
 * La page qui liste une rubrique. Les événements gardent leurs fiches sous
 * /actualites/… (des liens ont été partagés), mais leur liste est l'agenda.
 */
export const LISTE_RUBRIQUE: Record<Rubrique, string> = {
	articles: '/articles',
	actualites: '/agenda',
	aperos: '/aperos'
};

export const TITRE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'À lire',
	actualites: 'Agenda',
	aperos: 'Les apéros'
};

export const CHAPO_RUBRIQUE: Record<Rubrique, string> = {
	articles:
		'Ce que fait le groupe et ce qu’il en pense : nos analyses, nos comptes rendus, nos prises de position et nos guides.',
	actualites: 'Les rendez-vous du groupe : réunions publiques, mobilisations, formations et apéros.',
	aperos:
		'Un thème choisi à l’avance, une discussion ouverte à toutes et tous autour d’un verre, puis un résumé des échanges publié ici.'
};

/**
 * Petites capitales affichées au-dessus du titre d'une rubrique, dans la
 * couleur du type de publication (`COULEUR_KIND` de format.ts), pour que
 * toutes les en-têtes se ressemblent et que chaque rubrique porte sa couleur
 * dès le premier coup d'œil.
 */
export const SURLIGNE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Ce que nous faisons et pensons',
	actualites: 'Nos rendez-vous',
	aperos: 'Un lundi sur deux'
};

export type Rubrique = 'articles' | 'actualites' | 'aperos' | 'revue-de-presse';
export type Kind = 'article' | 'actu' | 'apero' | 'revue';

export const KIND_PAR_RUBRIQUE: Record<Rubrique, Kind> = {
	articles: 'article',
	actualites: 'actu',
	aperos: 'apero',
	'revue-de-presse': 'revue'
};

export const RUBRIQUE_PAR_KIND: Record<Kind, Rubrique> = {
	article: 'articles',
	actu: 'actualites',
	apero: 'aperos',
	revue: 'revue-de-presse'
};

export const TITRE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Articles',
	actualites: 'Actualités',
	aperos: 'Les apéros',
	'revue-de-presse': 'Revue de presse'
};

export const CHAPO_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Nos analyses, comptes rendus et prises de position sur la vie locale et nationale.',
	actualites:
		'Les prochains rendez-vous du groupe, nos mobilisations et nos réactions à chaud. Les actions à venir sont affichées en premier.',
	aperos:
		'Un thème choisi à l’avance, une discussion ouverte à toutes et tous autour d’un verre, puis un résumé des échanges publié ici.',
	'revue-de-presse':
		'Ce que nous avons lu ailleurs, rassemblé et remis en perspective : les articles de la semaine, avec ce que nous en retenons.'
};

/**
 * Petites capitales affichées au-dessus du titre d'une rubrique, dans la
 * couleur du type de publication (`COULEUR_KIND` de format.ts). Les pages
 * fixes — bibliothèque, boîte à outils, apéros — en ont une depuis toujours ;
 * les rubriques la reprennent pour que toutes les en-têtes se ressemblent et
 * que chaque rubrique porte sa couleur dès le premier coup d'œil.
 */
export const SURLIGNE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Analyses et prises de position',
	actualites: 'Ce qui se passe à Dijon',
	aperos: 'Un lundi sur deux',
	'revue-de-presse': 'Ce que nous avons lu ailleurs'
};

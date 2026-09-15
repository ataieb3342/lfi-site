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

export const TITRE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Articles',
	actualites: 'Actualités',
	aperos: 'Les apéros'
};

export const CHAPO_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Nos analyses, comptes rendus et prises de position sur la vie locale et nationale.',
	actualites:
		'Les prochains rendez-vous du groupe, nos mobilisations et nos réactions à chaud. Les actions à venir sont affichées en premier.',
	aperos:
		'Un thème choisi à l’avance, une discussion ouverte à toutes et tous autour d’un verre, puis un résumé des échanges publié ici.'
};

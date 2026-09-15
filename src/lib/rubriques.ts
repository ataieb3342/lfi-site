export type Rubrique = 'articles' | 'actualites';
export type Kind = 'article' | 'actu';

export const KIND_PAR_RUBRIQUE: Record<Rubrique, Kind> = {
	articles: 'article',
	actualites: 'actu'
};

export const RUBRIQUE_PAR_KIND: Record<Kind, Rubrique> = {
	article: 'articles',
	actu: 'actualites'
};

export const TITRE_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Articles',
	actualites: 'Actualités'
};

export const CHAPO_RUBRIQUE: Record<Rubrique, string> = {
	articles: 'Nos analyses, comptes rendus et prises de position sur la vie locale et nationale.',
	actualites:
		'Les prochains rendez-vous du groupe, nos mobilisations et nos réactions à chaud. Les actions à venir sont affichées en premier.'
};

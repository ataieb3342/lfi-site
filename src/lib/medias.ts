/**
 * Les médias que le groupe recommande, affichés sur `/medias`.
 *
 * La liste est écrite ici plutôt que dans l'administration : elle bouge
 * rarement, et la recommander est un choix politique du groupe, qui mérite un
 * commit relu plutôt qu'un clic.
 *
 * Elle doit rester courte. Vingt médias, c'est un annuaire ; cinq, c'est un
 * conseil. Pour en ajouter un : une ligne ci-dessous, avec une phrase qui dit
 * pourquoi on le recommande, pas seulement ce qu'il est.
 *
 * Les logos sont dans `static/images/medias/`, en PNG carré de 160 pixels sur
 * fond opaque. Ils sont servis par le site et non chargés depuis celui du
 * média : la CSP l'interdit (`img-src 'self'`), et chaque affichage de
 * l'accueil annoncerait sinon le visiteur à YouTube ou à Mediapart. Pour un
 * nouveau média, prendre l'image de partage (`og:image`) ou l'icône de son
 * site, et la réduire à cette taille.
 */
export const FORMATS = [
	{ id: 'regarder', titre: 'À regarder' },
	{ id: 'lire', titre: 'À lire' }
] as const;

type Format = (typeof FORMATS)[number]['id'];

export const MEDIAS = [
	{
		nom: 'Blast',
		logo: '/images/medias/blast.png',
		format: 'regarder',
		lien: 'https://www.blast-info.fr/',
		description:
			'Un média indépendant financé par ses abonnés : enquêtes, débats et émissions d’actualité.'
	},
	{
		nom: 'Praxis',
		logo: '/images/medias/praxis.png',
		format: 'regarder',
		lien: 'https://www.youtube.com/@PraxisOfficiel',
		description:
			'« Reprendre le pouvoir » : un média d’action citoyenne financé par ses abonnés, pour passer de l’indignation à l’action.'
	},
	{
		nom: 'Mediapart',
		logo: '/images/medias/mediapart.png',
		format: 'lire',
		lien: 'https://www.mediapart.fr/',
		description:
			'Le journal d’enquête sans publicité, à l’origine de plusieurs grandes affaires politico-financières.'
	},
	{
		nom: 'Le Monde diplomatique',
		logo: '/images/medias/monde-diplomatique.png',
		format: 'lire',
		lien: 'https://www.monde-diplomatique.fr/',
		description:
			'Le mensuel des grandes analyses : géopolitique, économie et critique du néolibéralisme.'
	}
] as const satisfies readonly {
	nom: string;
	logo: string;
	format: Format;
	lien: string;
	description: string;
}[];

/** Les formats qui ont au moins un média, chacun avec les siens. */
export function mediasParFormat() {
	return FORMATS.map((format) => ({
		...format,
		medias: MEDIAS.filter((m) => m.format === format.id)
	})).filter((f) => f.medias.length > 0);
}

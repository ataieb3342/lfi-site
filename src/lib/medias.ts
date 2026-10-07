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
 */
export const FORMATS = [
	{ id: 'regarder', titre: 'À regarder' },
	{ id: 'lire', titre: 'À lire' }
] as const;

type Format = (typeof FORMATS)[number]['id'];

export const MEDIAS = [
	{
		nom: 'Blast',
		format: 'regarder',
		lien: 'https://www.blast-info.fr/',
		description:
			'Un média indépendant financé par ses abonnés : enquêtes, débats et émissions d’actualité.'
	},
	{
		nom: 'Histoires crépues',
		format: 'regarder',
		lien: 'https://www.youtube.com/@histoirescrepues',
		description:
			'L’histoire coloniale de la France racontée simplement, pour comprendre ce qu’elle laisse dans le présent.'
	},
	{
		nom: 'Praxis',
		format: 'regarder',
		lien: 'https://www.youtube.com/@praxis',
		description: 'Des vidéos d’analyse politique, pour passer des idées à l’action.'
	},
	{
		nom: 'Mediapart',
		format: 'lire',
		lien: 'https://www.mediapart.fr/',
		description:
			'Le journal d’enquête sans publicité, à l’origine de plusieurs grandes affaires politico-financières.'
	},
	{
		nom: 'Le Monde diplomatique',
		format: 'lire',
		lien: 'https://www.monde-diplomatique.fr/',
		description:
			'Le mensuel des grandes analyses : géopolitique, économie et critique du néolibéralisme.'
	}
] as const satisfies readonly { nom: string; format: Format; lien: string; description: string }[];

/** Les formats qui ont au moins un média, chacun avec les siens. */
export function mediasParFormat() {
	return FORMATS.map((format) => ({
		...format,
		medias: MEDIAS.filter((m) => m.format === format.id)
	})).filter((f) => f.medias.length > 0);
}

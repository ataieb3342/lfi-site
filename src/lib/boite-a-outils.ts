/**
 * La boîte à outils : les outils interactifs de vulgarisation.
 *
 * Le visiteur entre son salaire ou son patrimoine, et voit ce que les chiffres
 * publics disent de sa situation. Même mécanique que les jeux
 * (`src/lib/jeux.ts`) : un dossier de `src/lib/boite-a-outils/` avec un
 * `index.html`, un `outil.js` et un `style.css`, en JavaScript simple et sans
 * dépendance, servi tel quel à l'adresse `/boite-a-outils/<dossier>/`.
 *
 * Ils ont leur propre page plutôt qu'une section de la bibliothèque : ils sont
 * appelés à se multiplier, et ce n'est pas la même chose que consulter un lien
 * ou un PDF. Ils sont séparés des jeux pour la même raison, en plus nette : un
 * visiteur ne doit pas prendre un outil d'argumentation pour une distraction.
 *
 * Règle à tenir : **chaque chiffre affiché par un module porte sa source et son
 * année**, visibles en bas de page. Le site est une cible politique ; un chiffre
 * invérifiable est une munition offerte aux adversaires.
 *
 * Pour ajouter un outil : déposer son dossier ici et ajouter une ligne
 * ci-dessous, en le rattachant à une rubrique. Un dossier absent de cette liste
 * n'est pas servi.
 */

/**
 * Les rubriques regroupent les outils par sujet. Elles existent pour que la
 * page reste lisible quand il y en aura vingt et plus seulement quatre : une
 * liste de vingt cartes ne se lit pas.
 *
 * Une rubrique sans outil n'est pas affichée. On peut donc en déclarer une à
 * l'avance, le jour où l'on commence à travailler sur un nouveau sujet, sans
 * casser la page.
 */
export const RUBRIQUES = [
	{
		id: 'impots-budget',
		titre: 'L’impôt et le budget de l’État',
		description:
			'Ce que l’on verse, qui verse quoi, et ce que la collectivité en fait.'
	},
	{
		id: 'richesses',
		titre: 'Les richesses et la vie quotidienne',
		description:
			'Ce que les gens possèdent, ce qu’il leur reste à la fin du mois, et l’écart entre les deux bouts.'
	},
	{
		id: 'travail-retraite',
		titre: 'Le travail et la retraite',
		description:
			'Ce que le travail rapporte, ce qu’il use, et à quel âge il s’arrête — si l’on est encore en état d’en profiter.'
	},
	{
		id: 'se-loger',
		titre: 'Se loger',
		description:
			'Le premier poste de dépense des ménages, et le premier obstacle. Vu depuis Dijon, avec les prix d’ici.'
	},
	{
		id: 'democratie',
		titre: 'La démocratie',
		description:
			'Ce que vaut une voix, ce qu’on en fait, et ce qu’un autre mode de scrutin y changerait.'
	}
] as const;

export type Rubrique = (typeof RUBRIQUES)[number];
export type RubriqueId = Rubrique['id'];

export const OUTILS = [
	{
		dossier: 'qui-paie',
		rubrique: 'impots-budget',
		titre: 'Qui paie vraiment l’impôt ?',
		description: 'Ce que vous versez vraiment, comparé aux plus grandes fortunes.'
	},
	{
		dossier: 'budget',
		rubrique: 'impots-budget',
		titre: 'Où va l’argent public ?',
		description: 'Les 1 672 milliards, poste par poste — et sur votre contribution.'
	},
	{
		dossier: 'patrimoine',
		rubrique: 'richesses',
		titre: 'Qui possède la France ?',
		description: 'Votre place dans la population, et l’écart réel avec le sommet.'
	},
	{
		dossier: 'fin-du-mois',
		rubrique: 'richesses',
		titre: 'Où passe mon salaire ?',
		description: 'Ce qu’un salaire absorbe avant le premier choix libre.'
	},
	{
		dossier: 'tres-hauts-patrimoines',
		rubrique: 'impots-budget',
		titre: 'Un impôt plancher sur les très hauts patrimoines',
		description: 'Le seuil des 100 millions, et la distance qui vous en sépare.'
	},
	{
		dossier: 'fraude-fiscale',
		rubrique: 'impots-budget',
		titre: 'La fraude fiscale, en chiffres vérifiables',
		description: 'Ce que l’État réclame, ce qu’il encaisse, et ce qui manque.'
	},
	{
		dossier: 'panier',
		rubrique: 'richesses',
		titre: 'Votre salaire a-t-il suivi les prix ?',
		description: 'Cinq ans de hausses, confrontés à votre feuille de paie.'
	},
	{
		dossier: 'remunerations-dirigeants',
		rubrique: 'richesses',
		titre: 'Combien gagne un patron du CAC 40 ?',
		description: '6,5 millions par an, rapportés à ce que vous gagnez.'
	},
	{
		dossier: 'retraite',
		rubrique: 'travail-retraite',
		titre: 'Quand pourrai-je partir à la retraite ?',
		description: 'Votre âge de départ, sous les trois lois qui se superposent.'
	},
	{
		dossier: 'se-loger',
		rubrique: 'se-loger',
		titre: 'Se loger à Dijon : combien d’années de salaire ?',
		description: 'Le prix d’un logement dijonnais, mesuré en années de revenu.'
	},
	{
		dossier: 'proportionnelle',
		rubrique: 'democratie',
		titre: 'Votre voix pèse combien ?',
		description: 'Le prix d’un siège en 2024, et l’Assemblée à la proportionnelle.'
	}
] as const satisfies readonly {
	dossier: string;
	rubrique: RubriqueId;
	titre: string;
	description: string;
}[];

export type Outil = (typeof OUTILS)[number];

export function urlOutil(outil: Outil): string {
	return `/boite-a-outils/${outil.dossier}/`;
}

/**
 * Les rubriques dans leur ordre de déclaration, chacune avec ses outils.
 * Les rubriques vides sont écartées : la page n'affiche jamais un titre suivi
 * de rien.
 */
export function rubriquesGarnies(): { rubrique: Rubrique; modules: Outil[] }[] {
	return RUBRIQUES.map((rubrique) => ({
		rubrique,
		modules: OUTILS.filter((outil) => outil.rubrique === rubrique.id)
	})).filter((groupe) => groupe.modules.length > 0);
}

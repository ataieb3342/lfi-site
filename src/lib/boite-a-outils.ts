/**
 * La boîte à outils : les outils interactifs de vulgarisation.
 *
 * Le visiteur entre son salaire ou son patrimoine, et voit ce que les chiffres
 * publics disent de sa situation. Même mécanique que les jeux
 * (`src/lib/jeux.ts`) : un dossier de `src/lib/boite-a-outils/` avec un
 * `index.html`, un `outil.js` et un `style.css`, en JavaScript simple et sans
 * dépendance, servi tel quel à l'adresse `/boite-a-outils/<dossier>/`.
 *
 * Ils sont listés dans la bibliothèque, en tête, avant les ressources et les
 * jeux : les trois sont des choses qu'on vient chercher pour comprendre, et
 * leur donner trois pages séparées obligeait chacune à renvoyer vers les deux
 * autres par des encarts. `/boite-a-outils` redirige vers cette section.
 *
 * Règle à tenir : **chaque chiffre affiché par un outil porte sa source et son
 * année**, visibles en bas de page. Le site est une cible politique ; un chiffre
 * invérifiable est une munition offerte aux adversaires.
 *
 * Pour ajouter un outil : déposer son dossier ici, ajouter une ligne ci-dessous
 * en le rattachant à une rubrique, puis lancer `npm run outils:pieds` pour
 * regénérer les pieds de page. Un dossier absent de cette liste n'est pas servi.
 */

/**
 * Les rubriques regroupent les outils par sujet.
 *
 * Elles sont volontairement **deux**, et ne doivent pas se multiplier. La
 * première version en comptait cinq pour onze outils : trois d'entre elles
 * n'avaient qu'un seul outil, si bien que la page affichait plus de titres de
 * rubrique que de contenu. Le partage retenu est celui que fait le visiteur
 * lui-même : « est-ce que ça parle de moi, ou du pays ? »
 *
 * Une rubrique sans outil n'est pas affichée.
 */
export const RUBRIQUES = [
	{
		id: 'votre-situation',
		titre: 'Votre situation',
		description:
			'Vous entrez vos chiffres — salaire, loyer, patrimoine — et l’outil vous dit où vous vous situez.'
	},
	{
		id: 'le-pays',
		titre: 'Le pays, et ceux d’en haut',
		description:
			'Ce que la collectivité encaisse et dépense, ce que possèdent les plus riches, ce que pèse une voix.'
	}
] as const;

export type Rubrique = (typeof RUBRIQUES)[number];
export type RubriqueId = Rubrique['id'];

/**
 * `enAvant` désigne les deux outils proposés en premier, sous « Pour
 * commencer ». Onze cartes côte à côte ne disent pas par où entrer ; ces
 * deux-là le disent. Ils sont choisis pour être les plus contre-intuitifs — un
 * sur soi, un sur le pays — et non pour être les plus récents.
 *
 * `accroche` n'est écrite que pour eux : c'est la phrase plus longue de la
 * carte mise en avant.
 */
export const OUTILS = [
	{
		dossier: 'qui-paie',
		rubrique: 'votre-situation',
		titre: 'Qui paie vraiment l’impôt ?',
		description: 'Ce que vous versez vraiment, comparé aux plus grandes fortunes.',
		enAvant: true,
		accroche:
			'On entend souvent que « les riches paient déjà tout ». Entrez votre salaire : vous verrez ce que vous versez réellement, et ce que versent ceux d’en haut.'
	},
	{
		dossier: 'fin-du-mois',
		rubrique: 'votre-situation',
		titre: 'Où passe mon salaire ?',
		description: 'Ce qu’un salaire absorbe avant le premier choix libre.'
	},
	{
		dossier: 'panier',
		rubrique: 'votre-situation',
		titre: 'Votre salaire a-t-il suivi les prix ?',
		description: 'Cinq ans de hausses, confrontés à votre feuille de paie.'
	},
	{
		dossier: 'se-loger',
		rubrique: 'votre-situation',
		titre: 'Se loger à Dijon : combien d’années de salaire ?',
		description: 'Le prix d’un logement dijonnais, mesuré en années de revenu.'
	},
	{
		dossier: 'retraite',
		rubrique: 'votre-situation',
		titre: 'Quand pourrai-je partir à la retraite ?',
		description: 'Votre âge de départ, sous les trois lois qui se superposent.'
	},
	{
		dossier: 'patrimoine',
		rubrique: 'votre-situation',
		titre: 'Qui possède la France ?',
		description: 'Votre place dans la population, et l’écart réel avec le sommet.'
	},
	{
		dossier: 'budget',
		rubrique: 'le-pays',
		titre: 'Où va l’argent public ?',
		description: 'Les 1 672 milliards, poste par poste — et sur votre contribution.',
		enAvant: true,
		accroche:
			'« L’État dépense trop » — mais en quoi, exactement ? Les 1 672 milliards de dépense publique poste par poste, et la part que votre propre contribution finance.'
	},
	{
		dossier: 'tres-hauts-patrimoines',
		rubrique: 'le-pays',
		titre: 'Un impôt plancher sur les très hauts patrimoines',
		description: 'Le seuil des 100 millions, et la distance qui vous en sépare.'
	},
	{
		dossier: 'fraude-fiscale',
		rubrique: 'le-pays',
		titre: 'La fraude fiscale, en chiffres vérifiables',
		description: 'Ce que l’État réclame, ce qu’il encaisse, et ce qui manque.'
	},
	{
		dossier: 'remunerations-dirigeants',
		rubrique: 'le-pays',
		titre: 'Combien gagne un patron du CAC 40 ?',
		description: '6,5 millions par an, rapportés à ce que vous gagnez.'
	},
	{
		dossier: 'proportionnelle',
		rubrique: 'le-pays',
		titre: 'Votre voix pèse combien ?',
		description: 'Le prix d’un siège en 2024, et l’Assemblée à la proportionnelle.'
	}
] as const satisfies readonly {
	dossier: string;
	rubrique: RubriqueId;
	titre: string;
	description: string;
	enAvant?: boolean;
	accroche?: string;
}[];

export type Outil = (typeof OUTILS)[number];

export function urlOutil(outil: { dossier: string }): string {
	return `/boite-a-outils/${outil.dossier}/`;
}

/**
 * Un outil mis en avant. Le type ne retient que les entrées portant
 * `enAvant: true` : si l'une d'elles n'a pas d'accroche, `npm run check`
 * s'arrête sur la carte qui l'affiche, plutôt que de laisser passer un blanc
 * en page d'accueil de la bibliothèque.
 */
export type OutilEnAvant = Extract<Outil, { enAvant: true }>;

/** Les deux outils proposés en premier, dans leur ordre de déclaration. */
export function outilsEnAvant(): OutilEnAvant[] {
	return OUTILS.filter((outil): outil is OutilEnAvant => 'enAvant' in outil && outil.enAvant);
}

/**
 * Les rubriques dans leur ordre de déclaration, chacune avec ses outils.
 *
 * Les outils mis en avant en sont retirés : ils sont déjà affichés juste
 * au-dessus, sous « Pour commencer », et les revoir dix centimètres plus bas se
 * lit comme un bug. Ils restent dans `OUTILS`, donc dans le plan du site et
 * dans les enchaînements de fin d'outil.
 *
 * Les rubriques vides sont écartées : la page n'affiche jamais un titre suivi
 * de rien.
 */
export function rubriquesGarnies(): { rubrique: Rubrique; modules: Outil[] }[] {
	return RUBRIQUES.map((rubrique) => ({
		rubrique,
		modules: OUTILS.filter(
			(outil) => outil.rubrique === rubrique.id && !('enAvant' in outil && outil.enAvant)
		)
	})).filter((groupe) => groupe.modules.length > 0);
}

/**
 * Les deux outils proposés à la fin d'un outil, sous ses sources.
 *
 * On prend les suivants de la même rubrique, en tournant sur la liste : après
 * le dernier, on revient au premier. Quelqu'un qui enchaîne fait donc le tour
 * de sa rubrique sans jamais tomber sur une fin. Si la rubrique est trop
 * courte, on complète avec l'autre — un outil ne doit jamais rester seul.
 *
 * Cette fonction sert au script `scripts/pieds-outils.js`, qui écrit ces liens
 * dans les `index.html` : ces pages sont du HTML statique servi tel quel, elles
 * ne peuvent rien calculer à l'affichage.
 */
export function outilsSuivants(dossier: string, combien = 2): Outil[] {
	const outil = OUTILS.find((o) => o.dossier === dossier);
	if (!outil) return [];

	const memeRubrique = OUTILS.filter((o) => o.rubrique === outil.rubrique);
	const depart = memeRubrique.findIndex((o) => o.dossier === dossier);

	const suite = memeRubrique
		.slice(depart + 1)
		.concat(memeRubrique.slice(0, depart))
		.concat(OUTILS.filter((o) => o.rubrique !== outil.rubrique));

	return suite.slice(0, combien);
}

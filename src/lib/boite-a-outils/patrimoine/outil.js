// @ts-nocheck
/*
 * « Qui possède la France ? »
 *
 * Tout est calculé dans le navigateur : le patrimoine saisi n'est envoyé nulle
 * part et n'est conservé nulle part.
 *
 * Deux difficultés techniques, traitées ici, qui reviendront dans tout module
 * parlant de patrimoine :
 *
 * 1. Un curseur linéaire est inutilisable : entre 0 et un milliard d'euros,
 *    toute la population française tiendrait dans son premier millimètre. Le
 *    curseur avance donc par paliers multiplicatifs (échelle logarithmique).
 * 2. L'Insee publie des seuils, pas la distribution complète. La position du
 *    visiteur est interpolée entre ces seuils — l'ordre de grandeur est juste,
 *    le pourcent exact ne l'est pas, et la page le dit.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Seuils de patrimoine brut des ménages en 2024 (Insee Focus n° 371).
// Lecture : 10 % des ménages possèdent moins de 6 200 €, 50 % moins de 205 100 €.
var SEUILS = [
	{ centile: 0, montant: 0 },
	{ centile: 10, montant: 6200 },
	{ centile: 50, montant: 205100 },
	{ centile: 90, montant: 857700 },
	{ centile: 95, montant: 1268200 },
	{ centile: 99, montant: 3020900 }
];

var MEDIANE = 205100;

// Part du patrimoine brut total détenue par chaque groupe (Insee, 2024).
var CONCENTRATION = [
	{
		titre: 'Les 10 % les mieux dotés',
		part: 0.48,
		detail: 'À eux seuls, près de la moitié de tout le patrimoine des ménages français.'
	},
	{
		titre: 'Dont le 1 % le mieux doté',
		part: 0.15,
		detail: 'Un ménage sur cent possède un septième du patrimoine du pays.'
	},
	{
		titre: 'La moitié la moins dotée',
		part: 0.07,
		detail: 'Trente-trois millions de personnes se partagent 7 % du total.'
	}
];

// Classement des fortunes professionnelles françaises 2026 (Challenges),
// en milliards d'euros.
var FORTUNES = [
	{ titre: 'Famille Arnault (LVMH)', milliards: 121 },
	{ titre: 'Héritiers Hermès', milliards: 114 },
	{ titre: 'Xavier Niel (Free)', milliards: 30.1 },
	{ titre: 'Famille Dassault', milliards: 27.7 },
	{ titre: 'Famille Mulliez (Auchan, Decathlon)', milliards: 27 },
	{ titre: 'François Pinault (Kering)', milliards: 19.2 },
	{ titre: 'Emmanuel Besnier (Lactalis)', milliards: 14.2 }
];

var PREMIERE_FORTUNE = FORTUNES[0].milliards * 1e9;

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

var nombres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Une distance en centimètres, dite dans l'unité qui se visualise le mieux. */
function distance(centimetres) {
	if (centimetres < 100) return nombres.format(centimetres) + ' cm';
	if (centimetres < 100000) return nombres.format(centimetres / 100) + ' m';

	var km = centimetres / 100000;
	if (km < 10000) return nombres.format(km) + ' km';
	if (km < 1000000) return nombres.format(km / 40075) + ' fois le tour de la Terre';
	return nombres.format(km / 384400) + ' fois la distance Terre-Lune';
}

/* --- Le curseur, en paliers multiplicatifs ------------------------------ */

function montantDepuisCurseur(position) {
	var brut = (Math.pow(10, position / 10) - 1) * 1000;
	if (brut < 1000) return Math.round(brut / 100) * 100;
	if (brut < 100000) return Math.round(brut / 1000) * 1000;
	return Math.round(brut / 10000) * 10000;
}

function curseurDepuisMontant(montant) {
	return 10 * Math.log10(montant / 1000 + 1);
}

/* --- Position dans la population ---------------------------------------- */

/**
 * À quel pourcentage de la population ce patrimoine est-il supérieur ?
 * Interpolation entre les seuils publiés : linéaire sous le premier décile
 * (où les montants sont proches de zéro), multiplicative au-dessus.
 */
function centileDe(montant) {
	if (montant <= 0) return 0;
	if (montant >= SEUILS[SEUILS.length - 1].montant) return 99;

	for (var i = 1; i < SEUILS.length; i++) {
		var haut = SEUILS[i];
		if (montant > haut.montant) continue;

		var bas = SEUILS[i - 1];
		var avancement;

		if (bas.montant <= 0) {
			avancement = montant / haut.montant;
		} else {
			avancement =
				(Math.log(montant) - Math.log(bas.montant)) /
				(Math.log(haut.montant) - Math.log(bas.montant));
		}

		return bas.centile + avancement * (haut.centile - bas.centile);
	}

	return 99;
}

/* --- Affichage ---------------------------------------------------------- */

function barre(titre, valeur, part, detail) {
	var li = document.createElement('li');

	var entete = document.createElement('div');
	entete.className = 'barre-entete';

	var nom = document.createElement('span');
	nom.className = 'titre';
	nom.textContent = titre;

	var chiffre = document.createElement('span');
	chiffre.className = 'valeur';
	chiffre.textContent = valeur;

	entete.appendChild(nom);
	entete.appendChild(chiffre);

	var piste = document.createElement('div');
	piste.className = 'barre-piste';

	var remplissage = document.createElement('div');
	remplissage.className = 'barre-remplissage';
	remplissage.style.width = Math.min(100, Math.max(0.5, part * 100)) + '%';
	piste.appendChild(remplissage);

	li.appendChild(entete);
	li.appendChild(piste);

	if (detail) {
		var texte = document.createElement('p');
		texte.className = 'barre-detail';
		texte.textContent = detail;
		li.appendChild(texte);
	}

	return li;
}

var champCurseur = document.getElementById('patrimoine');
var champNombre = document.getElementById('patrimoine-nombre');
var position = document.getElementById('position');
var positionPhrase = document.getElementById('position-phrase');
var listeEchelle = document.getElementById('echelle');

function rafraichir(montant) {
	var centile = centileDe(montant);

	if (montant <= 0) {
		position.textContent = 'Rien';
		positionPhrase.textContent =
			'Un ménage sur dix possède moins de 6 200 €. Ne rien posséder n’est pas une situation marginale en France.';
	} else if (centile >= 99) {
		position.textContent = 'Le 1 % le plus riche';
		positionPhrase.textContent =
			'Vous dépassez le seuil de ' +
			euros.format(3020900) +
			', à partir duquel commence le centile supérieur des ménages français.';
	} else {
		position.textContent = 'Devant ' + Math.round(centile) + ' % des ménages';
		positionPhrase.textContent =
			'Avec ' +
			euros.format(montant) +
			', vous vous situez au-dessus de ' +
			Math.round(centile) +
			' % des ménages français, et en dessous de ' +
			Math.round(100 - centile) +
			' %. Le patrimoine médian est de ' +
			euros.format(MEDIANE) +
			'.';
	}

	/* L'échelle : le patrimoine du visiteur vaut un centimètre. */
	listeEchelle.textContent = '';

	if (montant <= 0) {
		var vide = document.createElement('p');
		vide.className = 'barre-detail';
		vide.textContent =
			'Avec un patrimoine nul, il n’y a pas de rapport à calculer : l’écart est infini. Faites glisser le curseur pour voir l’échelle apparaître.';
		listeEchelle.appendChild(vide);
		return;
	}

	var reperes = [
		{ titre: 'Vous', montant: montant, detail: 'Notre point de départ : un centimètre.' },
		{
			titre: 'Le patrimoine médian',
			montant: MEDIANE,
			detail: 'La moitié des ménages français possède moins que cela.'
		},
		{
			titre: 'Le seuil des 10 % les plus riches',
			montant: 857700,
			detail: 'Au-dessus, on appartient au dixième le mieux doté du pays.'
		},
		{
			titre: 'Le seuil du 1 % le plus riche',
			montant: 3020900,
			detail: 'Environ 300 000 ménages sont au-dessus.'
		},
		{
			titre: 'La première fortune de France',
			montant: PREMIERE_FORTUNE,
			detail:
				'C’est ici que l’intuition lâche. Cette distance ne tient sur aucun graphique : elle se marche.'
		}
	];

	/*
	 * Les barres sont en échelle logarithmique, et la page le dit : chaque
	 * tiers de largeur vaut environ mille fois plus. En échelle ordinaire, les
	 * quatre premières barres seraient rigoureusement invisibles face à la
	 * dernière — c'est d'ailleurs le propos du module, mais un graphique où
	 * l'on ne voit rien n'apprend rien.
	 */
	var minimum = Math.min(montant, MEDIANE);
	var maximum = Math.max(montant, PREMIERE_FORTUNE);
	var etendue = Math.log10(maximum) - Math.log10(minimum);

	for (var i = 0; i < reperes.length; i++) {
		var repere = reperes[i];
		var part =
			etendue > 0 ? (Math.log10(repere.montant) - Math.log10(minimum)) / etendue : 1;

		listeEchelle.appendChild(
			barre(
				repere.titre,
				distance(repere.montant / montant),
				Math.max(0.04, part),
				repere.detail
			)
		);
	}
}

function depuisCurseur() {
	var montant = montantDepuisCurseur(Number(champCurseur.value));
	champNombre.value = String(montant);
	rafraichir(montant);
}

function depuisNombre() {
	var montant = Number(champNombre.value);
	if (!isFinite(montant) || montant < 0) return;
	champCurseur.value = String(
		Math.min(Number(champCurseur.max), Math.max(0, curseurDepuisMontant(montant)))
	);
	rafraichir(montant);
}

champCurseur.addEventListener('input', depuisCurseur);
champNombre.addEventListener('input', depuisNombre);

/* --- Les parties qui ne dépendent d'aucune saisie ----------------------- */

var listeConcentration = document.getElementById('concentration');
for (var i = 0; i < CONCENTRATION.length; i++) {
	var groupe = CONCENTRATION[i];
	listeConcentration.appendChild(
		barre(groupe.titre, Math.round(groupe.part * 100) + ' %', groupe.part, groupe.detail)
	);
}

var listeFortunes = document.getElementById('fortunes');
for (var j = 0; j < FORTUNES.length; j++) {
	var fortune = FORTUNES[j];
	listeFortunes.appendChild(
		barre(
			fortune.titre,
			nombres.format(fortune.milliards) + ' Md€',
			fortune.milliards / FORTUNES[0].milliards,
			null
		)
	);
}

/* Au démarrage, on part du patrimoine médian : c'est le repère le plus utile. */
champCurseur.value = String(curseurDepuisMontant(MEDIANE));
depuisCurseur();

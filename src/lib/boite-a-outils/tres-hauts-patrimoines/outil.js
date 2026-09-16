// @ts-nocheck
/*
 * « Un impôt plancher sur les très hauts patrimoines »
 *
 * Tout est calculé dans le navigateur : le patrimoine saisi n'est envoyé nulle
 * part et n'est conservé nulle part.
 *
 * Cet outil porte sur une mesure contestée, dont le rendement ne fait pas
 * consensus. Il affiche donc une FOURCHETTE partout où il serait tentant
 * d'afficher un chiffre. C'est moins frappant, et c'est la seule façon de ne
 * pas offrir une prise.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Le dispositif tel que discuté au Parlement à l'automne 2025.
var SEUIL = 100000000;
var TAUX_PLANCHER = 0.02;
var FOYERS_CONCERNES = 1800;

// Fourchette des rendements annuels estimés, en milliards d'euros. L'écart tient
// aux hypothèses sur l'optimisation et l'expatriation, pas à l'arithmétique.
var RENDEMENT_BAS = 5;
var RENDEMENT_HAUT = 25;

// SMIC net mensuel depuis le 1er juin 2026.
var SMIC_NET = 1477.93;

/*
 * Quelques postes de dépense publique, en milliards d'euros (Insee, dépenses de
 * 2024), pour donner une échelle au rendement. Ce sont les mêmes chiffres que
 * ceux du module « Où va l'argent public ? » — une seule source, un seul jeu de
 * nombres à tenir à jour.
 */
var POSTES = [
	{ titre: 'Environnement', milliards: 30 },
	{ titre: 'Logement et équipements collectifs', milliards: 42 },
	{ titre: 'Sécurité et justice', milliards: 52 },
	{ titre: 'Défense', milliards: 54 },
	{ titre: 'Enseignement', milliards: 149 }
];

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

var nombres = new Intl.NumberFormat('fr-FR');

function pourcent(part) {
	return (part * 100).toFixed(1).replace('.', ',') + ' %';
}

function milliards(valeur) {
	return nombres.format(valeur) + ' Md€';
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
	remplissage.style.width = Math.min(100, Math.max(0, part * 100)) + '%';
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

function boite(etiquette, valeur) {
	var div = document.createElement('div');
	div.className = 'chiffre-boite';

	var titre = document.createElement('span');
	titre.className = 'etiquette';
	titre.textContent = etiquette;

	var chiffre = document.createElement('span');
	chiffre.className = 'valeur';
	chiffre.textContent = valeur;

	div.appendChild(titre);
	div.appendChild(chiffre);
	return div;
}

var champPatrimoine = document.getElementById('patrimoine');
var champPatrimoineNombre = document.getElementById('patrimoine-nombre');

var concerne = document.getElementById('concerne');
var concernePhrase = document.getElementById('concerne-phrase');
var echelle = document.getElementById('echelle');
var echellePhrase = document.getElementById('echelle-phrase');
var listeRendement = document.getElementById('rendement');

function rafraichir() {
	/*
	 * On lit la case et non le curseur : le curseur s'arrête à deux millions
	 * d'euros, sinon il serait inutilisable dans la zone où vivent les gens. La
	 * case, elle, accepte n'importe quel montant — y compris les cent millions
	 * du seuil, que l'on peut ainsi taper pour voir ce que répond la page.
	 */
	var patrimoine = Number(champPatrimoineNombre.value);
	if (!isFinite(patrimoine) || patrimoine < 0) patrimoine = 0;

	/* Concerné, ou pas. */
	if (patrimoine >= SEUIL) {
		concerne.textContent = 'Oui';
		concernePhrase.textContent =
			'Votre patrimoine dépasse le seuil de 100 millions d’euros. Vous seriez redevable d’au moins ' +
			euros.format(patrimoine * TAUX_PLANCHER) +
			' par an — sauf si vous acquittez déjà davantage, auquel cas cette mesure ne change rien pour vous.';
	} else {
		var facteur = patrimoine > 0 ? SEUIL / patrimoine : 0;

		concerne.textContent = 'Non';
		concernePhrase.textContent =
			patrimoine > 0
				? 'Il faudrait multiplier votre patrimoine par ' +
					nombres.format(Math.round(facteur)) +
					' pour atteindre le seuil. Vous faites partie des 99,99 % de contribuables que cette mesure ne concerne pas — ce qui n’empêche pas d’avoir un avis, mais change la nature de l’avis.'
				: 'Comme 99,99 % des contribuables. Le seuil est fixé à 100 millions d’euros de patrimoine net.';
	}

	/* L'échelle du seuil. */
	var anneesSmic = SEUIL / (SMIC_NET * 12);
	var partDuSeuil = patrimoine / SEUIL;

	echelle.textContent = '';
	echelle.appendChild(boite('Le seuil', '100 000 000 €'));
	echelle.appendChild(boite('Votre patrimoine', euros.format(patrimoine)));
	echelle.appendChild(
		boite(
			'Votre part du seuil',
			partDuSeuil >= 0.001 ? pourcent(partDuSeuil) : 'moins de 0,1 %'
		)
	);
	echelle.appendChild(
		boite('Années de SMIC pour l’atteindre', nombres.format(Math.round(anneesSmic)))
	);

	echellePhrase.textContent =
		'Atteindre 100 millions d’euros au SMIC net, en épargnant l’intégralité de son salaire et sans jamais rien dépenser, demanderait ' +
		nombres.format(Math.round(anneesSmic)) +
		' années de travail — soit environ ' +
		nombres.format(Math.round(anneesSmic / 40)) +
		' carrières complètes mises bout à bout. Ce calcul n’a évidemment aucun sens pratique : c’est précisément ce qu’il sert à montrer. À ce niveau, un patrimoine ne vient pas du salaire.';

	/* Ce que représenterait le rendement, aux deux bouts de la fourchette. */
	listeRendement.textContent = '';

	POSTES.forEach(function (poste) {
		listeRendement.appendChild(
			barre(
				poste.titre,
				'de ' +
					pourcent(RENDEMENT_BAS / poste.milliards) +
					' à ' +
					pourcent(RENDEMENT_HAUT / poste.milliards),
				Math.min(1, RENDEMENT_HAUT / poste.milliards),
				'La dépense publique annuelle de ce poste est de ' +
					milliards(poste.milliards) +
					'. La barre montre ce que représenterait l’estimation haute ; le texte donne les deux bornes.'
			)
		);
	});
}

/* Le curseur et la case restent synchronisés dans les deux sens. */
function relier(curseur, nombre) {
	curseur.addEventListener('input', function () {
		nombre.value = curseur.value;
		rafraichir();
	});

	nombre.addEventListener('input', function () {
		var valeur = Number(nombre.value);
		if (!isFinite(valeur) || valeur < 0) return;
		curseur.value = String(
			Math.min(Number(curseur.max), Math.max(Number(curseur.min), valeur))
		);
		rafraichir();
	});
}

relier(champPatrimoine, champPatrimoineNombre);

rafraichir();

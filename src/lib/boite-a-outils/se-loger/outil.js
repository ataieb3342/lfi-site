// @ts-nocheck
/*
 * « Se loger à Dijon : combien d'années de salaire ? »
 *
 * Tout est calculé dans le navigateur : ni le revenu ni la surface saisis ne
 * sont envoyés au serveur.
 *
 * Cet outil est volontairement local. Un prix moyen national ne dit rien à
 * personne ; le prix du mètre carré dans la ville où l'on vit, si. C'est aussi
 * ce qu'un groupe de Dijon peut faire et qu'un site national ne fera pas.
 *
 * Les chiffres vieillissent — le prix du mètre carré surtout. Ils sont
 * regroupés ci-dessous ; si vous les changez, changez aussi les sources dans
 * index.html.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Prix moyen d'un appartement à Dijon, en euros par mètre carré, 2026.
// Arrondi volontairement à la cinquantaine : la dispersion entre quartiers est
// telle qu'afficher « 2 652 € » laisserait croire à une précision qui n'existe
// pas.
var PRIX_M2 = 2650;

// Loyer médian des appartements à Dijon, en euros par mètre carré et par mois,
// hors charges. Observatoire des loyers de la DHUP, campagne 2025.
var LOYER_M2 = 13.34;

// Insee, 2024 : le logement absorbe en moyenne 22,8 % du revenu disponible
// brut des ménages.
var EFFORT_MOYEN = 0.228;

/*
 * Rapport prix des logements / revenu par ménage : il a presque doublé entre
 * 2000 et aujourd'hui (série IGEDD, travaux de Jacques Friggit).
 *
 * « Presque doublé » couvre une fourchette de 1,8 à 2. On retient 1,8, le bas
 * de la fourchette : le chiffre le moins spectaculaire est celui qu'on ne peut
 * pas nous reprocher.
 */
var FACTEUR_2000 = 1.8;

// Haut Conseil de stabilité financière : taux d'effort maximal et durée
// maximale d'un crédit immobilier.
var EFFORT_MAXIMAL = 0.35;
var DUREE_MAXIMALE_MOIS = 25 * 12;

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

function pourcent(part) {
	return (part * 100).toFixed(1).replace('.', ',') + ' %';
}

function annees(valeur) {
	return valeur.toFixed(1).replace('.', ',') + (valeur >= 2 ? ' ans' : ' an');
}

function metres(valeur) {
	return Math.round(valeur) + ' m²';
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

var champRevenu = document.getElementById('revenu');
var champRevenuNombre = document.getElementById('revenu-nombre');
var champSurface = document.getElementById('surface');
var champSurfaceNombre = document.getElementById('surface-nombre');

var anneesChiffre = document.getElementById('annees');
var anneesPhrase = document.getElementById('annees-phrase');
var listeComparaison = document.getElementById('comparaison');
var comparaisonPhrase = document.getElementById('comparaison-phrase');
var loyerChiffre = document.getElementById('loyer');
var loyerPhrase = document.getElementById('loyer-phrase');
var louerDetails = document.getElementById('louer-details');
var empruntChiffre = document.getElementById('emprunt');
var empruntPhrase = document.getElementById('emprunt-phrase');

function rafraichir() {
	var revenu = Number(champRevenu.value);
	var surface = Number(champSurface.value);

	var revenuAnnuel = revenu * 12;
	var prix = surface * PRIX_M2;
	var loyer = surface * LOYER_M2;

	var anneesAujourdhui = prix / revenuAnnuel;
	var anneesEn2000 = anneesAujourdhui / FACTEUR_2000;

	/* Le prix d'achat, en années de revenu. */
	anneesChiffre.textContent = annees(anneesAujourdhui);
	anneesPhrase.textContent =
		'de revenus, en entier, sans rien dépenser d’autre. Un ' +
		metres(surface) +
		' à Dijon vaut environ ' +
		euros.format(prix) +
		', pour un foyer qui gagne ' +
		euros.format(revenu) +
		' par mois.';

	/* La comparaison avec 2000. */
	listeComparaison.textContent = '';
	var maximum = Math.max(anneesAujourdhui, anneesEn2000, 1);

	listeComparaison.appendChild(
		barre(
			'En 2000',
			annees(anneesEn2000),
			anneesEn2000 / maximum,
			'Le même logement, rapporté à un revenu équivalent de l’époque.'
		)
	);
	listeComparaison.appendChild(
		barre(
			'Aujourd’hui',
			annees(anneesAujourdhui),
			anneesAujourdhui / maximum,
			'Le même logement, rapporté à votre revenu.'
		)
	);

	comparaisonPhrase.textContent =
		'Il faut donc ' +
		annees(anneesAujourdhui - anneesEn2000) +
		' de revenus de plus qu’en 2000 pour le même logement — le même nombre de mètres carrés, la même ville. Ce ne sont pas les logements qui ont changé, ce sont les prix. Une génération a acheté au premier chiffre, la suivante achète au second.';

	/* La location. */
	var effort = revenu > 0 ? loyer / revenu : 0;

	loyerChiffre.textContent = euros.format(loyer) + ' / mois';

	if (effort > 0.4) {
		loyerPhrase.textContent =
			'soit ' +
			pourcent(effort) +
			' de vos revenus, contre 22,8 % en moyenne nationale. Au-delà de 40 %, le logement ne laisse plus de marge à rien d’autre : c’est le seuil à partir duquel une facture imprévue devient un découvert.';
	} else if (effort > EFFORT_MOYEN) {
		loyerPhrase.textContent =
			'soit ' +
			pourcent(effort) +
			' de vos revenus, c’est-à-dire davantage que la moyenne nationale de 22,8 %.';
	} else {
		loyerPhrase.textContent =
			'soit ' +
			pourcent(effort) +
			' de vos revenus, c’est-à-dire moins que la moyenne nationale de 22,8 %. Charges et énergie ne sont pas comprises.';
	}

	louerDetails.textContent = '';
	louerDetails.appendChild(boite('Loyer au mètre carré', '13,34 €'));
	louerDetails.appendChild(boite('Votre taux d’effort', pourcent(effort)));
	louerDetails.appendChild(boite('Moyenne nationale', '22,8 %'));
	louerDetails.appendChild(
		boite('Reste après le loyer', euros.format(Math.max(0, revenu - loyer)))
	);

	/* La capacité d'emprunt, volontairement surestimée. */
	var mensualite = revenu * EFFORT_MAXIMAL;
	var capacite = mensualite * DUREE_MAXIMALE_MOIS;
	var surfaceAccessible = capacite / PRIX_M2;

	empruntChiffre.textContent = euros.format(capacite);
	empruntPhrase.textContent =
		'au maximum, soit ' +
		euros.format(mensualite) +
		' par mois pendant 25 ans — et encore, sans un euro d’intérêts. Cela représente ' +
		metres(surfaceAccessible) +
		' à Dijon. Avec les intérêts d’un vrai crédit, comptez nettement moins : ce chiffre est un plafond théorique, pas une promesse.';
}

/* Les curseurs et les cases restent synchronisés dans les deux sens. */
function relier(curseur, nombre) {
	curseur.addEventListener('input', function () {
		nombre.value = curseur.value;
		rafraichir();
	});

	nombre.addEventListener('input', function () {
		var valeur = Number(nombre.value);
		if (!isFinite(valeur) || valeur <= 0) return;
		curseur.value = String(
			Math.min(Number(curseur.max), Math.max(Number(curseur.min), valeur))
		);
		rafraichir();
	});
}

relier(champRevenu, champRevenuNombre);
relier(champSurface, champSurfaceNombre);

rafraichir();

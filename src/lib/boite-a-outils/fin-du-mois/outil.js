// @ts-nocheck
/*
 * « Où passe mon salaire ? »
 *
 * Tout est calculé dans le navigateur : ni le revenu ni le loyer saisis ne sont
 * envoyés au serveur.
 *
 * Le module ne prétend pas remplacer un budget réel. Il applique au revenu saisi
 * les proportions moyennes mesurées par l'Insee, pour rendre visible une chose
 * simple : une grande partie du salaire est engagée avant le premier arbitrage.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Insee, 2024 : les dépenses pré-engagées pèsent 30,3 % du revenu disponible
// brut des ménages, dont 22,8 points pour le logement seul.
var PART_PRE_ENGAGEE = 0.303;
var PART_LOGEMENT = 0.228;

// Ce qui reste des dépenses pré-engagées une fois le logement mis à part :
// assurances, services financiers, téléphone, internet, télévision, cantine.
var PART_AUTRES_ENGAGEES = PART_PRE_ENGAGEE - PART_LOGEMENT;

// SMIC mensuel net depuis le 1er juin 2026, et la cible discutée dans le débat public.
var SMIC_NET = 1477.93;
var SMIC_CIBLE = 1600;

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

var eurosPrecis = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

function pourcent(part) {
	return (part * 100).toFixed(1).replace('.', ',') + ' %';
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

var champRevenu = document.getElementById('revenu');
var champRevenuNombre = document.getElementById('revenu-nombre');
var champLogement = document.getElementById('logement');
var champLogementNombre = document.getElementById('logement-nombre');

var reste = document.getElementById('reste');
var restePhrase = document.getElementById('reste-phrase');
var listeRepartition = document.getElementById('repartition');
var effort = document.getElementById('effort');
var effortPhrase = document.getElementById('effort-phrase');
var listeMesures = document.getElementById('mesures');
var mesuresPhrase = document.getElementById('mesures-phrase');

/** Ce qui reste une fois le logement et les autres contrats payés. */
function resteAVivre(revenu, logement) {
	return revenu - logement - revenu * PART_AUTRES_ENGAGEES;
}

function rafraichir() {
	var revenu = Number(champRevenu.value);
	var logement = Number(champLogement.value);

	var autres = revenu * PART_AUTRES_ENGAGEES;
	var libre = resteAVivre(revenu, logement);
	var tauxEffort = revenu > 0 ? logement / revenu : 0;

	/* Le reste à vivre. */
	if (libre <= 0) {
		reste.textContent = 'Rien';
		restePhrase.textContent =
			'À ce niveau de loyer, le revenu est intégralement absorbé avant la première course. Ce n’est pas une situation théorique : c’est le quotidien d’une partie des ménages.';
	} else {
		reste.textContent = euros.format(libre);
		restePhrase.textContent =
			'par mois pour tout le reste : manger, se déplacer, se soigner, s’habiller, sortir. Soit ' +
			euros.format(libre / 30) +
			' par jour, et ' +
			pourcent(libre / revenu) +
			' de vos revenus.';
	}

	/* La répartition. */
	listeRepartition.textContent = '';
	listeRepartition.appendChild(
		barre(
			'Logement',
			euros.format(logement),
			revenu > 0 ? logement / revenu : 0,
			'Loyer ou remboursement de crédit, charges et énergie. En moyenne en France, ce poste absorbe 22,8 % du revenu des ménages.'
		)
	);
	listeRepartition.appendChild(
		barre(
			'Autres dépenses engagées',
			euros.format(autres),
			PART_AUTRES_ENGAGEES,
			'Assurances, banque, téléphone, internet, cantine. Estimées ici à ' +
				pourcent(PART_AUTRES_ENGAGEES) +
				' du revenu, la moyenne observée par l’Insee.'
		)
	);
	listeRepartition.appendChild(
		barre(
			'Reste à vivre',
			euros.format(Math.max(0, libre)),
			revenu > 0 ? Math.max(0, libre) / revenu : 0,
			'Tout le reste, y compris la nourriture et les transports — et c’est là, et seulement là, que « mieux gérer son budget » a un sens.'
		)
	);

	/* Le taux d'effort logement. */
	effort.textContent = pourcent(tauxEffort);
	if (tauxEffort > 0.4) {
		effortPhrase.textContent =
			'de vos revenus partent dans le logement, contre 22,8 % en moyenne nationale. Au-delà de 40 %, le logement ne laisse plus de marge à rien d’autre.';
	} else if (tauxEffort > 0.228) {
		effortPhrase.textContent =
			'de vos revenus partent dans le logement, soit davantage que la moyenne nationale de 22,8 %.';
	} else {
		effortPhrase.textContent =
			'de vos revenus partent dans le logement, soit moins que la moyenne nationale de 22,8 %.';
	}

	/* L'effet d'une hausse du SMIC, calculé sur ce foyer. */
	listeMesures.textContent = '';

	var libreSmic = resteAVivre(SMIC_NET, logement);
	var libreCible = resteAVivre(SMIC_CIBLE, logement);
	var maximum = Math.max(libreSmic, libreCible, 1);

	listeMesures.appendChild(
		barre(
			'Au SMIC actuel (1 477,93 € net)',
			euros.format(Math.max(0, libreSmic)) + ' / mois',
			Math.max(0, libreSmic) / maximum,
			'Reste à vivre d’un foyer au SMIC, avec votre loyer.'
		)
	);
	listeMesures.appendChild(
		barre(
			'Avec un SMIC à 1 600 € net',
			euros.format(Math.max(0, libreCible)) + ' / mois',
			Math.max(0, libreCible) / maximum,
			'Le même foyer, avec le même loyer.'
		)
	);

	var gain = SMIC_CIBLE - SMIC_NET;
	var progression = libreSmic > 0 ? (libreCible - libreSmic) / libreSmic : 0;

	mesuresPhrase.textContent =
		'Soit ' +
		eurosPrecis.format(gain) +
		' de plus par mois, ' +
		euros.format(gain * 12) +
		' sur l’année. Avec votre loyer, cela représente ' +
		(progression > 0 ? '+' + Math.round(progression * 100) + ' %' : 'une hausse') +
		' de reste à vivre — parce que le loyer, lui, ne bouge pas : tout l’écart va au reste à vivre.';
}

/* Les curseurs et les cases restent synchronisés dans les deux sens. */
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

relier(champRevenu, champRevenuNombre);
relier(champLogement, champLogementNombre);

rafraichir();

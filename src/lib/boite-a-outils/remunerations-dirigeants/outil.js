// @ts-nocheck
/*
 * « Combien gagne un patron du CAC 40 ? »
 *
 * Tout est calculé dans le navigateur : le salaire saisi n'est envoyé nulle
 * part.
 *
 * Aucun rapport n'est recopié d'une publication : ils sont tous recalculés à
 * partir des deux seuls montants cités en sources, et l'avertissement de la page
 * explique pourquoi. Les écarts que l'on lit ailleurs (« 1 à 423 », « 1 à
 * 300 ») tiennent au choix du SMIC brut ou net, de l'année de référence, ou du
 * salaire médian plutôt que du SMIC — trois conventions défendables, qui donnent
 * trois nombres différents. Mieux vaut un rapport que le lecteur peut refaire
 * qu'un rapport impressionnant qu'il doit croire.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Proxinvest, étude publiée en novembre 2025, portant sur l'exercice 2024.
var REMUNERATION_MOYENNE = 6500000;
var REMUNERATION_MEDIANE = 5600000;

// Évolution sur dix ans, même étude.
var HAUSSE_DIRIGEANTS = 0.9;
var HAUSSE_SALARIES = 0.23;

// SMIC net mensuel depuis le 1er juin 2026.
var SMIC_NET = 1477.93;

// Nombre de secondes dans une année moyenne (365,25 jours).
var SECONDES_PAR_AN = 365.25 * 24 * 3600;

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

var nombres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function pourcent(part) {
	return Math.round(part * 100) + ' %';
}

/*
 * Une durée en secondes, dite dans l'unité qui parle.
 *
 * En français le pluriel ne commence qu'à deux : on écrit « 1,5 jour » et non
 * « 1,5 jours ». C'est exactement la valeur qu'affiche cette page pour un
 * salaire courant, donc la faute se verrait tout de suite.
 */
function accord(valeur, singulier, pluriel) {
	return valeur.toFixed(1).replace('.', ',') + (valeur >= 2 ? pluriel : singulier);
}

function dureeEnTexte(secondes) {
	if (secondes < 60) {
		var s = Math.max(1, Math.round(secondes));
		return s + (s >= 2 ? ' secondes' : ' seconde');
	}
	if (secondes < 3600) {
		var m = Math.round(secondes / 60);
		return m + (m >= 2 ? ' minutes' : ' minute');
	}
	if (secondes < 24 * 3600) {
		return accord(secondes / 3600, ' heure', ' heures');
	}
	var jours = secondes / (24 * 3600);
	if (jours < 31) {
		return accord(jours, ' jour', ' jours');
	}
	return Math.round(jours / 30.44) + ' mois';
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

var champSalaire = document.getElementById('salaire');
var champSalaireNombre = document.getElementById('salaire-nombre');

var rattrapage = document.getElementById('rattrapage');
var rattrapagePhrase = document.getElementById('rattrapage-phrase');
var compteur = document.getElementById('compteur');
var listeEchelle = document.getElementById('echelle');
var listeDixAns = document.getElementById('dix-ans');

var ouvertureDeLaPage = Date.now();

function salaireAnnuel() {
	return Number(champSalaire.value) * 12;
}

function rafraichir() {
	var mensuel = Number(champSalaire.value);
	var annuel = salaireAnnuel();

	/* Le temps qu'il lui faut pour gagner votre année. */
	var secondes = (annuel / REMUNERATION_MOYENNE) * SECONDES_PAR_AN;

	rattrapage.textContent = dureeEnTexte(secondes);
	rattrapagePhrase.textContent =
		'Vous gagnez ' +
		euros.format(annuel) +
		' en une année de travail. Un dirigeant du CAC 40 gagne la même somme en ' +
		dureeEnTexte(secondes) +
		'. Dit dans l’autre sens : il vous faudrait ' +
		nombres.format(REMUNERATION_MOYENNE / annuel) +
		' années pour gagner ce qu’il gagne en une.';

	/* L'échelle des rémunérations. */
	listeEchelle.textContent = '';

	listeEchelle.appendChild(
		barre(
			'Dirigeant du CAC 40 (moyenne 2024)',
			euros.format(REMUNERATION_MOYENNE),
			1,
			'Fixe, part variable et actions attribuées, au titre de la fonction. Hors dividendes et revenus du patrimoine.'
		)
	);
	listeEchelle.appendChild(
		barre(
			'Dirigeant du CAC 40 (médiane 2024)',
			euros.format(REMUNERATION_MEDIANE),
			REMUNERATION_MEDIANE / REMUNERATION_MOYENNE,
			'La moitié des dirigeants sont au-dessus, la moitié en dessous. C’est le plus haut niveau jamais atteint.'
		)
	);
	listeEchelle.appendChild(
		barre(
			'Votre salaire annuel',
			euros.format(annuel),
			annuel / REMUNERATION_MOYENNE,
			'Soit ' +
				nombres.format(REMUNERATION_MOYENNE / annuel) +
				' fois moins. La barre est trop fine pour être visible : c’est le sujet de la page.'
		)
	);
	listeEchelle.appendChild(
		barre(
			'Un salarié au SMIC',
			euros.format(SMIC_NET * 12),
			(SMIC_NET * 12) / REMUNERATION_MOYENNE,
			'Le SMIC net annuel, soit ' +
				nombres.format(REMUNERATION_MOYENNE / (SMIC_NET * 12)) +
				' fois moins que la rémunération moyenne d’un dirigeant du CAC 40. Ce rapport est calculé sur le SMIC net en vigueur ; vous pouvez refaire la division.'
		)
	);

	/* Dix ans d'évolution. */
	listeDixAns.textContent = '';

	listeDixAns.appendChild(
		barre(
			'Rémunération des dirigeants',
			'+ ' + pourcent(HAUSSE_DIRIGEANTS),
			1,
			'Sur les dix dernières années.'
		)
	);
	listeDixAns.appendChild(
		barre(
			'Salaires de leurs salariés',
			'+ ' + pourcent(HAUSSE_SALARIES),
			HAUSSE_SALARIES / HAUSSE_DIRIGEANTS,
			'Sur la même période, dans les mêmes entreprises. Soit une hausse ' +
				(HAUSSE_DIRIGEANTS / HAUSSE_SALARIES).toFixed(1).replace('.', ',') +
				' fois plus lente.'
		)
	);

	/* Une hausse de 23 % ne compense pas forcément l'inflation de la période. */
	listeDixAns.appendChild(
		barre(
			'Écart accumulé',
			'× ' + (HAUSSE_DIRIGEANTS / HAUSSE_SALARIES).toFixed(1).replace('.', ','),
			1,
			'Pour chaque euro d’augmentation obtenu par un salarié, en proportion de son salaire, un dirigeant en a obtenu près de quatre.'
		)
	);

	majCompteur();
}

/*
 * Le compteur : les deux rémunérations annuelles étalées seconde par seconde
 * depuis l'ouverture de la page. Il se met à jour une fois par seconde — il n'y
 * a rien à gagner à animer plus vite, et une page qui clignote fatigue.
 */
function majCompteur() {
	var ecoulees = (Date.now() - ouvertureDeLaPage) / 1000;
	var parSecondeDirigeant = REMUNERATION_MOYENNE / SECONDES_PAR_AN;
	var parSecondeVous = salaireAnnuel() / SECONDES_PAR_AN;

	compteur.textContent = '';
	compteur.appendChild(
		boite('Le dirigeant a gagné', eurosPrecis.format(parSecondeDirigeant * ecoulees))
	);
	compteur.appendChild(boite('Vous avez gagné', eurosPrecis.format(parSecondeVous * ecoulees)));
	compteur.appendChild(boite('Temps écoulé', dureeEnTexte(ecoulees)));
	compteur.appendChild(
		boite(
			'Écart',
			eurosPrecis.format((parSecondeDirigeant - parSecondeVous) * ecoulees)
		)
	);
}

/* Le curseur et la case restent synchronisés dans les deux sens. */
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

relier(champSalaire, champSalaireNombre);

rafraichir();
setInterval(majCompteur, 1000);

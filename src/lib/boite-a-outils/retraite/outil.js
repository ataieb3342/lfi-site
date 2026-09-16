// @ts-nocheck
/*
 * « Quand pourrai-je partir à la retraite ? »
 *
 * Tout est calculé dans le navigateur : l'année de naissance saisie n'est
 * envoyée nulle part.
 *
 * L'outil ne calcule pas une pension. Il répond à une seule question — à partir
 * de quel âge, et avec combien de trimestres — sous les trois régimes qui se
 * superposent aujourd'hui. Les dispositifs particuliers (carrières longues,
 * pénibilité, invalidité, handicap, régimes spéciaux) ne sont pas traités : ils
 * sont trop nombreux pour être résumés sans mentir, et l'avertissement de la
 * page le dit en toutes lettres.
 *
 * Si vous mettez ces chiffres à jour, mettez aussi à jour les sources dans
 * index.html : un chiffre sans sa source n'a aucune valeur dans un débat.
 */

/* --- Les chiffres officiels --------------------------------------------- */

/*
 * Âge légal d'ouverture des droits, exprimé en MOIS, par année de naissance.
 *
 * Trois états du droit :
 *
 *  - « avant 2023 » : 62 ans pour tout le monde, depuis la génération 1955.
 *  - « réforme 2023 » : loi du 14 avril 2023, montée de 62 à 64 ans à raison de
 *    trois mois par génération, à partir des natifs de septembre 1961.
 *  - « aujourd'hui » : la loi de financement de la Sécurité sociale pour 2026
 *    suspend cette montée pour les pensions prenant effet à compter du
 *    1er septembre 2026. L'âge reste figé à 62 ans et 9 mois jusqu'en janvier
 *    2028, puis la progression reprend, pour atteindre 64 ans à la génération
 *    1969 — et non 1968.
 *
 * Les générations 1961 et 1965 sont partagées en cours d'année selon le mois de
 * naissance. On retient ici la situation de la majorité de la génération, et
 * l'avertissement de la page le signale.
 */
var ANS = 12;

function ageLegalAvant2023() {
	return 62 * ANS;
}

function ageLegal2023(annee) {
	if (annee <= 1960) return 62 * ANS;
	if (annee === 1961) return 62 * ANS + 3;
	if (annee === 1962) return 62 * ANS + 6;
	if (annee === 1963) return 62 * ANS + 9;
	if (annee === 1964) return 63 * ANS;
	if (annee === 1965) return 63 * ANS + 3;
	if (annee === 1966) return 63 * ANS + 6;
	if (annee === 1967) return 63 * ANS + 9;
	return 64 * ANS;
}

function ageLegalAujourdhui(annee) {
	if (annee <= 1960) return 62 * ANS;
	if (annee === 1961) return 62 * ANS + 3;
	if (annee === 1962) return 62 * ANS + 6;
	if (annee === 1963) return 62 * ANS + 9;
	if (annee === 1964) return 62 * ANS + 9;
	if (annee === 1965) return 63 * ANS;
	if (annee === 1966) return 63 * ANS + 3;
	if (annee === 1967) return 63 * ANS + 6;
	if (annee === 1968) return 63 * ANS + 9;
	return 64 * ANS;
}

/*
 * Durée d'assurance requise pour le taux plein, en TRIMESTRES.
 *
 * Avant 2023 : calendrier de la loi Touraine de 2014, qui montait déjà à 172
 * trimestres, mais seulement pour la génération 1973. La réforme de 2023 a
 * avancé cette échéance de huit ans, à la génération 1965.
 */
function dureeAvant2023(annee) {
	if (annee <= 1960) return 167;
	if (annee <= 1963) return 168;
	if (annee <= 1966) return 169;
	if (annee <= 1969) return 170;
	if (annee <= 1972) return 171;
	return 172;
}

function duree2023(annee) {
	if (annee <= 1960) return 167;
	if (annee <= 1962) return 169;
	if (annee === 1963) return 170;
	if (annee === 1964) return 171;
	return 172;
}

function dureeAujourdhui(annee) {
	if (annee <= 1960) return 167;
	if (annee <= 1962) return 169;
	if (annee === 1963) return 170;
	if (annee === 1964) return 170;
	if (annee === 1965) return 171;
	return 172;
}

// Drees, Études et Résultats n° 1363 (janvier 2026), données de 2024 :
// espérance de vie sans incapacité à la naissance.
var SANS_INCAPACITE_FEMMES = 64.1;
var SANS_INCAPACITE_HOMMES = 63.7;

/* --- Mise en forme ------------------------------------------------------ */

/** « 63 ans et 9 mois », à partir d'un nombre de mois. */
function ageEnTexte(mois) {
	var annees = Math.floor(mois / ANS);
	var reste = mois % ANS;
	if (reste === 0) return annees + ' ans';
	return annees + ' ans et ' + reste + ' mois';
}

/** « 2 ans », « 9 mois », « 2 ans et 3 mois » — pour une durée, pas un âge. */
function dureeEnTexte(mois) {
	if (mois === 0) return 'rien';
	var annees = Math.floor(mois / ANS);
	var reste = mois % ANS;
	var morceaux = [];
	if (annees > 0) morceaux.push(annees + (annees > 1 ? ' ans' : ' an'));
	if (reste > 0) morceaux.push(reste + ' mois');
	return morceaux.join(' et ');
}

/** 172 trimestres → « 43 ans ». */
function trimestresEnTexte(trimestres) {
	var annees = trimestres / 4;
	var texte = Number.isInteger(annees)
		? String(annees)
		: annees.toFixed(2).replace('.', ',');
	return trimestres + ' trimestres (' + texte + ' ans)';
}

/* --- Affichage ---------------------------------------------------------- */

/*
 * Une ligne de comparaison : un intitulé, une valeur, une explication. On
 * réutilise les classes des barres sans la barre elle-même — ici, aucune
 * proportion n'a de sens : deux ans d'écart sur soixante-quatre donneraient
 * trois barres identiques.
 */
function ligne(titre, valeur, detail) {
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
	li.appendChild(entete);

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

var champNaissance = document.getElementById('naissance');
var champNaissanceNombre = document.getElementById('naissance-nombre');

var depart = document.getElementById('depart');
var departPhrase = document.getElementById('depart-phrase');
var listeRegimes = document.getElementById('regimes');
var cout = document.getElementById('cout');
var coutPhrase = document.getElementById('cout-phrase');
var coutDetails = document.getElementById('cout-details');
var santePhrase = document.getElementById('sante-phrase');

function rafraichir() {
	var annee = Number(champNaissance.value);

	var ageAvant = ageLegalAvant2023();
	var ageReforme = ageLegal2023(annee);
	var ageActuel = ageLegalAujourdhui(annee);

	var dureeAvant = dureeAvant2023(annee);
	var dureeReforme = duree2023(annee);
	var dureeActuelle = dureeAujourdhui(annee);

	/* L'âge de départ sous le droit en vigueur. */
	depart.textContent = ageEnTexte(ageActuel);
	departPhrase.textContent =
		'au plus tôt, soit en ' +
		(annee + Math.floor(ageActuel / ANS)) +
		' — et à condition d’avoir cotisé ' +
		trimestresEnTexte(dureeActuelle) +
		'. Sans cette durée, partir à cet âge veut dire une pension réduite à vie.';

	/* Les trois états du droit. */
	listeRegimes.textContent = '';
	listeRegimes.appendChild(
		ligne(
			'Avant la réforme de 2023',
			ageEnTexte(ageAvant),
			'Il fallait ' +
				trimestresEnTexte(dureeAvant) +
				' de cotisation. C’est le droit qu’une abrogation rétablirait.'
		)
	);
	listeRegimes.appendChild(
		ligne(
			'Réforme de 2023',
			ageEnTexte(ageReforme),
			'Avec ' +
				trimestresEnTexte(dureeReforme) +
				'. C’est le calendrier voté en avril 2023, contre lequel ont eu lieu quatorze journées de mobilisation.'
		)
	);
	listeRegimes.appendChild(
		ligne(
			'Aujourd’hui, après la suspension',
			ageEnTexte(ageActuel),
			'Avec ' +
				trimestresEnTexte(dureeActuelle) +
				'. La loi de financement de la Sécurité sociale pour 2026 a décalé le calendrier, sans le supprimer.'
		)
	);

	/* L'écart avec le droit d'avant 2023 : c'est cela, le coût de la réforme. */
	var moisEnPlus = ageActuel - ageAvant;
	var trimestresEnPlus = dureeActuelle - dureeAvant;

	if (moisEnPlus === 0 && trimestresEnPlus === 0) {
		cout.textContent = 'Rien';
		coutPhrase.textContent =
			'Votre génération n’est pas touchée : elle relève déjà des règles antérieures à la réforme.';
	} else {
		cout.textContent = dureeEnTexte(moisEnPlus);
		coutPhrase.textContent =
			'de travail en plus avant de pouvoir partir — donc autant de pension que vous ne toucherez pas. Sur une retraite, ce sont ' +
			dureeEnTexte(moisEnPlus) +
			' de vie libre en moins, à l’âge où l’on en profite le mieux.';
	}

	coutDetails.textContent = '';
	coutDetails.appendChild(boite('Âge de départ, avant 2023', ageEnTexte(ageAvant)));
	coutDetails.appendChild(boite('Âge de départ, aujourd’hui', ageEnTexte(ageActuel)));
	coutDetails.appendChild(
		boite(
			'Trimestres exigés en plus',
			trimestresEnPlus > 0 ? '+ ' + trimestresEnPlus : 'aucun'
		)
	);
	coutDetails.appendChild(
		boite(
			'Ce que la suspension vous rend',
			ageReforme > ageActuel ? dureeEnTexte(ageReforme - ageActuel) : 'rien'
		)
	);

	/* La confrontation avec l'espérance de vie sans incapacité. */
	var departAns = ageActuel / ANS;

	if (departAns >= SANS_INCAPACITE_FEMMES) {
		santePhrase.textContent =
			'Vous partirez à ' +
			ageEnTexte(ageActuel) +
			' : au-delà de l’âge jusqu’auquel une personne née aujourd’hui peut espérer vivre sans être limitée par un problème de santé — 64,1 ans pour les femmes, 63,7 ans pour les hommes. Ce chiffre décrit une moyenne, pas votre cas : il ne dit pas que vous serez malade à cet âge. Il dit qu’en repoussant l’âge de départ au-delà de ce seuil, on a cessé de promettre une retraite en bonne santé.';
	} else if (departAns >= SANS_INCAPACITE_HOMMES) {
		santePhrase.textContent =
			'Vous partirez à ' +
			ageEnTexte(ageActuel) +
			' : au-delà de l’espérance de vie sans incapacité des hommes (63,7 ans), tout juste en deçà de celle des femmes (64,1 ans). Ce chiffre décrit une moyenne, pas votre cas — mais il situe exactement où l’on a placé la barre.';
	} else {
		var marge = SANS_INCAPACITE_HOMMES - departAns;
		santePhrase.textContent =
			'Vous partirez à ' +
			ageEnTexte(ageActuel) +
			', soit environ ' +
			dureeEnTexte(Math.round(marge * ANS)) +
			' avant l’espérance de vie sans incapacité (63,7 ans pour les hommes, 64,1 ans pour les femmes). Les générations nées après 1968, elles, partiront après ce seuil.';
	}
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

relier(champNaissance, champNaissanceNombre);

rafraichir();

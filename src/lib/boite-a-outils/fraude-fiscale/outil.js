// @ts-nocheck
/*
 * « La fraude fiscale, en chiffres vérifiables »
 *
 * Tout est calculé dans le navigateur ; rien n'est envoyé au serveur.
 *
 * Choix de construction : l'argument repose sur les résultats publiés par
 * l'administration fiscale, pas sur l'estimation syndicale de la fraude totale.
 * Cette estimation existe et elle est citée, mais elle est contestée — et le
 * curseur laisse le visiteur choisir son hypothèse plutôt que de lui en imposer
 * une. Un raisonnement qui tient avec les chiffres de l'adversaire est un
 * raisonnement qu'on ne peut pas nous retirer.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// DGFiP, résultats du contrôle fiscal 2025, en milliards d'euros.
var NOTIFIE = 17.1;
var ENCAISSE = 11.4;

// Bornes réellement publiées, en milliards d'euros par an.
// 20-26 : fraude à la seule TVA, chiffrée par l'Insee (2022).
// 80-100 : ensemble des impôts, estimation Solidaires Finances Publiques (2018).
var ESTIMATION_INSEE_BASSE = 20;
var ESTIMATION_INSEE_HAUTE = 26;
var ESTIMATION_SYNDICALE_BASSE = 80;

/*
 * Postes de dépense publique, en milliards d'euros (Insee, dépenses de 2024).
 * Mêmes chiffres que le module « Où va l'argent public ? ».
 */
var POSTES = [
	{ titre: 'Environnement', milliards: 30 },
	{ titre: 'Logement et équipements collectifs', milliards: 42 },
	{ titre: 'Sécurité et justice', milliards: 52 },
	{ titre: 'Défense', milliards: 54 },
	{ titre: 'Enseignement', milliards: 149 }
];

/* --- Mise en forme ------------------------------------------------------ */

var nombres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

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

var listeRecouvrement = document.getElementById('recouvrement');
var recouvrementPhrase = document.getElementById('recouvrement-phrase');
var champEstimation = document.getElementById('estimation');
var champEstimationNombre = document.getElementById('estimation-nombre');
var estimationLegende = document.getElementById('estimation-legende');
var part = document.getElementById('part');
var partPhrase = document.getElementById('part-phrase');
var listeManque = document.getElementById('manque');

/* --- Notifié contre encaissé (ne dépend d'aucun réglage) ---------------- */

function afficherRecouvrement() {
	var perdu = NOTIFIE - ENCAISSE;

	listeRecouvrement.appendChild(
		barre(
			'Réclamé au terme des contrôles',
			milliards(NOTIFIE),
			1,
			'Droits et pénalités notifiés aux particuliers et aux entreprises en 2025, en hausse de 27 % depuis 2021.'
		)
	);
	listeRecouvrement.appendChild(
		barre(
			'Effectivement encaissé',
			milliards(ENCAISSE),
			ENCAISSE / NOTIFIE,
			'Le même montant qu’en 2024. C’est l’argent qui entre réellement dans les caisses.'
		)
	);
	listeRecouvrement.appendChild(
		barre(
			'Réclamé mais jamais perçu',
			milliards(perdu),
			perdu / NOTIFIE,
			'Insolvabilité, sociétés disparues, contentieux perdus, montages hors d’atteinte.'
		)
	);

	recouvrementPhrase.textContent =
		'Sur 100 € que l’administration réclame au terme d’un contrôle, elle en encaisse ' +
		nombres.format(Math.round((ENCAISSE / NOTIFIE) * 100)) +
		'. Et cela ne concerne que la fraude qu’elle a détectée : le reste, par définition, n’apparaît dans aucun tableau.';
}

/* --- L'hypothèse du visiteur -------------------------------------------- */

function rafraichir() {
	var estimation = Number(champEstimation.value);
	if (!isFinite(estimation) || estimation <= 0) return;

	/* D'où vient le chiffre que le visiteur vient de choisir. */
	if (estimation <= ESTIMATION_INSEE_HAUTE) {
		estimationLegende.textContent =
			'Vous êtes dans la fourchette de l’Insee, qui ne chiffre que la fraude à la TVA — un seul impôt sur la quarantaine qui existe. C’est l’hypothèse la plus prudente possible, et elle suffit déjà à la démonstration.';
	} else if (estimation < ESTIMATION_SYNDICALE_BASSE) {
		estimationLegende.textContent =
			'Vous êtes entre les deux estimations publiées : au-dessus de la seule fraude à la TVA chiffrée par l’Insee, en dessous de l’estimation syndicale portant sur tous les impôts. Aucune institution ne défend précisément ce niveau.';
	} else {
		estimationLegende.textContent =
			'Vous êtes dans la fourchette de Solidaires Finances Publiques, qui porte sur l’ensemble des impôts. C’est l’estimation la plus haute et la plus contestée : la Cour des comptes juge qu’aucun chiffrage global de la fraude n’est aujourd’hui fiable.';
	}

	var recupere = ENCAISSE / estimation;
	var manque = estimation - ENCAISSE;

	part.textContent = pourcent(recupere);
	partPhrase.textContent =
		'de la fraude estimée est effectivement encaissée. Sur ' +
		milliards(estimation) +
		' supposés échapper à l’impôt chaque année, l’administration en récupère ' +
		milliards(ENCAISSE) +
		'. Il en manque ' +
		milliards(manque) +
		' — chaque année, et sans effet de rattrapage l’année suivante.';

	/* Ce que le manque représente, poste par poste. */
	listeManque.textContent = '';

	POSTES.forEach(function (poste) {
		listeManque.appendChild(
			barre(
				poste.titre,
				pourcent(Math.min(1, manque / poste.milliards)),
				Math.min(1, manque / poste.milliards),
				manque >= poste.milliards
					? 'La totalité de ce poste, soit ' +
						milliards(poste.milliards) +
						' par an, tiendrait dans le manque.'
					: 'Ce poste coûte ' +
						milliards(poste.milliards) +
						' par an. Le manque en couvrirait ' +
						pourcent(manque / poste.milliards) +
						'.'
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
		if (!isFinite(valeur) || valeur <= 0) return;
		curseur.value = String(
			Math.min(Number(curseur.max), Math.max(Number(curseur.min), valeur))
		);
		rafraichir();
	});
}

relier(champEstimation, champEstimationNombre);

afficherRecouvrement();
rafraichir();

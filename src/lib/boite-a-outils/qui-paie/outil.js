// @ts-nocheck
/*
 * « Qui paie vraiment l'impôt ? »
 *
 * Tout est calculé dans le navigateur : aucun salaire n'est envoyé au serveur,
 * et il n'y a donc rien à protéger ni à effacer.
 *
 * Les seuls chiffres inscrits ici sont officiels et datés (voir les sources en
 * bas de la page). Si vous les mettez à jour, mettez aussi à jour le texte des
 * sources dans index.html : un chiffre sans sa source n'a aucune valeur dans un
 * débat.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Barème de l'impôt sur le revenu 2026 (sur les revenus de 2025), pour une
// part de quotient familial. Loi de finances pour 2026.
var BAREME = [
	{ plafond: 11600, taux: 0 },
	{ plafond: 29579, taux: 0.11 },
	{ plafond: 84577, taux: 0.3 },
	{ plafond: 181917, taux: 0.41 },
	{ plafond: Infinity, taux: 0.45 }
];

// Abattement forfaitaire de 10 % pour frais professionnels.
var ABATTEMENT = 0.1;

// Décote 2026. Sans elle, l'impôt des foyers modestes serait très surestimé :
// c'est elle qui l'annule complètement jusqu'aux alentours du SMIC. L'oublier
// dans un module destiné d'abord à ces foyers serait une faute.
var DECOTE_PLAFOND_SEUL = 1982;
var DECOTE_PLAFOND_COUPLE = 3277;
var DECOTE_BASE_SEUL = 897;
var DECOTE_BASE_COUPLE = 1483;
var DECOTE_TAUX = 0.4525;

// CSG (9,2 %) + CRDS (0,5 %), assises sur 98,25 % du salaire brut.
var TAUX_CSG_CRDS = 0.097;
var ASSIETTE_CSG = 0.9825;

// Passage du net au brut. Les cotisations salariales représentent environ 22 %
// du brut pour un salarié du privé : c'est une approximation, elle varie selon
// le statut et la convention collective.
var PART_NETTE_DU_BRUT = 0.78;

// Poids de la TVA dans le revenu disponible, mesuré par l'Insee : environ 12 %
// pour les ménages les plus modestes, 5 % pour les plus aisés. On interpole
// entre ces deux repères — c'est un ordre de grandeur, pas un relevé d'achats.
var TVA_REVENU_BAS = 1000;
var TVA_TAUX_BAS = 0.12;
var TVA_REVENU_HAUT = 3500;
var TVA_TAUX_HAUT = 0.05;

// Étude IPP n° 92 (juin 2023), données fiscales de 2016 : taux d'imposition
// effectif tous impôts directs compris, impôt sur les sociétés inclus.
var SOMMET = [
	{
		titre: 'Les 0,1 % les plus riches',
		detail: 'Environ 38 000 foyers. Le sommet de la courbe : au-delà, le taux redescend.',
		taux: 0.46
	},
	{
		titre: 'Les 0,0002 % les plus riches',
		detail: 'Les 75 foyers les plus fortunés de France — 20 points de moins.',
		taux: 0.26
	}
];

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

function pourcent(part, decimales) {
	return (part * 100).toFixed(decimales === undefined ? 1 : decimales).replace('.', ',') + ' %';
}

/* --- Calculs ------------------------------------------------------------ */

/**
 * La décote, qui réduit — souvent jusqu'à zéro — l'impôt des foyers modestes.
 * On considère qu'un foyer de deux parts ou plus est imposé en commun : c'est
 * l'approximation habituelle, elle se trompe pour un parent isolé de deux
 * enfants, cas que ce module ne cherche pas à couvrir au centime près.
 */
function decote(impotBrut, parts) {
	var enCouple = parts >= 2;
	var plafond = enCouple ? DECOTE_PLAFOND_COUPLE : DECOTE_PLAFOND_SEUL;
	if (impotBrut > plafond) return 0;

	var base = enCouple ? DECOTE_BASE_COUPLE : DECOTE_BASE_SEUL;
	return Math.max(0, Math.min(impotBrut, base - impotBrut * DECOTE_TAUX));
}

/** Impôt sur le revenu, barème progressif appliqué au quotient familial. */
function impotSurLeRevenu(revenuImposable, parts) {
	var parPart = revenuImposable / parts;
	var impot = 0;
	var bas = 0;

	for (var i = 0; i < BAREME.length; i++) {
		var tranche = BAREME[i];
		if (parPart <= bas) break;
		impot += (Math.min(parPart, tranche.plafond) - bas) * tranche.taux;
		bas = tranche.plafond;
	}

	var brut = impot * parts;
	return brut - decote(brut, parts);
}

/** Part du revenu passant en TVA, interpolée entre les deux repères de l'Insee. */
function tauxDeTva(netMensuel) {
	if (netMensuel <= TVA_REVENU_BAS) return TVA_TAUX_BAS;
	if (netMensuel >= TVA_REVENU_HAUT) return TVA_TAUX_HAUT;

	var avancement = (netMensuel - TVA_REVENU_BAS) / (TVA_REVENU_HAUT - TVA_REVENU_BAS);
	return TVA_TAUX_BAS - avancement * (TVA_TAUX_BAS - TVA_TAUX_HAUT);
}

function calculer(netMensuel, parts) {
	var netAnnuel = netMensuel * 12;
	var brutMensuel = netMensuel / PART_NETTE_DU_BRUT;

	var impot = impotSurLeRevenu(netAnnuel * (1 - ABATTEMENT), parts);
	var csg = brutMensuel * 12 * ASSIETTE_CSG * TAUX_CSG_CRDS;
	var tva = netAnnuel * tauxDeTva(netMensuel);

	// Les cotisations retraite, chômage et maladie, hors CSG-CRDS : elles sont
	// affichées à part, parce que ce sont des droits acquis, pas de l'impôt.
	var cotisations = (brutMensuel - netMensuel) * 12 - csg;

	return {
		netAnnuel: netAnnuel,
		impot: impot,
		csg: csg,
		tva: tva,
		cotisations: Math.max(0, cotisations),
		total: impot + csg + tva
	};
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

var champSalaire = document.getElementById('salaire');
var champSalaireNombre = document.getElementById('salaire-nombre');
var champParts = document.getElementById('parts');
var texteParts = document.getElementById('parts-texte');
var tauxTotal = document.getElementById('taux-total');
var phraseTotal = document.getElementById('phrase-total');
var listeDetail = document.getElementById('detail');
var texteCotisations = document.getElementById('cotisations');

function nomDesParts(parts) {
	if (parts === 1) return '1 part — une personne seule';
	if (parts === 2) return '2 parts — un couple sans enfant';
	var mot = parts > 1 ? ' parts' : ' part';
	return String(parts).replace('.', ',') + mot;
}

function rafraichir() {
	var netMensuel = Number(champSalaire.value);
	var parts = Number(champParts.value);
	var r = calculer(netMensuel, parts);

	texteParts.textContent = nomDesParts(parts);

	// L'échelle des barres : le plus gros prélèvement occupe toute la largeur,
	// pour que les proportions entre eux restent lisibles à tout niveau de salaire.
	var maximum = Math.max(r.impot, r.csg, r.tva, 1);

	tauxTotal.textContent = pourcent(r.total / r.netAnnuel);
	phraseTotal.textContent =
		'de vos revenus partent en impôts et taxes, soit ' +
		euros.format(r.total / 12) +
		' par mois. Sur l’année : ' +
		euros.format(r.total) +
		'.';

	listeDetail.textContent = '';
	listeDetail.appendChild(
		barre(
			'Impôt sur le revenu',
			euros.format(r.impot / 12) + ' / mois',
			r.impot / maximum,
			'Le seul qui soit progressif : son taux augmente avec le revenu. ' +
				'Il représente ' +
				pourcent(r.impot / r.netAnnuel) +
				' de votre revenu.'
		)
	);
	listeDetail.appendChild(
		barre(
			'CSG et CRDS',
			euros.format(r.csg / 12) + ' / mois',
			r.csg / maximum,
			'Prélevées au même taux sur tous les salaires, du SMIC au salaire de PDG : ' +
				pourcent(TAUX_CSG_CRDS, 1) +
				' du brut, sans tranche ni progressivité.'
		)
	);
	listeDetail.appendChild(
		barre(
			'TVA (estimation)',
			euros.format(r.tva / 12) + ' / mois',
			r.tva / maximum,
			'Payée sans la voir, à chaque achat. Elle pèse ' +
				pourcent(tauxDeTva(netMensuel)) +
				' de votre revenu — d’autant plus lourd qu’on dépense tout ce qu’on gagne.'
		)
	);

	texteCotisations.textContent = euros.format(r.cotisations / 12);
}

/* Les deux champs du salaire — le curseur et la case — restent synchronisés. */
champSalaire.addEventListener('input', function () {
	champSalaireNombre.value = champSalaire.value;
	rafraichir();
});

champSalaireNombre.addEventListener('input', function () {
	var valeur = Number(champSalaireNombre.value);
	if (!isFinite(valeur) || valeur <= 0) return;
	champSalaire.value = String(Math.min(Number(champSalaire.max), Math.max(Number(champSalaire.min), valeur)));
	rafraichir();
});

champParts.addEventListener('input', rafraichir);

/* Les barres du sommet de la distribution ne dépendent d'aucune saisie. */
var listeSommet = document.getElementById('sommet');
for (var i = 0; i < SOMMET.length; i++) {
	listeSommet.appendChild(
		barre(SOMMET[i].titre, pourcent(SOMMET[i].taux, 0), SOMMET[i].taux, SOMMET[i].detail)
	);
}

rafraichir();

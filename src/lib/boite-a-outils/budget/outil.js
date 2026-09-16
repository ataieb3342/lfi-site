// @ts-nocheck
/*
 * « Où va l'argent public ? »
 *
 * Les dépenses publiques par fonction, dans trois unités au choix. Tout est
 * calculé dans le navigateur ; rien n'est envoyé au serveur.
 *
 * Les montants viennent d'Insee Première n° 2093 (dépenses de 2024). Pour les
 * mettre à jour : remplacer les valeurs de POSTES et l'année citée dans
 * index.html. Ne pas oublier de vérifier que le total tombe juste.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Dépenses de l'ensemble des administrations publiques en 2024, en milliards
// d'euros, selon la nomenclature internationale des fonctions (Insee).
var POSTES = [
	{
		titre: 'Protection sociale',
		milliards: 693,
		detail: 'Surtout les retraites, puis les allocations familiales, le chômage et les minima sociaux.'
	},
	{
		titre: 'Santé',
		milliards: 261,
		detail: 'Hôpitaux, remboursements de soins et de médicaments, médecine de ville.'
	},
	{
		titre: 'Services généraux',
		milliards: 181,
		detail: 'Le fonctionnement des administrations et les intérêts de la dette publique.'
	},
	{
		titre: 'Affaires économiques',
		milliards: 166,
		detail: 'Transports, énergie, agriculture, et les aides versées aux entreprises.'
	},
	{
		titre: 'Enseignement',
		milliards: 149,
		detail: 'De la maternelle à l’université, salaires des enseignants compris.'
	},
	{
		titre: 'Défense',
		milliards: 54,
		detail: 'Armées et équipement militaire. Le poste qui augmente le plus vite.'
	},
	{
		titre: 'Sécurité et justice',
		milliards: 52,
		detail: 'Police, gendarmerie, pompiers, tribunaux et prisons.'
	},
	{
		titre: 'Culture, sport et loisirs',
		milliards: 43,
		detail: 'Équipements culturels et sportifs, audiovisuel public, patrimoine.'
	},
	{
		titre: 'Logement et équipements collectifs',
		milliards: 42,
		detail: 'Aides au logement, logement social, eau et éclairage public.'
	},
	{
		titre: 'Environnement',
		milliards: 30,
		detail: 'Déchets, dépollution, protection de la biodiversité.'
	}
];

var TOTAL = POSTES.reduce(function (somme, poste) {
	return somme + poste.milliards;
}, 0);

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 2
});

var eurosRonds = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

var nombres = new Intl.NumberFormat('fr-FR');

/* --- Affichage ---------------------------------------------------------- */

var listePostes = document.getElementById('postes');
var legendePostes = document.getElementById('legende-postes');
var champContribution = document.getElementById('contribution');
var champContributionNombre = document.getElementById('contribution-nombre');
var blocContribution = document.getElementById('champ-contribution');
var boutons = document.querySelectorAll('.onglets button');

var vue = 'milliards';

/** Le texte affiché à droite de chaque barre, selon l'unité choisie. */
function valeurAffichee(poste) {
	var part = poste.milliards / TOTAL;

	if (vue === 'milliards') return nombres.format(poste.milliards) + ' Md€';
	if (vue === 'cent') return euros.format(part * 100);
	return euros.format(part * Number(champContribution.value));
}

function legendeDeLaVue() {
	if (vue === 'milliards') {
		return 'Dépenses de l’ensemble des administrations publiques — État, collectivités locales et Sécurité sociale réunis — en 2024.';
	}
	if (vue === 'cent') {
		return 'Sur 100 € d’argent public dépensé, voici ce que reçoit chaque poste.';
	}
	return (
		'Sur les ' +
		eurosRonds.format(Number(champContribution.value)) +
		' que vous versez chaque mois, voici ce qui va à chaque poste.'
	);
}

function rafraichir() {
	legendePostes.textContent = legendeDeLaVue();
	listePostes.textContent = '';

	// Le premier poste, le plus gros, occupe toute la largeur : les autres se
	// lisent par rapport à lui. C'est la comparaison qui compte, pas l'échelle.
	var maximum = POSTES[0].milliards;

	for (var i = 0; i < POSTES.length; i++) {
		var poste = POSTES[i];
		var part = poste.milliards / TOTAL;

		var li = document.createElement('li');

		var entete = document.createElement('div');
		entete.className = 'barre-entete';

		var nom = document.createElement('span');
		nom.className = 'titre';
		nom.textContent = poste.titre;

		var chiffre = document.createElement('span');
		chiffre.className = 'valeur';
		chiffre.textContent = valeurAffichee(poste);

		entete.appendChild(nom);
		entete.appendChild(chiffre);

		var piste = document.createElement('div');
		piste.className = 'barre-piste';

		var remplissage = document.createElement('div');
		remplissage.className = 'barre-remplissage';
		remplissage.style.width = (poste.milliards / maximum) * 100 + '%';
		piste.appendChild(remplissage);

		var detail = document.createElement('p');
		detail.className = 'barre-detail';
		detail.textContent = (part * 100).toFixed(1).replace('.', ',') + ' % du total. ' + poste.detail;

		li.appendChild(entete);
		li.appendChild(piste);
		li.appendChild(detail);
		listePostes.appendChild(li);
	}
}

function choisirVue(nouvelle) {
	vue = nouvelle;

	for (var i = 0; i < boutons.length; i++) {
		boutons[i].setAttribute('aria-pressed', String(boutons[i].dataset.vue === vue));
	}

	blocContribution.hidden = vue !== 'moi';
	rafraichir();
}

for (var i = 0; i < boutons.length; i++) {
	boutons[i].addEventListener('click', function (evenement) {
		choisirVue(evenement.currentTarget.dataset.vue);
	});
}

/* Les deux champs de la contribution — le curseur et la case — restent synchronisés. */
champContribution.addEventListener('input', function () {
	champContributionNombre.value = champContribution.value;
	rafraichir();
});

champContributionNombre.addEventListener('input', function () {
	var valeur = Number(champContributionNombre.value);
	if (!isFinite(valeur) || valeur <= 0) return;
	champContribution.value = String(
		Math.min(Number(champContribution.max), Math.max(Number(champContribution.min), valeur))
	);
	rafraichir();
});

rafraichir();

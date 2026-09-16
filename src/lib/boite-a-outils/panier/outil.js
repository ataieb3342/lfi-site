// @ts-nocheck
/*
 * « Votre salaire a-t-il suivi les prix ? »
 *
 * Tout est calculé dans le navigateur : aucun salaire, aucun budget n'est
 * envoyé au serveur.
 *
 * L'outil repose sur deux indices seulement, et c'est voulu : moins il y a de
 * chiffres, moins il y a de chiffres à défendre. Les deux sont publiés par
 * l'Insee et se vérifient en une minute.
 */

/* --- Les chiffres officiels --------------------------------------------- */

/*
 * Insee, indice des prix à la consommation, hausses CUMULÉES de janvier 2021 à
 * janvier 2026 — et non des taux annuels. C'est la distinction qui compte : une
 * inflation « retombée à 2 % » s'ajoute au niveau déjà atteint, elle ne le
 * réduit pas.
 */
var HAUSSE_ENSEMBLE = 0.155;
var HAUSSE_ALIMENTATION = 0.223;

/* --- Mise en forme ------------------------------------------------------ */

var euros = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

function pourcent(part) {
	return (part * 100).toFixed(1).replace('.', ',') + ' %';
}

function signe(part) {
	return (part >= 0 ? '+ ' : '− ') + pourcent(Math.abs(part));
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

var champ2021 = document.getElementById('salaire-2021');
var champ2021Nombre = document.getElementById('salaire-2021-nombre');
var champActuel = document.getElementById('salaire-actuel');
var champActuelNombre = document.getElementById('salaire-actuel-nombre');
var champCourses = document.getElementById('courses');
var champCoursesNombre = document.getElementById('courses-nombre');

var bilan = document.getElementById('bilan');
var bilanPhrase = document.getElementById('bilan-phrase');
var listeCourse = document.getElementById('course');
var panier = document.getElementById('panier');
var panierPhrase = document.getElementById('panier-phrase');
var panierDetails = document.getElementById('panier-details');

function rafraichir() {
	var salaire2021 = Number(champ2021.value);
	var salaireActuel = Number(champActuel.value);
	var courses = Number(champCourses.value);

	/*
	 * Le salaire qu'il faudrait aujourd'hui pour acheter exactement ce que le
	 * salaire de 2021 achetait alors.
	 */
	var salaireNecessaire = salaire2021 * (1 + HAUSSE_ENSEMBLE);
	var ecart = salaireActuel - salaireNecessaire;
	var hausseSalaire = salaire2021 > 0 ? salaireActuel / salaire2021 - 1 : 0;

	if (ecart < 0) {
		bilan.textContent = 'perdu ' + euros.format(Math.abs(ecart));
		bilanPhrase.textContent =
			'de pouvoir d’achat par mois, soit ' +
			euros.format(Math.abs(ecart) * 12) +
			' sur une année. Pour acheter aujourd’hui ce que ' +
			euros.format(salaire2021) +
			' vous permettaient d’acheter début 2021, il vous faudrait ' +
			euros.format(salaireNecessaire) +
			' — vous en gagnez ' +
			euros.format(salaireActuel) +
			'.';
	} else if (ecart < 1) {
		bilan.textContent = 'fait du surplace';
		bilanPhrase.textContent =
			'Votre salaire a suivi les prix, à l’euro près : ' +
			euros.format(salaireNecessaire) +
			' était exactement ce qu’il fallait pour conserver le pouvoir d’achat de 2021. Cinq ans plus tard, vous achetez la même chose.';
	} else {
		bilan.textContent = 'gagné ' + euros.format(ecart);
		bilanPhrase.textContent =
			'de pouvoir d’achat par mois, soit ' +
			euros.format(ecart * 12) +
			' sur une année. Il fallait ' +
			euros.format(salaireNecessaire) +
			' pour conserver le pouvoir d’achat de 2021 ; vous êtes au-dessus. C’est plus rare que la moyenne ne le laisse croire : à l’échelle du pays, le salaire moyen n’a pas rattrapé son niveau de 2021.';
	}

	/* La course entre le salaire et les prix. */
	listeCourse.textContent = '';
	var maximum = Math.max(HAUSSE_ALIMENTATION, HAUSSE_ENSEMBLE, hausseSalaire, 0.01);

	listeCourse.appendChild(
		barre(
			'Prix de l’alimentation',
			'+ ' + pourcent(HAUSSE_ALIMENTATION),
			HAUSSE_ALIMENTATION / maximum,
			'Le poste qui a le plus augmenté, et celui auquel on ne peut pas renoncer.'
		)
	);
	listeCourse.appendChild(
		barre(
			'Ensemble des prix',
			'+ ' + pourcent(HAUSSE_ENSEMBLE),
			HAUSSE_ENSEMBLE / maximum,
			'L’indice des prix à la consommation, tous produits et services confondus.'
		)
	);
	listeCourse.appendChild(
		barre(
			'Votre salaire',
			signe(hausseSalaire),
			Math.max(0, hausseSalaire) / maximum,
			hausseSalaire >= HAUSSE_ENSEMBLE
				? 'Votre salaire a fait mieux que les prix.'
				: 'Votre salaire a augmenté moins vite que les prix : l’écart, c’est votre pouvoir d’achat.'
		)
	);

	/* Le panier de courses. */
	var panierEn2021 = courses / (1 + HAUSSE_ALIMENTATION);
	var surcout = courses - panierEn2021;

	panier.textContent = euros.format(panierEn2021);
	panierPhrase.textContent =
		'C’est ce que coûtait, début 2021, le panier que vous payez aujourd’hui ' +
		euros.format(courses) +
		'. La différence — ' +
		euros.format(surcout) +
		' par mois, ' +
		euros.format(surcout * 12) +
		' par an — n’a rien acheté de plus : même chariot, même contenu.';

	panierDetails.textContent = '';
	panierDetails.appendChild(boite('Votre panier aujourd’hui', euros.format(courses)));
	panierDetails.appendChild(boite('Le même, début 2021', euros.format(panierEn2021)));
	panierDetails.appendChild(boite('Surcoût mensuel', euros.format(surcout)));
	panierDetails.appendChild(boite('Surcoût annuel', euros.format(surcout * 12)));
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

relier(champ2021, champ2021Nombre);
relier(champActuel, champActuelNombre);
relier(champCourses, champCoursesNombre);

rafraichir();

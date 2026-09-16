// @ts-nocheck
/*
 * « Votre voix pèse combien ? »
 *
 * Tout est calculé dans le navigateur ; rien n'est envoyé au serveur. Il n'y a
 * d'ailleurs rien à envoyer : le seul réglage est un curseur.
 *
 * Particularité de cet outil : ses données ne vieillissent pas. Les résultats
 * des législatives de 2024 sont définitifs et publiés par le ministère de
 * l'Intérieur. Rien ici n'est une estimation, une projection ou une moyenne.
 * C'est ce qui le rend difficile à attaquer — à condition de ne pas arranger le
 * calcul, y compris quand il ne nous arrange pas.
 */

/* --- Les chiffres officiels --------------------------------------------- */

// Ministère de l'Intérieur, législatives des 30 juin et 7 juillet 2024.
var SIEGES = 577;
var INSCRITS = 49332709;
var VOTANTS = 32908657;
var BLANCS = 582908;
var NULS = 267803;
var EXPRIMES = 32057946;

/*
 * Voix du premier tour et sièges obtenus à l'issue du second.
 *
 * La somme des voix est égale au nombre de suffrages exprimés, et la somme des
 * sièges à 577 : les deux vérifications sont faites au chargement et la page
 * refuse d'afficher un résultat si elles échouent. Un tableau qui ne tombe pas
 * juste est un tableau faux.
 *
 * « Autres listes » est un reste : extrême gauche, écologistes hors NFP,
 * régionalistes, divers. Ce n'est pas un parti. On l'écarte donc du calcul des
 * extrêmes — sinon c'est lui qui ferait le titre, pour une raison qui n'a rien
 * de politique.
 */
var BLOCS = [
	{
		titre: 'Rassemblement national et alliés',
		voix: 10713202,
		sieges: 143,
		principal: true
	},
	{
		titre: 'Nouveau Front populaire',
		voix: 9245923,
		sieges: 193,
		principal: true
	},
	{
		titre: 'Ensemble pour la République',
		voix: 6987247,
		sieges: 168,
		principal: true
	},
	{
		titre: 'Les Républicains et alliés',
		voix: 2721843,
		sieges: 60,
		principal: true
	},
	{
		titre: 'Autres listes',
		voix: 2389731,
		sieges: 13,
		principal: false
	}
];

/* --- Vérifications ------------------------------------------------------ */

function somme(liste, champ) {
	return liste.reduce(function (total, element) {
		return total + element[champ];
	}, 0);
}

var TOTAL_VOIX = somme(BLOCS, 'voix');
var TOTAL_SIEGES = somme(BLOCS, 'sieges');

/* --- Mise en forme ------------------------------------------------------ */

var nombres = new Intl.NumberFormat('fr-FR');

function pourcent(part) {
	return (part * 100).toFixed(1).replace('.', ',') + ' %';
}

function siegesEnTexte(n) {
	return nombres.format(n) + (n > 1 ? ' sièges' : ' siège');
}

/* --- Répartition proportionnelle ---------------------------------------- */

/*
 * Méthode de la plus forte moyenne des restes : chaque bloc reçoit la partie
 * entière de sa part, puis les sièges restants vont aux plus forts restes.
 * C'est la méthode la plus simple à expliquer, et celle qui colle au plus près
 * aux pourcentages de voix.
 */
function repartirRestes(exacts, total) {
	var sieges = exacts.map(function (valeur) {
		return Math.floor(valeur);
	});

	var attribues = sieges.reduce(function (total, valeur) {
		return total + valeur;
	}, 0);

	var ordre = exacts
		.map(function (valeur, index) {
			return { index: index, reste: valeur - Math.floor(valeur) };
		})
		.sort(function (a, b) {
			return b.reste - a.reste;
		});

	for (var k = 0; k < total - attribues; k++) {
		sieges[ordre[k % ordre.length].index]++;
	}

	return sieges;
}

/**
 * L'Assemblée avec une « dose » de proportionnelle, de 0 (le scrutin actuel)
 * à 100 (la proportionnelle intégrale). Entre les deux, on mélange les deux
 * répartitions dans cette proportion, puis on arrondit à la plus forte moyenne
 * des restes — la somme fait toujours 577.
 */
function siegesAvecDose(dose) {
	var part = dose / 100;

	return repartirRestes(
		BLOCS.map(function (bloc) {
			var proportionnel = (bloc.voix / TOTAL_VOIX) * SIEGES;
			return (1 - part) * bloc.sieges + part * proportionnel;
		}),
		SIEGES
	);
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

var listeCout = document.getElementById('cout-siege');
var coutPhrase = document.getElementById('cout-phrase');
var champDose = document.getElementById('dose');
var champDoseNombre = document.getElementById('dose-nombre');
var doseLegende = document.getElementById('dose-legende');
var listeRepartition = document.getElementById('repartition');
var vides = document.getElementById('vides');
var videsPhrase = document.getElementById('vides-phrase');
var participation = document.getElementById('participation');

/* --- Le prix d'un siège (ne dépend d'aucun réglage) --------------------- */

function afficherCoutDuSiege() {
	var couts = BLOCS.map(function (bloc) {
		return { bloc: bloc, cout: bloc.voix / bloc.sieges };
	});

	var maximum = Math.max.apply(
		null,
		couts.map(function (entree) {
			return entree.cout;
		})
	);

	couts.forEach(function (entree) {
		listeCout.appendChild(
			barre(
				entree.bloc.titre,
				nombres.format(Math.round(entree.cout)) + ' voix',
				entree.cout / maximum,
				nombres.format(entree.bloc.voix) +
					' voix au premier tour, ' +
					siegesEnTexte(entree.bloc.sieges) +
					' à l’arrivée.'
			)
		);
	});

	/* Les extrêmes, en écartant le reste « autres listes » qui n'est pas un parti. */
	var principaux = couts.filter(function (entree) {
		return entree.bloc.principal;
	});

	var cher = principaux.reduce(function (a, b) {
		return a.cout > b.cout ? a : b;
	});
	var bonMarche = principaux.reduce(function (a, b) {
		return a.cout < b.cout ? a : b;
	});

	/*
	 * On écrit « au bloc “…” » et non « à … » : les intitulés sont des noms de
	 * blocs, pas de partis, et la phrase deviendrait bancale avec la moitié
	 * d'entre eux.
	 */
	coutPhrase.textContent =
		'Un siège a coûté ' +
		nombres.format(Math.round(cher.cout)) +
		' voix au bloc « ' +
		cher.bloc.titre +
		' », et ' +
		nombres.format(Math.round(bonMarche.cout)) +
		' voix au bloc « ' +
		bonMarche.bloc.titre +
		' ». Une voix y pesait donc ' +
		(cher.cout / bonMarche.cout).toFixed(1).replace('.', ',') +
		' fois plus lourd qu’ici. La ligne « autres listes » sort du cadre pour une raison qui n’a rien de politique : ce n’est pas un parti, mais un reste où l’on a rassemblé des listes éparses, chacune trop petite pour emporter une circonscription.';
}

/* --- L'Assemblée selon la dose ------------------------------------------ */

function rafraichir() {
	var dose = Number(champDose.value);
	var sieges = siegesAvecDose(dose);

	if (dose === 0) {
		doseLegende.textContent =
			'Le scrutin majoritaire à deux tours, celui d’aujourd’hui : l’Assemblée réellement élue en 2024.';
	} else if (dose === 100) {
		doseLegende.textContent =
			'La proportionnelle intégrale : les 577 sièges répartis à proportion des voix du premier tour.';
	} else {
		doseLegende.textContent =
			'Un scrutin mixte : ' +
			dose +
			' % des sièges répartis à proportion des voix, le reste au scrutin actuel.';
	}

	listeRepartition.textContent = '';

	BLOCS.forEach(function (bloc, index) {
		var obtenus = sieges[index];
		var ecart = obtenus - bloc.sieges;

		var detail =
			pourcent(bloc.voix / TOTAL_VOIX) +
			' des voix au premier tour, ' +
			pourcent(obtenus / SIEGES) +
			' des sièges.';

		if (ecart !== 0) {
			detail +=
				' Soit ' +
				(ecart > 0 ? '+' : '−') +
				' ' +
				Math.abs(ecart) +
				' par rapport à l’Assemblée réelle (' +
				bloc.sieges +
				').';
		} else if (dose > 0) {
			detail += ' Soit exactement le nombre de sièges réellement obtenus.';
		}

		listeRepartition.appendChild(
			barre(bloc.titre, siegesEnTexte(obtenus), obtenus / SIEGES, detail)
		);
	});

	listeRepartition.appendChild(
		barre(
			'Majorité absolue',
			'289 sièges',
			289 / SIEGES,
			'Aucun bloc ne l’atteint, dans aucune des configurations — c’est vrai du scrutin actuel comme de la proportionnelle.'
		)
	);
}

/* --- L'abstention ------------------------------------------------------- */

function afficherAbstention() {
	var abstention = INSCRITS - VOTANTS;
	var sansVoix = abstention + BLANCS + NULS;
	var siegesVides = Math.round((sansVoix / INSCRITS) * SIEGES);

	vides.textContent = siegesEnTexte(siegesVides);
	videsPhrase.textContent =
		'resteraient vides si l’on réservait des sièges aux ' +
		nombres.format(sansVoix) +
		' inscrits qui n’ont pas voté, ou dont le bulletin était blanc ou nul — soit ' +
		pourcent(sansVoix / INSCRITS) +
		' du corps électoral. C’est davantage que n’importe quel bloc politique : le premier parti de France, à ' +
		nombres.format(abstention) +
		' abstentionnistes, n’envoie personne siéger.';

	participation.appendChild(boite('Inscrits', nombres.format(INSCRITS)));
	participation.appendChild(
		boite('Abstention', nombres.format(abstention) + ' (' + pourcent(abstention / INSCRITS) + ')')
	);
	participation.appendChild(boite('Blancs et nuls', nombres.format(BLANCS + NULS)));
	participation.appendChild(boite('Suffrages exprimés', nombres.format(EXPRIMES)));
}

/* --- Démarrage ---------------------------------------------------------- */

/*
 * Si les totaux ne tombent pas juste, on ne montre rien : mieux vaut une page
 * qui dit qu'elle est cassée qu'une page qui affiche des nombres faux.
 */
if (TOTAL_VOIX !== EXPRIMES || TOTAL_SIEGES !== SIEGES) {
	document.querySelector('.page').textContent =
		'Les données de cette page ne tombent pas juste : elle a été désactivée le temps de la corriger.';
} else {
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

	relier(champDose, champDoseNombre);

	afficherCoutDuSiege();
	afficherAbstention();
	rafraichir();
}

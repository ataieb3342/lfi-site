import { db, now } from './db.ts';
import { confirmTotp, countAdmins, createAdmin, storeTotpSecret } from './auth.ts';
import { createComment, createPublication } from './content.ts';
import { decryptAtRest, hmac } from './crypto.ts';
import { supprimerJetonInstallation } from './installation.ts';
import { setSetting } from './settings.ts';
import { currentTotp, generateTotpSecret } from './totp.ts';

/**
 * Mode démonstration.
 *
 * Sert à mettre le site en ligne sur un hébergement gratuit (Render) pour le
 * faire tester, avant la vraie mise en production. Il s'active avec la variable
 * d'environnement MODE_DEMO=1 et fait trois choses :
 *
 *   1. si la base est vide, elle est remplie d'articles, d'actualités et de
 *      commentaires FICTIFS, et un compte administrateur de test est créé avec
 *      la double authentification déjà activée ;
 *   2. un bandeau « site de démonstration » s'affiche sur toutes les pages ;
 *   3. la page de connexion affiche les identifiants du compte de test et le
 *      code à 6 chiffres du moment.
 *
 * Le point 3 rend l'administration ouverte à quiconque connaît l'adresse.
 * C'est voulu pour une démo, et c'est pour cela que MODE_DEMO ne doit JAMAIS
 * être défini sur le vrai site. Sur Render, le disque est effacé à chaque
 * redémarrage : ce que les testeurs écrivent disparaît de lui-même.
 */

export function modeDemo(): boolean {
	return process.env.MODE_DEMO === '1';
}

export const DEMO_IDENTIFIANT = 'demo';

/** Mot de passe du compte de test : modifiable par DEMO_MOT_DE_PASSE (12 caractères minimum). */
export function demoMotDePasse(): string {
	const saisi = process.env.DEMO_MOT_DE_PASSE ?? '';
	return saisi.length >= 12 ? saisi : 'demonstration-2026';
}

/** Le code à 6 chiffres valable en ce moment, pour l'afficher sur la page de connexion. */
export function demoCodeActuel(): string | null {
	if (!modeDemo()) return null;
	const ligne = db()
		.prepare('select totp_secret from admins where username = ?')
		.get(DEMO_IDENTIFIANT) as { totp_secret: string | null } | undefined;
	if (!ligne?.totp_secret) return null;
	// Le secret est chiffré en base comme pour n'importe quel compte.
	const secret = decryptAtRest(ligne.totp_secret);
	return secret ? currentTotp(secret) : null;
}

let preparationFaite = false;

/**
 * À appeler à la première requête (et non au chargement du module : compiler le
 * site ne doit avoir aucun effet de bord).
 */
export async function preparerDemoSiNecessaire() {
	if (preparationFaite || !modeDemo()) return;
	preparationFaite = true;

	console.warn(
		'\n  [démo] MODE_DEMO=1 : les identifiants d’administration sont affichés publiquement.\n' +
			'  [démo] Ne jamais activer ce mode sur le vrai site.\n'
	);

	if (countAdmins() > 0) return;

	const adminId = await creerCompteDeTest();
	remplirContenus(adminId);
	supprimerJetonInstallation();
	console.log('[démo] base remplie de contenus fictifs, compte « demo » créé.');
}

async function creerCompteDeTest(): Promise<number> {
	const id = await createAdmin({
		username: DEMO_IDENTIFIANT,
		displayName: 'Compte de démonstration',
		password: demoMotDePasse(),
		role: 'owner'
	});
	// La 2FA est obligatoire sur le site : on l'active d'office pour que les
	// testeurs n'aient pas à scanner un QR code. Le code est affiché à la connexion.
	storeTotpSecret(id, generateTotpSecret());
	confirmTotp(id);
	return id;
}

/* ------------------------------------------------------------- contenus */

/** Date du jour décalée de n jours, au format AAAA-MM-JJ. */
function dansNJours(n: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** Le prochain samedi à au moins deux jours d'ici, au format AAAA-MM-JJ. */
function prochainSamedi(): number {
	const d = new Date();
	let n = (6 - d.getUTCDay() + 7) % 7;
	if (n < 2) n += 7;
	return n;
}

/** Horodatage ISO décalé de n jours et de quelques heures, pour étaler les dates de publication. */
function ilYaNJours(n: number, heure = 18): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - n);
	d.setUTCHours(heure, 0, 0, 0);
	return d.toISOString();
}

type Fiche = {
	kind: 'article' | 'actu';
	title: string;
	summary: string;
	body: string;
	/** Nombre de jours écoulés depuis la publication. */
	publieIlYa: number;
	/** Décalage en jours de la date de l'action (actualités seulement), ou une fonction qui le calcule. */
	actionDans?: number | (() => number);
	commentaires?: { auteur: string; texte: string; statut: 'approved' | 'pending' }[];
};

const FICHES: Fiche[] = [
	{
		kind: 'actu',
		title: 'Tractage au marché des Halles samedi matin',
		summary:
			'Rendez-vous à 9 h 30 devant l’entrée principale des Halles pour distribuer notre tract sur les transports.',
		actionDans: prochainSamedi,
		publieIlYa: 2,
		body: `Nous serons au marché des Halles **samedi de 9 h 30 à 12 h** pour distribuer le tract du groupe sur la gratuité des transports pour les moins de 26 ans.

## Ce qu’il faut savoir

- Rendez-vous devant l’entrée principale, côté rue Bannelier.
- Les tracts et le matériel sont apportés par le groupe : venez les mains libres.
- Une heure suffit, personne n’est obligé de rester toute la matinée.
- Première fois ? Vous serez en binôme avec quelqu’un qui a l’habitude.

> Distribuer un tract, c’est surtout écouter les gens. On apprend plus en une matinée de marché qu’en dix réunions.

Prévenez-nous par courriel si vous venez, pour que l’on prévoie assez de tracts.`,
		commentaires: [
			{
				auteur: 'Camille',
				texte: 'Je viens avec deux amis, on arrive vers 10 h. Il y aura des tracts en assez grand nombre ?',
				statut: 'pending'
			}
		]
	},
	{
		kind: 'actu',
		title: 'Réunion publique : transports et mobilité à Dijon',
		summary:
			'Soirée ouverte à toutes et tous pour discuter de la gratuité des transports, du vélo et du dernier tram.',
		actionDans: 9,
		publieIlYa: 5,
		body: `Le groupe organise une **réunion publique** sur les transports dans la métropole. Entrée libre, sans inscription.

## Programme

1. Présentation de la proposition de gratuité pour les moins de 26 ans.
2. Témoignages d’usagers et d’usagères : étudiants, salariés en horaires décalés, retraités.
3. Temps de questions et de propositions.

## Informations pratiques

- **Quand :** à 19 h, accueil dès 18 h 30.
- **Où :** salle municipale du quartier, adresse précisée sur le tract.
- **Accessibilité :** salle de plain-pied, accessible en fauteuil.

La réunion se termine au plus tard à 21 h. Un pot est prévu ensuite pour continuer la discussion.`
	},
	{
		kind: 'actu',
		title: 'Formation : prendre la parole en réunion',
		summary: 'Un atelier de deux heures pour celles et ceux qui n’osent pas encore parler en public.',
		actionDans: 16,
		publieIlYa: 8,
		body: `Beaucoup d’entre nous hésitent à prendre la parole en réunion ou en porte-à-porte. Cet atelier est fait pour ça.

## Au programme

- Structurer une intervention en trois minutes.
- Répondre à une objection sans s’énerver.
- Exercices en petits groupes, bienveillants et sans jugement.

**Places limitées à douze personnes** pour que chacun puisse s’exercer. Inscription par courriel.`
	},
	{
		kind: 'actu',
		title: 'Nouvelle permanence chaque mercredi soir',
		summary: 'À partir de ce mois-ci, le groupe tient une permanence hebdomadaire ouverte à toutes et tous.',
		publieIlYa: 12,
		body: `Nous ouvrons une **permanence tous les mercredis de 18 h à 20 h**. Pas besoin d’être membre : on vient poser une question, proposer une action, ou simplement discuter.

Ce que l’on peut y faire :

- s’informer sur le groupe et ses actions en cours ;
- déposer une idée d’action ou un sujet à porter ;
- récupérer du matériel (tracts, affiches) ;
- boire un café.

Le lieu est indiqué dans la lettre d’information du groupe.`
	},
	{
		kind: 'actu',
		title: 'Retour sur la marche pour le climat',
		summary: 'Plusieurs centaines de personnes ont défilé de la place de la République à la place Darcy.',
		actionDans: -12,
		publieIlYa: 11,
		body: `Merci à toutes celles et ceux qui ont marché avec nous samedi dernier. Le cortège a rassemblé plusieurs centaines de personnes malgré la pluie.

## Ce que nous retenons

- Une forte présence des lycéens et des étudiants.
- De nombreux échanges sur les transports et le logement, deux sujets que nous porterons dans les semaines à venir.
- Un cortège calme et bien organisé, sans incident.

Les photos de la marche sont disponibles sur demande auprès du groupe.`
	},
	{
		kind: 'article',
		title: 'Pourquoi nous demandons la gratuité des transports pour les moins de 26 ans',
		summary:
			'Un abonnement Divia coûte cher à un étudiant ou à un apprenti. Nous proposons une mesure simple, finançable et déjà appliquée ailleurs.',
		publieIlYa: 4,
		body: `Chaque rentrée, la question revient dans les discussions au marché ou en porte-à-porte : le prix de l’abonnement de transport pèse lourd dans le budget des jeunes.

## Le constat

Pour un étudiant ou un apprenti, l’abonnement annuel représente plusieurs semaines de petits boulots. Beaucoup y renoncent et se déplacent moins : moins de cours, moins de sorties, moins de rendez-vous médicaux.

## La proposition

Nous proposons la **gratuité des transports en commun de la métropole pour toutes les personnes de moins de 26 ans**, sans condition de ressources.

- **Simple :** pas de dossier à remplir, une pièce d’identité suffit.
- **Finançable :** plusieurs métropoles françaises l’ont mise en place sans augmenter les impôts locaux.
- **Utile pour tout le monde :** moins de voitures aux heures de pointe, c’est moins de bouchons et un air plus respirable.

## Et ensuite ?

Nous présenterons cette proposition lors de notre réunion publique sur les transports, et nous distribuerons un tract au marché des Halles. Venez en discuter avec nous.

*Cet article est une prise de position du groupe d’action local. Il n’engage pas le mouvement national.*`,
		commentaires: [
			{
				auteur: 'Nadia',
				texte:
					'Très bonne idée. Est-ce que la mesure couvrirait aussi les lignes qui vont jusqu’à Chenôve et Quetigny ?',
				statut: 'approved'
			},
			{
				auteur: '',
				texte: 'Et pour les plus de 26 ans qui gagnent le SMIC, on fait quoi ?',
				statut: 'approved'
			},
			{
				auteur: 'Un habitant des Grésilles',
				texte: 'Je serais curieux de voir le chiffrage. Vous pouvez le publier ?',
				statut: 'pending'
			}
		]
	},
	{
		kind: 'article',
		title: 'Logement étudiant : ce que nous avons entendu en porte-à-porte',
		summary:
			'Trois soirées de porte-à-porte dans les résidences du campus. Loyers, chauffage, isolement : le compte rendu.',
		publieIlYa: 15,
		body: `Pendant trois soirées, une dizaine d’entre nous ont fait du porte-à-porte dans les résidences étudiantes du campus. Voici ce qui revient le plus souvent.

## Les loyers

Le loyer d’un studio hors résidence universitaire dépasse souvent la moitié du budget mensuel. Plusieurs personnes rencontrées cumulent un emploi de vingt heures par semaine avec leurs études.

## Le chauffage

Dans certaines résidences anciennes, les fenêtres ferment mal et le chauffage collectif s’arrête tôt. Des étudiants nous ont dit dormir habillés en janvier.

## L’isolement

C’est le sujet dont on parle le moins et qui est pourtant revenu à chaque porte. Beaucoup ne connaissent pas leurs voisins et ne savent pas vers qui se tourner.

## Ce que nous allons faire

- Transmettre ce compte rendu aux élus et aux syndicats étudiants.
- Proposer une soirée de rencontre dans une des résidences, avec l’accord des gestionnaires.
- Revenir dans trois mois pour voir ce qui a changé.`,
		commentaires: [
			{
				auteur: 'Théo',
				texte: 'Merci pour ce retour. J’habite une de ces résidences, je confirme pour le chauffage.',
				statut: 'approved'
			}
		]
	},
	{
		kind: 'article',
		title: 'Compte rendu de notre assemblée de rentrée',
		summary: 'Une trentaine de personnes présentes, un calendrier d’actions jusqu’à la fin de l’année et deux nouveaux référents.',
		publieIlYa: 20,
		body: `L’assemblée de rentrée du groupe s’est tenue le mois dernier. Voici l’essentiel, pour celles et ceux qui n’ont pas pu venir.

## Présents

Une trentaine de personnes, dont huit qui venaient pour la première fois. Bienvenue à elles.

## Décisions

- Le groupe porte deux thèmes cette année : **les transports** et **le logement**.
- Une permanence hebdomadaire est ouverte le mercredi soir.
- Deux nouveaux référents sont désignés pour l’organisation matérielle et la communication.

## Calendrier

Les prochaines actions sont annoncées dans la rubrique Actualités du site, avec leur date. Consultez-la régulièrement, ou abonnez-vous au flux RSS.

## Finances

Le groupe fonctionne sans budget propre. Le matériel est financé par les dons des membres et les commandes groupées auprès du mouvement.`
	},
	{
		kind: 'article',
		title: 'Comment fonctionne un groupe d’action ?',
		summary: 'Ni bureau, ni carte d’adhérent : un groupe d’action est ouvert à toute personne qui veut agir localement.',
		publieIlYa: 30,
		body: `On nous pose souvent la question : faut-il adhérer, payer une cotisation, être élu ? Non.

## Un groupe ouvert

Un groupe d’action rassemble des personnes d’un même quartier ou d’une même ville qui veulent agir ensemble. Il n’y a pas de carte, pas de cotisation obligatoire, pas de hiérarchie.

## Ce que l’on y fait

- Des actions de terrain : tractages, porte-à-porte, réunions publiques.
- Des temps d’échange et de formation.
- Le relais des campagnes nationales à l’échelle locale.

## Comment nous rejoindre

Le plus simple est de venir à une action ou à une permanence. La page [Nous rejoindre](/nous-rejoindre) explique la marche à suivre.

*Ce site est celui d’un groupe local. Il ne remplace pas la plateforme Action populaire, qui reste l’outil de référence du mouvement.*`
	}
];

function remplirContenus(adminId: number) {
	const base = db();
	const auteur = 'Le groupe d’action';

	for (const fiche of FICHES) {
		const id = createPublication(
			{
				kind: fiche.kind,
				title: fiche.title,
				summary: fiche.summary,
				body: fiche.body,
				status: 'published',
				commentsOpen: true,
				pinned: false,
				coverMediaId: null,
				authorName: auteur,
				eventAt:
					fiche.actionDans === undefined
						? null
						: dansNJours(typeof fiche.actionDans === 'function' ? fiche.actionDans() : fiche.actionDans)
			},
			adminId
		);

		// Les dates de publication sont étalées dans le passé pour que la liste
		// ressemble à un vrai site et non à huit publications du même instant.
		const date = ilYaNJours(fiche.publieIlYa);
		base
			.prepare('update publications set published_at = ?, created_at = ?, updated_at = ? where id = ?')
			.run(date, date, date, id);

		for (const [i, c] of (fiche.commentaires ?? []).entries()) {
			const idCommentaire = createComment({
				publicationId: id,
				authorName: c.auteur,
				body: c.texte,
				status: c.statut,
				// Empreinte fictive, dérivée comme une vraie (HMAC), jamais une adresse en clair.
				ipHash: hmac('ip', `demo-${i}`),
				userAgent: 'demo'
			});
			base
				.prepare('update comments set created_at = ?, moderated_at = ? where id = ?')
				.run(ilYaNJours(Math.max(0, fiche.publieIlYa - 1), 9 + i), c.statut === 'approved' ? now() : null, idCommentaire);
		}
	}

	setSetting('contact_email', 'contact@exemple.fr');
}

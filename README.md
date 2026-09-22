# Site du groupe d'action LFI Dijon Centre

Site d'information : articles, actualités classées par catégorie, agenda
interactif, commentaires anonymes modérés et administration protégée par
double authentification.

- **Hébergement** : VPS français (OVH ou Scaleway), Docker + Caddy.
- **Données** : un fichier SQLite, les images et les PDF de la bibliothèque.
  Sauvegarder revient à copier `data/`.
- **Vie privée** : aucun cookie chez les visiteurs, aucun service tiers, aucune
  adresse IP conservée en clair.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrez http://localhost:5173. Au premier lancement, aucun compte n'existe : le
terminal affiche un **jeton d'installation** (également dans
`data/jeton-installation.txt`). Rendez-vous sur
http://localhost:5173/admin/installation, saisissez ce jeton et créez le premier
compte. Le jeton disparaît ensuite définitivement.

L'écran suivant impose l'activation de la double authentification : scannez le
QR code avec une application d'authentification (Aegis, Tofu, Bitwarden…).

## Structure

```
src/
  lib/server/      logique métier : base, comptes, contenus, images, anti-spam
  lib/components/  composants d'interface partagés
  routes/          pages publiques et administration
docker/            compose.yml et configuration Caddy
scripts/           sauvegarde et restauration
```

## Au quotidien

| Je veux… | Où |
| --- | --- |
| Écrire un article ou une actualité | Administration → Publications → Nouvelle publication |
| Ajouter un évènement | Administration → Publications → Nouvelle publication, puis renseigner sa date et sa catégorie |
| Classer un rendez-vous | Choisir parmi « Action », « Réunion », « Apéro », « Formation » ou « Autre » |
| Consulter les rendez-vous | Agenda : navigation par mois et filtres par catégorie |
| Relire les commentaires reçus | Administration → Commentaires |
| Relire les sources proposées pour un apéro | Administration → Sources des apéros |
| Consulter les ressources validées | Bibliothèque |
| Ajouter un jeu | Déposer son dossier dans `src/lib/jeux/` et l'ajouter à `src/lib/jeux.ts` |
| Ajouter une image | Administration → Images |
| Changer le nom du site, l'adresse de contact | Administration → Réglages |
| Ouvrir ou fermer les commentaires du site | Administration → Réglages |
| Mettre les liens de l'application Action populaire | Administration → Réglages |
| Ajouter un compte à quelqu'un | Administration → Comptes (rôle « responsable ») |
| Changer mon mot de passe, mon téléphone | Administration → Mon compte |

Les publications s'écrivent en **Markdown** : `## Titre`, `**gras**`,
`*italique*`, `[lien](https://…)`, `> citation`, listes à tirets. Le HTML n'est
pas interprété, c'est une protection volontaire.

## Navigation et agenda

La navigation publique est regroupée en deux ensembles :

- **Actualités** : vue d’ensemble, agenda, actions, événements et formations ;
- **Ressources** : bibliothèque, revue de presse, boîte à outils et jeux.

Un clic sur le nom d’un ensemble ouvre sa page principale ; la flèche affiche
ses sous-rubriques.

L’agenda rassemble les publications qui possèdent une date de rendez-vous.
Chaque événement reçoit une catégorie, action, réunion, apéro, formation ou
autre, utilisée pour sa couleur et les filtres du calendrier.

## Site de démonstration

Pour faire tester le site gratuitement avec des contenus fictifs, voir
**[DEMO.md](DEMO.md)**.

## Mise en production

Voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Maintenance assistée

Le fichier **[CLAUDE.md](CLAUDE.md)** décrit l'architecture, les conventions et
les règles de sécurité à ne pas casser. Claude Code le lit automatiquement :
une demande du type « ajoute une page Agenda » ou « permets de trier les
articles par thème » part donc du bon contexte.

Avant tout changement : `npm run check`.

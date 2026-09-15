# Site du groupe d'action LFI Dijon Centre

Site d'information : articles, actualités, commentaires anonymes modérés,
administration protégée par double authentification.

- **Hébergement** : VPS français (OVH ou Scaleway), Docker + Caddy.
- **Données** : un fichier SQLite et un dossier d'images. Sauvegarder revient à
  copier `data/`.
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
| Annoncer une action à venir | Même écran, type « Actualité » + renseigner la date de l'action |
| Relire les commentaires reçus | Administration → Commentaires |
| Relire les sources proposées pour un apéro | Administration → Sources des apéros |
| Ajouter une image | Administration → Images |
| Changer le nom du site, l'adresse de contact | Administration → Réglages |
| Ouvrir ou fermer les commentaires du site | Administration → Réglages |
| Mettre les liens de l'application Action populaire | Administration → Réglages |
| Ajouter un compte à quelqu'un | Administration → Comptes (rôle « responsable ») |
| Changer mon mot de passe, mon téléphone | Administration → Mon compte |

Les publications s'écrivent en **Markdown** : `## Titre`, `**gras**`,
`*italique*`, `[lien](https://…)`, `> citation`, listes à tirets. Le HTML n'est
pas interprété, c'est une protection volontaire.

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

# Site du groupe d'action LFI Dijon Centre

Site d'information : articles, actualités classées par catégorie, agenda
interactif, commentaires anonymes modérés et administration protégée par
double authentification.

- **Hébergement** : VPS français (OVH ou Scaleway), Docker + Caddy.
- **Données** : un fichier SQLite, les images et les PDF de la bibliothèque.
  Sauvegarder revient à copier `data/`.
- **Vie privée** : aucun cookie de mesure d'audience et aucune adresse IP
  conservée en clair.

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
| Raconter une action terminée | Choisir « Retour d’action », puis collage, porte-à-porte ou tractage |
| Ajouter un rendez-vous | Choisir directement « Événement », « Formation » ou « Apéro thématique » |
| Mettre temporairement une publication à la une | Cocher « Épingler à la une » ; l’épinglage expire automatiquement après 15 jours |
| Consulter les rendez-vous | Agenda : navigation par mois et filtres par catégorie |
| Retrouver mes articles en cours | Administration → Vérifications → Mes articles |
| Vérifier un article avant publication | Administration → Vérifications |
| Relire les commentaires reçus | Administration → Commentaires |
| Relire les sources proposées pour un apéro | Administration → Sources des apéros |
| Consulter les ressources validées | Bibliothèque |
| Ajouter un jeu | Déposer son dossier dans `src/lib/jeux/` et l'ajouter à `src/lib/jeux.ts` |
| Ajouter une image | Administration → Images |
| Ajouter un média recommandé, choisir ceux de l'accueil | Administration → Médias recommandés |
| Changer le nom du site, l'adresse de contact | Administration → Réglages |
| Ouvrir ou fermer les commentaires du site | Administration → Réglages |
| Mettre les liens de l'application Action populaire | Administration → Réglages |
| Ajouter un compte à quelqu'un | Administration → Comptes (rôle « responsable ») |
| Changer mon mot de passe, mon téléphone | Administration → Mon compte |

Les publications se rédigent directement dans leur mise en page. Cliquez dans
un paragraphe pour écrire. Ajoutez une image ou une bulle, puis déplacez chaque
élément avec sa poignée ou les boutons Remonter et Descendre. Le texte s'adapte
autour. Un clic sur l'élément donne accès à son placement et à sa largeur, au
cadrage d'une image ou à la couleur d'une bulle. Enregistrez la publication
pour conserver les modifications.

En mode Markdown, les outils sont regroupés en historique, texte et insertion.
Le volet « Police et couleur » rassemble les réglages complémentaires.

Les boutons « Markdown » et « Visuel » permettent de changer de mode sans
perdre le contenu. « Garder avec le bloc suivant » associe une image ou une
bulle au paragraphe qui suit ; plusieurs éléments consécutifs peuvent ainsi
rester ensemble. Les groupes ne traversent pas les titres ou les tableaux.
L'option « Voile parchemin » ajoute un lavis discret derrière une image,
sans modifier son fichier. Ces deux options sont désactivées par défaut.
Le choix « Type de bulle » propose Simple, Parole avec pointe à gauche ou à droite,
et Pensée. La forme Simple reste celle des anciennes bulles. « Rapprocher de
l’image » rapproche une bulle de parole placée après une image dans un même
groupe, sur grand écran. La pointe suit la bulle, sans modifier le dessin. « Petite bulle » réduit
la taille du texte et les marges intérieures pour cet élément seulement.
« Décaler les bulles liées » place les répliques liées sur des lignes successives,
en respectant leur ordre dans le Markdown.
Les anciens articles restent compatibles. Le HTML brut n'est pas interprété.

Un retour d’action ne peut porter que sur une action terminée. Le titre et le
chapô sont préparés à partir du type d’action et de sa date, puis restent
modifiables. Aucun horaire, lieu, responsable, carte ou lien d’inscription
n’est enregistré. Une invitation vers Action populaire termine automatiquement
la fiche.

Les événements, formations et apéros peuvent partager une même date : chaque
fiche reste distincte dans les rubriques et dans l’agenda. Ils disposent de
leurs propres horaires, lieu, adresse, point de rendez-vous, responsables et
lien d’inscription. Pour un apéro, les informations propres à la fiche priment
sur le lieu et l’horaire habituels définis dans les réglages ; ces derniers ne
servent que de valeurs de repli.

## Validation des articles

Le circuit concerne uniquement le type « Article ». Les événements, formations
et apéros conservent leur publication habituelle dans Publications.

Administration → Vérifications comporte deux onglets. « Mes articles » rassemble
les textes non publiés dont le compte connecté est l'auteur responsable.
« À vérifier » contient uniquement les articles des autres sur lesquels ce
compte peut intervenir : une relecture après soumission, ou un avis demandé
personnellement sur un brouillon. Le compteur du menu correspond à cet onglet.
Un brouillon non soumis ne rejoint pas la liste des autres administrateurs.

L'auteur rédige et enregistre son article, puis choisit « Enregistrer et
soumettre » quand il est prêt. Pendant la relecture, il consulte le texte et
les commentaires et peut répondre, sans modifier le texte ni le valider.
Ces restrictions sont aussi contrôlées côté serveur. Une demande explicite de
corrections lui rend la rédaction ; un commentaire seul conserve l'état.

Un autre administrateur ouvre l'article, le corrige si besoin et choisit
« Valider cet article », disponible en haut et à la fin du formulaire. Les
corrections et la validation sont enregistrées
ensemble, sans redemander l'accord initial de l'auteur. Les décisions sur une
ancienne version du texte sont refusées. L'auteur peut ensuite utiliser le
bouton « Publier » sur la version validée. La validation ne publie pas
automatiquement et un auteur ne peut jamais assurer sa propre relecture.

Le bloc de suivi se trouve au-dessus du texte. Après validation, il confirme
que l'auteur peut publier. Il affiche l'action attendue ;
les commentaires récents sont visibles directement. Les autres actions
s'ouvrent au clic : commenter, demander des corrections ou demander un autre
avis. Les dates, versions et priorités restent dans l'historique.

Pendant la rédaction, l'auteur peut demander un avis à une personne désignée.
Celle-ci retrouve la demande dans « À vérifier » et peut donner son avis,
sans valider ni modifier ce brouillon. L'auteur peut soumettre son article
sans attendre la réponse. Cette soumission clôt la demande informelle.

Lors d'une relecture, demander un autre avis bloque la validation jusqu'à
l'intervention de la personne sollicitée, différente de l'auteur et du demandeur.
La demande quitte la liste des interventions du demandeur et apparaît chez la
personne sollicitée. Le suivi reste visible sur la fiche de l'article.

Les articles déjà publiés restent en ligne lors de la mise à jour du logiciel.
La base est migrée automatiquement au démarrage. Les exemples de la
prévisualisation utilisent une base séparée de la production.

## Navigation et agenda

La navigation publique est regroupée en deux ensembles :

- **Actualités** : vue d’ensemble, agenda, retours d’action, événements et formations ;
- **Ressources** : bibliothèque, revue de presse, boîte à outils et jeux.

Un clic sur le nom d’un ensemble ouvre sa page principale ; la flèche affiche
ses sous-rubriques.

L’agenda rassemble les rendez-vous à venir. Les retours d’action restent dans
les actualités et n’annoncent jamais une action à l’avance.

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

Avant tout changement : `npm run check`. Avant livraison :

```bash
npm run check
npm run build
node --experimental-strip-types --test tests/*.test.ts
node --test src/lib/jeux/mythology-rts/tests/*.test.js
```

Les jeux sont des applications JavaScript autonomes, exclues du contrôle
TypeScript/Svelte du site. Le jeu de stratégie possède donc sa propre suite de
tests, exécutée par la troisième commande.

# Site du groupe d'action LFI Dijon Centre

Site d'information : articles, actualités classées par catégorie, agenda
interactif, galerie collaborative de dessins, commentaires anonymes modérés
et administration protégée par double authentification.

- **Hébergement** : VPS français (OVH ou Scaleway), Docker + Caddy.
- **Données** : un fichier SQLite, les images et les PDF de la bibliothèque.
  Sauvegarder revient à copier `data/`.
- **Vie privée** : aucun cookie de mesure d'audience et aucune adresse IP
  conservée en clair.

## Démarrer en local

Node.js 24 minimum.

```bash
npm ci
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
| Écrire un article ou un compte rendu | Administration → Publications → Nouvelle publication → Article |
| Ajouter un rendez-vous | Choisir directement « Événement », « Formation » ou « Apéro thématique » |
| Mettre une publication à la une | Sur une publication en ligne, choisir « Enregistrer et mettre à la une » ; gérer l’ordre et le retrait dans Administration → À la une |
| Consulter les rendez-vous | Agenda : navigation par mois et filtres par catégorie |
| Retrouver mes articles en cours | Administration → Vérifications → Mes articles |
| Vérifier un article avant publication | Administration → Vérifications → À vérifier |
| Relire les commentaires reçus | Administration → Commentaires |
| Relire les sources proposées pour un apéro | Administration → Sources des apéros |
| Consulter les ressources validées | Bibliothèque |
| Ajouter un jeu | Déposer son dossier dans `src/lib/jeux/` et l'ajouter à `src/lib/jeux.ts` |
| Proposer un dessin sans compte | Dessins → Proposer un dessin |
| Vérifier les dessins reçus | Administration → Dessins → Propositions à vérifier |
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

Les événements, formations et apéros peuvent partager une même date : chaque
fiche reste distincte dans les rubriques et dans l’agenda. Ils disposent de
leurs propres horaires, lieu, adresse, point de rendez-vous, responsables et
lien d’inscription. Pour un apéro, les informations propres à la fiche priment
sur le lieu et l’horaire habituels définis dans les réglages ; ces derniers ne
servent que de valeurs de repli.

## Validation des articles

Le circuit concerne uniquement le type « Article ». Les événements, formations
et apéros conservent leur publication habituelle dans Publications.
La création d’un article propose directement « Enregistrer le brouillon » et
« Enregistrer et soumettre ». Le second bouton crée le texte et l’envoie à la
relecture en une seule opération, puis ouvre « Mes articles » avec une
confirmation. Il n’est plus nécessaire d’enregistrer puis de soumettre sur
une deuxième page. Seul l’auteur responsable peut soumettre ; un brouillon
créé pour un autre auteur attend sa soumission depuis son propre compte.
Le serveur refuse une tentative de publication directe,
y compris par le raccourci de mise à la une. Après validation, seule l’action
« Publier » de l’auteur met l’article en ligne ; enregistrer ou mettre à la une
ne permet pas de contourner cette étape.

Administration → Vérifications comporte deux onglets. « Mes articles » rassemble
les textes non publiés dont le compte connecté est l'auteur responsable.
« À vérifier » contient uniquement les articles des autres sur lesquels ce
compte peut intervenir : une relecture après soumission, ou un avis demandé
personnellement sur un brouillon. Le compteur du menu correspond à cet onglet.
Un brouillon non soumis apparaît dans « À vérifier » uniquement chez la
personne à laquelle l’auteur a demandé un avis.

L’auteur et le relecteur peuvent modifier le texte jusqu’à sa publication,
y compris après une première validation. Les modifications du texte retirent
la validation du relecteur, sans retirer la soumission de l’auteur : la
relecture continue sans nouvelle soumission. Un enregistrement fondé sur une
ancienne version est refusé pour ne pas écraser les corrections de l’autre.
L’auteur ne peut pas valider sa propre relecture. Une demande explicite de
corrections remet le texte en rédaction ; un commentaire seul conserve l’état.

Un autre administrateur ouvre l'article, le corrige si besoin et choisit
« Valider cet article », disponible en haut et à la fin du formulaire. Les
corrections et la validation sont enregistrées ensemble, sans redemander
l'accord initial de l'auteur. Les décisions sur une
ancienne version du texte sont refusées. L'auteur peut ensuite utiliser le
bouton « Publier » sur la version validée. La validation ne publie pas
automatiquement et un auteur ne peut jamais assurer sa propre relecture.
Le bouton « Publier » enregistre aussi les champs du formulaire : si le texte
a changé depuis sa validation, les modifications sont conservées et l’article
reste à relire. S’il n’a pas changé, il est mis en ligne. Aucun texte modifié
ne peut ainsi être publié avec une ancienne validation.

Le bloc de suivi se trouve au-dessus du texte. Après validation, il confirme
que l'auteur peut publier. Il affiche l'action attendue ; les commentaires
récents sont visibles directement. Les autres actions
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

## Galerie collaborative de dessins

La page `/dessins` réunit les dessins et caricatures acceptés. Chacun peut
proposer une image depuis `/dessins/proposer`, sans compte ni adresse e-mail.
Le formulaire demande un titre, un nom ou pseudonyme, une description
accessible, les conditions de partage et une confirmation de l'autorisation
de publication et de téléchargement. Une légende peut être ajoutée.
Les fichiers JPEG, PNG, WebP, GIF et AVIF sont acceptés, jusqu'à 5 Mo.

Chaque proposition attend une vérification. Son fichier est conservé dans
`data/uploads/.drawing-submissions/`, sans adresse publique. Seuls les
administrateurs connectés avec la double authentification activée peuvent
le consulter. Le menu Dessins de l'administration indique le nombre de
propositions en attente. L'équipe peut corriger la fiche, puis choisir
« Accepter et publier » ou confirmer son refus. Un refus supprime la
proposition et son fichier privé ; les décisions sont inscrites dans le
journal d'administration. Aucun accusé de décision n'est envoyé par e-mail.

Après acceptation, le dessin rejoint la galerie avec sa signature et ses
conditions de partage. L'original devient téléchargeable. La galerie utilise
des vignettes WebP de 640 pixels maximum, sans recadrage, créées par Sharp
et mises en cache dans `data/uploads/.thumbnails/`. Un clic ouvre un lecteur
avec zoom, navigation précédent/suivant et fermeture par Échap.

Les administrateurs peuvent aussi ajouter directement un dessin, modifier une
fiche publiée ou la remettre en brouillon. Ce brouillon masque la fiche de la
galerie, mais ne rend pas privé un fichier déjà publié dans la médiathèque.
Supprimer une fiche conserve son image dans Administration → Images.

Les envois publics utilisent les mêmes protections anti-spam que les autres
contributions : champ-piège, preuve de travail locale et quotas par empreinte
d'IP. Aucun service extérieur n'est contacté. La file est limitée à 100
propositions. En fonctionnement normal, un visiteur peut envoyer jusqu'à cinq
propositions par jour ; sans preuve de travail valide, un envoi par jour est
accepté. Les images sont vérifiées par leurs octets et décodées avant stockage.

Le dossier `data/` doit être sauvegardé avec les fichiers cachés des envois en
attente. Le script `scripts/sauvegarde.sh` les inclut. Les dessins d'exemple de
l'aperçu local sont dans des données ignorées par Git et ne sont pas déployés.

## Navigation et agenda

La navigation publique donne directement accès à l’agenda, aux articles et aux dessins.
Le menu « Ressources » ouvre la bibliothèque ; sa flèche donne aussi accès à
la boîte à outils, aux jeux et aux médias. L’agenda rassemble les événements,
formations et apéros, avec une navigation par mois et des filtres par catégorie.

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
tests, exécutée par la quatrième commande.

Pour vérifier le parcours éditorial sur le serveur compilé, après `npm run build` :

```bash
node --experimental-strip-types tests/integration/article-workflow-http.mjs
```

Ce contrôle utilise des comptes fictifs, une base temporaire et un serveur local
sur le port 5191 (`TEST_PORT` permet de le changer). Il vérifie aussi les
requêtes de formulaires avec et sans amélioration JavaScript, les refus d'accès,
les tentatives de publication directe et le fonctionnement habituel
des événements, formations et apéros. Le serveur de test est arrêté à la fin.

Pour vérifier les dessins et les contributions publiques, après compilation :

```bash
node tests/integration/drawings-http.mjs
node tests/integration/drawing-submissions-http.mjs
```

Ces contrôles utilisent des bases temporaires, des images et comptes fictifs,
et des serveurs locaux sur les ports 5193 et 5194. Ils couvrent les vignettes,
le téléchargement original, les brouillons, les autorisations, les fichiers
privés avant acceptation, la publication après modération, le refus et
l'anti-spam. Les serveurs sont arrêtés à la fin.

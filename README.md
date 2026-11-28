# La chouette rouge

Le site d'un collectif militant indépendant du centre de Dijon.

Site d'information : articles en trois formats (actus, articles, séries),
agenda (événements, formations, apéros thématiques), galerie collaborative de dessins, commentaires anonymes
modérés et administration protégée par double authentification.

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
| Écrire un article | Administration → Publications → Nouvelle publication → Article, puis choisir le format : Actu, Article ou Série |
| Commencer une série d’articles | Administration → Séries, puis le format « Série » dans chaque article |
| Annoncer un rendez-vous | Nouvelle publication → Événement, Formation ou Apéro thématique |
| Consulter les rendez-vous | Agenda : liste des prochains, ou calendrier du mois, filtres par type |
| Mettre une publication à la une | Sur une publication en ligne, choisir « Enregistrer et mettre à la une » ; gérer l’ordre et le retrait dans Administration → À la une |
| Retrouver les brouillons | Tableau de bord → À faire, ou Publications filtrées sur « Brouillons » |
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

Un apéro a ses propres horaires, lieu, adresse, point de rendez-vous et
responsables ; ces informations priment sur le lieu et l’horaire habituels
définis dans les réglages, qui ne servent que de valeurs de repli.

## Mettre un article en ligne

Un article se publie comme un apéro : le menu « État » de sa fiche, puis
« Enregistrer ». « Brouillon » le garde pour l’équipe, « En ligne » le montre à
tout le monde ; repasser en « Brouillon » le retire du site. Toute l’équipe
peut modifier toute publication, et le journal garde la trace de chaque mise en
ligne et de chaque retrait.

Si deux personnes modifient le même article en même temps, la seconde à
enregistrer est arrêtée et prévenue, au lieu d’effacer sans le savoir le
travail de la première.

Le parcours de relecture à quatre étapes (rédaction, relecture, validé, en
ligne) a été retiré le 26 novembre 2026.

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

## Navigation

L’en-tête donne accès à l’agenda et aux articles. Le menu « Ressources » ouvre
la bibliothèque ; sa flèche donne aussi accès à la boîte à outils, aux jeux,
aux dessins et aux médias. L’agenda rassemble les événements, formations et
apéros, en liste ou en calendrier du mois, avec des filtres par type. La page
Articles se filtre par format (actus, articles, séries) et mène aux pages des
séries.

## Essayer le site avec des contenus fictifs

Sur son ordinateur, sans toucher aux vraies données :

```bash
MODE_DEMO=1 DATABASE_PATH=data/demo/site.db npm run dev
```

Une base vide est remplie de contenus fictifs, et la page de connexion de
l'administration affiche les identifiants d'un compte de test.

## Mise en production

Voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Proposer une modification

Un envoi sur `main` part en production en cinq minutes. Avant de pousser :

```bash
npm run verifier
```

Il vérifie le code, lance les tests et les garde-fous, et compile le site. S'il
échoue, son message dit quoi corriger.

GitHub relance ces vérifications après chaque envoi. Si elles échouent, le
propriétaire du dépôt est prévenu par courriel, pour qu'on répare ensemble :
personne n'est bloqué, mais rien ne casse en silence. Pour un changement
important, on peut aussi passer par une branche et une demande de fusion
(pull request), qui se relit tranquillement avant de partir.

Les règles du projet sont dans trois fichiers :

- **[CLAUDE.md](CLAUDE.md)** - l'architecture, les conventions, les règles de
  sécurité, et la raison de chaque choix. Claude Code le lit automatiquement.
- **[AGENTS.md](AGENTS.md)** - le résumé impératif, lu par les autres
  assistants de code (ChatGPT, Codex…).
- **[CHARTE.md](CHARTE.md)** - à quoi ressemble une page et où elle se range.

Le dossier `garde-fous/` contient des tests qui échouent quand une de ces
règles est cassée (une rubrique de plus dans l'en-tête, une dépendance
nouvelle, une couleur hors charte…). Leur message dit quoi faire. On ne les
modifie pas pour les faire passer.

```bash
npm run verifier                                          # tout ce qu'il faut avant de proposer
node tests/integration/drawings-http.mjs                  # parcours complets, après compilation
node --test src/lib/jeux/mythology-rts/tests/*.test.js    # le jeu de stratégie, à part
```

Les jeux sont des applications JavaScript autonomes, exclues du contrôle
TypeScript/Svelte du site : le jeu de stratégie a sa propre suite de tests.

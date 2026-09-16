# Site du groupe d'action LFI Dijon

Site d'information d'un groupe militant local : publication d'articles et de
actualités par des administrateurs, commentaires anonymes modérés.

Le site est une cible politique. Les choix techniques privilégient
systématiquement la robustesse et la lisibilité sur la sophistication.

## Commandes

```bash
npm run dev      # développement sur http://localhost:5173
npm run check    # vérification TypeScript + Svelte — À LANCER APRÈS CHAQUE MODIFICATION
npm run build    # compilation de production
```

Il n'y a pas de suite de tests automatisés : `npm run check` et une
vérification manuelle dans le navigateur tiennent ce rôle.

## Architecture

SvelteKit 2 (Svelte 5, runes) + SQLite + Tailwind 4. Un seul processus Node,
aucun service externe, aucune dépendance native.

| Chemin | Rôle |
| --- | --- |
| `src/lib/server/db.ts` | Connexion SQLite et migrations |
| `src/lib/server/auth.ts` | Comptes, sessions, connexion, journal d'audit |
| `src/lib/server/crypto.ts` | Mots de passe, HMAC, chiffrement au repos |
| `src/lib/server/totp.ts` | Double authentification (RFC 6238) |
| `src/lib/server/content.ts` | Requêtes sur les publications et commentaires |
| `src/lib/server/present.ts` | **Seul** point de passage base → navigateur |
| `src/lib/server/media.ts` | Envoi et diffusion des images |
| `src/lib/server/captcha.ts` | Anti-spam par preuve de travail |
| `src/lib/components/Logo.svelte` | Le phi officiel, en dégradé ou en monochrome |
| `src/lib/components/BandeauApplication.svelte` | Invitation à installer Action populaire |
| `src/lib/components/Encart.svelte` | Le gabarit unique des encarts d'appel |
| `src/hooks.server.ts` | En-têtes de sécurité, session, garde `/admin` |
| `src/routes/[rubrique=rubrique]/` | Pages publiques `/articles`, `/actualites`, `/revue-de-presse` et la fiche d'un apéro |
| `src/routes/aperos/` | Page publique `/aperos` : prochain apéro et archive des thèmes |
| `src/routes/bibliotheque/` | Page publique `/bibliotheque` : sources approuvées et jeux |
| `src/lib/boite-a-outils/` + `src/routes/boite-a-outils/` | Page publique `/boite-a-outils` : les outils interactifs de vulgarisation (voir plus bas) |
| `src/lib/jeux/` + `src/routes/jeux/` | Les jeux de la bibliothèque, servis tels quels (voir plus bas) |
| `src/lib/fichiers-embarques.ts` | Sert les fichiers des jeux et des modules, avec leur CSP |
| `src/routes/admin/(interne)/` | Pages d'administration (session obligatoire) |

Les dépendances runtime se comptent sur une main : `markdown-it` et `qrcode`.
**Ne pas en ajouter sans nécessité** : chaque dépendance est une porte d'entrée
possible et une mise à jour à suivre.

## Conventions

- **Tout est en français** : noms de routes, de variables, de champs de
  formulaire, commentaires, messages d'erreur. Les personnes qui reprendront ce
  code sont des militants, pas des développeurs professionnels.
- Les modules de `src/lib/server/` s'importent entre eux **avec l'extension
  `.ts`** (`from './db.ts'`). C'est volontaire : ils tournent ainsi sous Node
  seul, sans Vite, ce qui permet d'écrire un script de maintenance qui réutilise
  exactement le code du site :
  ```bash
  node --experimental-strip-types -e "
    const { db } = await import('./src/lib/server/db.ts');
    console.log(db().prepare('select count(*) as n from comments').get());
  "
  ```
- `db()` est une **fonction**, pas un objet : la base s'ouvre à la première
  requête. Aucun module ne doit avoir d'effet de bord à l'import, sinon la
  compilation crée des fichiers ou réclame les secrets de production.
- Les dates sont stockées en ISO/UTC et mises en forme par `src/lib/format.ts`.

## Règles de sécurité à ne jamais casser

Ces points ne sont pas des préférences de style. Les modifier réintroduit une
faille connue.

1. **`markdown.ts` garde `html: false`.** Le HTML brut dans un article n'est
   jamais interprété. Un compte administrateur compromis ne peut donc pas
   injecter de script dans les pages.
2. **La CSP de `vite.config.ts` reste en `default-src 'none'`.** Ne jamais
   ajouter `'unsafe-inline'` à `script-src`, ni de domaine externe. Pas de
   polices Google, pas de CDN, pas d'outil de mesure d'audience.
3. **Aucune adresse IP en clair en base.** On stocke `hmac('ip', adresse)`.
   Cela suffit pour limiter le spam et bloquer quelqu'un, sans conserver de
   donnée personnelle exploitable en cas de fuite.
4. **`present.ts` filtre ce qui sort.** Ne jamais renvoyer une ligne SQL brute
   depuis un `load` : `ip_hash` et `user_agent` se retrouveraient dans le HTML
   public.
5. **Le type des images est déterminé par leurs premiers octets**, jamais par
   l'extension ni par l'en-tête envoyé par le navigateur. **Le SVG reste
   refusé à l'envoi** : c'est du XML qui peut contenir du JavaScript.
   Un SVG écrit dans le code (le logo, le favicon) est un cas différent : il
   vient de nous, il a été relu, il ne transite par aucun formulaire. La règle
   porte sur les fichiers venant de l'extérieur, pas sur les fichiers du projet.
6. **La double authentification reste obligatoire** (`+layout.server.ts` de
   `admin/(interne)` redirige tant qu'elle n'est pas activée).
7. **Les secrets TOTP sont chiffrés en base** avec `SECRET_KEY`. Une fuite du
   seul fichier SQLite ne permet pas de générer les codes.
8. **Les messages d'erreur de connexion sont identiques** quelle que soit la
   cause : ne jamais distinguer « identifiant inconnu » de « mot de passe
   incorrect ».
9. **Toute action destructrice passe par `audit()`.** Savoir qui a supprimé
   quoi est ce qui permet de comprendre après coup si un compte a été
   compromis.

## Modifier le schéma de la base

Ajouter une entrée **à la fin** du tableau `MIGRATIONS` dans `db.ts`. Ne jamais
modifier une migration déjà partie en production : elles ne s'exécutent qu'une
fois, le numéro appliqué étant conservé dans `pragma user_version`.

## Direction artistique

Moderne et sobre, pas « affiche de campagne ». Concrètement :

- Les surfaces fortes (`.fond-degrade`) sont un violet profond éclairé par deux
  lueurs radiales, l'une rouge, l'autre violette — pas le dégradé diagonal du
  logo en aplat. Le dégradé pur ne sert qu'en filet fin (`.filet-degrade`).
- **Chaque type de publication a sa couleur**, prise aux trois couleurs du
  logo : violet pour les articles, rouge pour les actualités, pourpre pour les
  apéros (`COULEUR_KIND` et `FOND_KIND` dans `format.ts`). Elle sert aux
  étiquettes des listes et aux surfaces du carrousel : `.fond-degrade`,
  `.fond-actu`, `.fond-apero`, construites pareil (fond profond, deux lueurs).
  Quand la publication a une image de couverture, la diapositive l'affiche en
  fond, teintée par la surface, pour qu'elle habille sans gêner la lecture.
- `.titre-affiche` est très gras, serré, **en casse normale** : ni italique ni
  majuscules.
- Boutons en pilule (`rounded-full`), aucun filigrane décoratif, le logo en
  couleur sur fond blanc dans l'en-tête.
- **Le fond clair n'est pas un blanc pur** (`--color-surface`, un lavande très
  clair) et le texte n'est pas un noir pur : le contraste reste très large mais
  la page n'éblouit pas et ne paraît pas vide. Trois niveaux, du plus foncé au
  plus clair : `--color-surface` est la page, `--color-carte` est ce qui se pose
  dessus (cartes, en-tête, menu déroulant, champs de saisie), `--color-surface-alt`
  est ce qui s'y creuse (étiquettes, encadrés discrets). Cette hiérarchie donne
  le relief sans une seule ombre portée — en thème sombre aussi, où la carte est
  plus claire que la page. Un panneau posé sur la page prend donc `bg-carte`,
  jamais `bg-surface`, sinon il disparaît dans le fond.
- `--color-line` est le filet décoratif ; `--color-line-forte`
  sert aux contours qu'on manipule (champs, boutons secondaires, pastilles),
  pour tenir le contraste de 3 pour 1 exigé sur les commandes.
- **Toutes les pages ont la même en-tête** : un surlignage en petites capitales
  dans la couleur de la rubrique, le titre en `.titre-affiche`, un chapô, et un
  filet `border-b border-line pb-6` qui la sépare du contenu. Une page sans ce
  filet se voit tout de suite.
- **Le texte posé sur un fond violet passe par `text-sur-brand`**, jamais
  `text-white` : en thème sombre le violet devient un lavande clair et le
  texte doit devenir sombre. La classe `.bouton` le fait déjà.
- **Le visiteur choisit son affichage** (clair, sombre, automatique) dans le
  pied de page. C'est un formulaire ordinaire vers `/theme`, qui pose un
  cookie ; `hooks.server.ts` écrit ensuite `data-theme` sur `<html>`. Aucun
  script en ligne, donc rien à assouplir dans la CSP, et pas de page qui
  s'affiche en clair avant de basculer. Les jetons sombres d'`app.css` sont
  écrits deux fois, pour le cas « automatique » et pour le cas « choisi ».
- Les couleurs du logo officiel restent la référence de la palette (`app.css`),
  mais la couleur principale des textes et liens est le violet, le rouge n'est
  qu'un accent.

## Les quatre types de publication

Une seule table `publications`, distinguée par la colonne `kind` :

- **`article`** — analyses, comptes rendus, prises de position. Classés du plus
  récent au plus ancien.
- **`actu`** — actualités : annonces de rendez-vous, mobilisations, réactions à
  chaud. Elles ont une colonne `event_at` facultative (date de l'action, au
  format `AAAA-MM-JJ`).
- **`apero`** — apéros thématiques (voir plus bas). `event_at` y est
  obligatoire : c'est la date de la soirée.
- **`revue`** — revues de presse : ce qu'on a lu ailleurs, rassemblé et
  commenté. C'est un article ordinaire du point de vue de la base ; seuls sa
  rubrique (`/revue-de-presse`), son étiquette et l'encart qui y mène le
  distinguent. Les liens vont dans le corps du texte, chacun avec sa source et
  ce que le groupe en retient.

Ajouter un type demande de toucher, dans cet ordre : la contrainte `check` de
`publications` (une migration qui reconstruit la table, voir la 007), `Kind`
dans `rubriques.ts` et `content.ts`, les quatre tables de `rubriques.ts`, le
`match` de `src/params/rubrique.ts`, `LIBELLE_KIND`, `COULEUR_KIND` et
`FOND_KIND` de `format.ts`, la validation de `formulaires.ts`, le menu du
formulaire de publication, le filtre de l'administration et `PAGES_FIXES` du
plan du site. Le flux RSS et les cartes suivent tout seuls.

La revue de presse **n'est pas dans l'en-tête de bureau** : une cinquième
rubrique le ferait déborder sur les écrans moyens (même raison que la boîte à
outils). On y accède par le pied de page, par le menu mobile et par l'encart en
tête de la liste des articles.

Le tri des actualités passe par `listPublished({ ordre: 'agenda' })` : les
actions dont la date n'est pas passée remontent en tête, de la plus proche à la
plus lointaine, puis viennent les autres par date de publication. La comparaison
se fait en SQL sur des chaînes `AAAA-MM-JJ` face à `date('now')` — c'est exact et
sans piège de fuseau horaire.

Une actualité sans `event_at` se comporte comme une simple brève d'information.

## Les apéros thématiques

Un lundi sur deux, le groupe se retrouve dans un bar autour d'un thème choisi à
l'avance, puis publie un résumé des échanges. Sur le site :

- **Un apéro = une seule publication** de type `apero`, le thème en titre, la
  date de la soirée dans `event_at`. Avant la soirée, la fiche est l'annonce ;
  après, on rouvre la même fiche et on écrit le résumé dans le corps du texte.
  L'adresse partagée avant reste valable, pas de doublon. Tant que le corps est
  vide, la fiche et la liste affichent « résumé à venir ».
- **`/aperos`** (`src/routes/aperos/`) a sa propre page plutôt que de passer
  par la route générique de rubrique : le prochain apéro est mis en avant, les
  suivants listés, puis les précédents forment l'archive des thèmes. Cette page
  fixe l'emporte sur `[rubrique=rubrique]` ; seule la fiche d'un apéro
  (`/aperos/mon-theme`) passe par la route générique, dont le `match` accepte
  `aperos`.
- Le tri est `listPublished({ ordre: 'archives' })` : à venir d'abord par date
  croissante, puis les passés **par date de la soirée** décroissante (et non
  par date de publication, puisque la fiche est publiée avant et complétée
  après).
- **Le cadre habituel** (rythme, heure, lieu, adresse, texte de présentation)
  est dans les réglages (`apero_*`), pas dans le code : changer de bar ne doit
  pas demander de redéploiement. Il est exposé à toutes les pages par
  `+layout.server.ts` sous `data.apero`.
- Le prochain apéro ouvre le carrousel d'accueil (`prochainApero` dans
  `src/routes/+page.server.ts`), sur la surface pourpre `.fond-apero`. Il est
  aussi dans le flux RSS et dans le plan du site.
- **Pas de calcul automatique des dates** tous les quinze jours : un apéro
  sauté ou déplacé casserait la mécanique. Créer une fiche par apéro prend une
  minute et laisse la main aux humains.

### Le dossier partagé d'un apéro

Chaque fiche d'apéro porte une liste de **sources** (table `sources`) : un
livre, une vidéo, un podcast, un article, un site… que n'importe quel visiteur
peut proposer depuis la fiche, sous « Pour préparer la soirée ». C'est un
dossier collectif, volontairement peu formel : un titre obligatoire, un lien
facultatif (un livre n'en a pas), un mot pour dire pourquoi, un prénom si on
veut. Les textes du site le disent : rien d'obligatoire, on vient aussi sans
avoir rien lu.

- Même circuit que les commentaires (champ-piège, preuve de travail, quotas,
  empreinte d'IP pseudonymisée), mais **la relecture est systématique** pour
  les visiteurs, quel que soit le réglage de pré-modération : une liste de
  liens publiée sans regard humain est une invitation à l'hameçonnage. Un
  administrateur connecté publie directement, et l'action est tracée.
- **Le lien est vérifié à l'enregistrement** : seulement `http(s)://`, sinon
  un `javascript:…` s'exécuterait au clic. Le nom du site (« youtube.com »)
  est calculé dans `present.ts` et affiché à côté du titre.
- Relecture dans Administration → Sources des apéros (`admin/(interne)/sources`),
  copie de l'écran des commentaires. « Bloquer cette origine » rejette d'un
  coup les sources *et* les commentaires en attente de la même empreinte,
  depuis l'un ou l'autre écran.
- La suppression d'un apéro emporte ses sources (clé étrangère en cascade).

### La bibliothèque commune

Une source proposée depuis un apéro contient soit un lien, soit un PDF. Les PDF
sont limités à 50 Mo, identifiés par leur signature `%PDF-`, stockés sous un nom
aléatoire dans `data/bibliotheque/` et toujours soumis à modération. La personne
qui propose un PDF doit préciser la licence ou l'autorisation de republication.

La page `/bibliotheque` porte les **ressources** (les sources des apéros) et les
**jeux**, et s'ouvre sur un encart qui renvoie à la boîte à outils. Les outils
interactifs ont leur propre page : ils sont appelés à se multiplier, et faire
tourner un simulateur n'est pas la même chose que consulter un lien. Une version
antérieure les empilait ici, et la page devenait interminable.

**Les ressources sont en liste, pas en cartes** : une ressource est un lien, pas
un produit en vitrine, et la liste en montre quinze là où la grille en montrait
quatre. Les jeux, eux, sont en cartes.

Les cartes du site — outils comme jeux — **n'ont pas de bouton** : le lien du
titre est étendu à toute la carte par son `::after`. Un bouton sous chaque carte,
répété une dizaine de fois, n'ajoutait rien.

Attention si l'on habille un encart avec `.fond-degrade` : **ne pas le combiner
avec `.carte`**. `.carte` est déclarée après dans `app.css` et écrase le fond, ce
qui donne du texte blanc sur fond blanc. La surface porte déjà son fond et son
texte ; il ne lui manque que le rembourrage et l'arrondi.

Les ressources ont un champ de recherche qui filtre la liste **dans le
navigateur**, sur les données déjà chargées — titre, note, auteur, nom du site
et titre de l'apéro, plus le mot « pdf » pour les documents. La comparaison se
fait en minuscules et sans accents des deux côtés, sinon « economie » ne
trouverait pas « économie ». Le champ n'est affiché **que si le script est
actif** (motif `scriptActif`, comme dans le carrousel) : sans JavaScript, la
liste complète reste visible et aucun champ ne promet ce qu'il ne peut pas
faire.

Seuls les PDF approuvés sont accessibles au public dans `/bibliotheque`. Une
session d'administration peut ouvrir un PDF en attente pour le relire. Rejeter,
supprimer ou bloquer l'origine d'une proposition supprime également le fichier ;
la suppression d'un apéro nettoie les PDF de ses sources. Le serveur accepte des
requêtes de 60 Mo afin de laisser une marge au formulaire, mais le contrôle
applicatif reste fixé à 50 Mo.

## Le carrousel d'accueil

`src/lib/components/CarrouselAccueil.svelte`. Cinq sortes de diapositives,
dans cet ordre : le prochain apéro thématique (s'il est annoncé, sur la surface
pourpre `.fond-apero`), l'identité du groupe, les prochaines actions (les
actualités dont la date n'est pas passée, trois au plus, alimentées
automatiquement), les ressources (bibliothèque et boîte à outils, deux pages
absentes de l'en-tête de bureau), et la bulle Action populaire. Les deux
dernières sont des `Encart` en mode `hauteurPleine`.

La diapositive des ressources vient **après** les actions et non juste après
l'identité : les deux sont sur la surface violette, et deux diapositives de la
même couleur qui se suivent se confondent. L'apéro passe devant l'identité
parce que c'est le rendez-vous récurrent, le plus concret pour un visiteur, et
qu'il change toutes les deux semaines : l'accueil a toujours l'air vivant.

Le défilement repose sur `scroll-snap` du navigateur, pas sur du JavaScript :
sans script, on fait glisser au doigt et tout fonctionne. Le JavaScript n'ajoute
que les flèches, les pastilles et leur synchronisation.

Deux règles à ne pas casser :

- **Pas de défilement automatique.** Une diapositive qui bouge seule fait perdre
  sa place à qui lit lentement, gêne les lecteurs d'écran et provoque des clics
  involontaires sur mobile.
- **Une diapositive fait exactement la largeur de la piste**, calée à gauche
  (`snap-start`, sans `gap`). Avec un espacement ou un calage centré, la position
  d'arrêt devient ambiguë et le navigateur ouvre la page sur la mauvaise
  diapositive — c'est arrivé pendant le développement.
- **`w-full` et non `min-w-full` sur la diapositive.** `min-w-full` n'impose
  qu'une largeur *minimale* : combinée à `shrink-0`, la diapositive s'élargit
  jusqu'à la largeur de son contenu (le titre sur une seule ligne) et déborde de
  l'écran sur mobile. Le défaut est invisible sur grand écran, où le contenu tient
  déjà dans la largeur disponible.

## Le bandeau Action populaire

Affiché en tête de la liste des actualités et au bas de chaque actualité — pas
ailleurs : c'est là que le visiteur cherche les prochains rendez-vous, donc le
moment où proposer l'application a du sens. Pour l'étendre à tout le site,
déplacer le composant dans `src/routes/+layout.svelte`, juste avant le
`<footer>`.

C'est un `Encart` ordinaire, au même gabarit que ceux de la bibliothèque, des
articles et de la revue de presse — mais il porte les couleurs de l'application
(jaune `#f0e80d`, bleu nuit `#0b0b33`) et non celles du site, écrites en dur
plutôt que prises dans les jetons : elles ne doivent bouger ni avec le thème
sombre, ni si l'on retouche la palette du site. Ce contraste avec le reste de la page est voulu — c'est ce qui
fait remarquer le bandeau.

Les adresses des magasins d'applications sont dans les réglages
(`app_url_android`, `app_url_ios`) et non dans le code : un lien de magasin
change, et le modifier ne doit pas demander de redéploiement. Elles sont filtrées
à l'enregistrement pour n'accepter que `https://` — sans ce filtre, un
`javascript:…` saisi dans le formulaire s'exécuterait au clic du visiteur.

Quand les deux champs sont vides, le bandeau renvoie vers actionpopulaire.fr
plutôt que d'afficher des boutons morts.

## Les encarts d'appel

`src/lib/components/Encart.svelte` est le gabarit **unique** des invitations
posées en tête d'une page : la boîte à outils depuis la bibliothèque, la
bibliothèque depuis la revue de presse, la revue de presse depuis les articles,
Action populaire depuis les actualités, et deux diapositives du carrousel. Ils
avaient chacun leur mise en page ; d'une page à l'autre, le visiteur ne
reconnaissait pas qu'il s'agissait de la même chose.

Un encart est une surface colorée (`.fond-degrade`, `.fond-actu`, `.fond-apero`,
ou un `style` en dur pour Action populaire), un surlignage en petites capitales,
un titre d'affiche, un paragraphe, et **au choix** un lien étendu à toute la
surface (`href`) ou des boutons (`actions`) — jamais les deux : le lien étendu
passerait derrière les boutons.

Ne jamais ajouter `.carte` à une surface : `.carte` est déclarée après dans
`app.css` et écraserait le fond, ce qui donne du texte blanc sur fond blanc. La
surface porte déjà son fond et son texte ; le composant ajoute le reste.

Un encart se place **en tête**, juste sous l'en-tête de la page, jamais en bas :
c'est une invitation, et une invitation placée après quinze publications et une
pagination n'est jamais vue. Il mène toujours vers une page, jamais vers une
publication précise, sinon il faut le modifier à chaque publication.

**Une page n'a qu'un seul pavé coloré.** La page des apéros en a déjà un en tête
(le prochain apéro) : son renvoi vers la bibliothèque est donc un simple lien en
fin de page, comme celui de la boîte à outils vers la bibliothèque. Deux
surfaces colorées sur la même page se font concurrence.

## Le logo

`src/lib/components/Logo.svelte` contient le phi officiel 2024, en SVG écrit
directement dans le composant. Deux variantes :

- `variante="couleur"` (par défaut) : le dégradé officiel, pour les fonds clairs
- `variante="mono"` : une seule couleur héritée du parent — mettre `text-white`
  sur un fond coloré

Il est en format portrait : le dimensionner par la hauteur (`h-10 w-auto`), pas
par un carré, sinon il est inutilement rétréci.

Le fichier d'origine récupéré sur Wikimedia pesait 61 Ko dont 52 Ko d'aperçu PNG
masqué et un tracé en `display:none`, restes du recadrage. Ils ont été retirés.
Les couleurs du dégradé de `app.css` sont celles, exactes, de ce fichier.

## Le formulaire de publication

`src/lib/components/FormulairePublication.svelte` offre une barre d'outils
(gras, titre, lien, image…) qui insère la syntaxe Markdown dans le texte, et
un bouton « Aperçu du texte ». L'aperçu est rendu **par le serveur** (action
`apercu` des pages nouvelle et modification, via `apercuPublication` dans
`formulaires.ts`) avec exactement le code des pages publiques : pas de second
moteur Markdown côté navigateur, donc pas d'écart entre l'aperçu et le site,
et `html: false` s'applique aussi à l'aperçu. Le formulaire est envoyé sans
rechargement (`use:enhance`, `reset: false`) pour que l'image choisie et le
texte tapé restent en place.

## L'en-tête

La navigation de bureau se limite à quatre rubriques de contenu (Actualités,
Articles, Apéros, Bibliothèque) et un bouton « Nous rejoindre ». Le logo ramène
à l'accueil ; « Le groupe » est dans le pied de page. Le menu mobile, lui,
liste tout (`liensMobile` dans `src/routes/+layout.svelte`). Ajouter un lien
dans l'en-tête de bureau le fait déborder sur les écrans moyens : préférer le
pied de page ou le menu mobile.

## Les jeux de la bibliothèque

La page `/bibliotheque` montre, sous les sources approuvées, quelques jeux faits
maison. Chaque jeu est un dossier de `src/lib/jeux/` (un `index.html`, un
`game.js`, un `style.css`, en JavaScript simple, sans dépendance), et une ligne
dans `src/lib/jeux.ts` (dossier, titre, description). Un dossier absent de cette
liste n'est pas servi.

Les fichiers sont lus **à la compilation** (`import.meta.glob` avec `?raw` dans
`src/lib/fichiers-embarques.ts`, partagé avec la boîte à outils) et
embarqués dans `build/` : rien à copier au déploiement. Ils ne passent pas par `static/` pour deux raisons : le serveur
de développement et celui de production n'y traitent pas `index.html` de la
même façon, et les fichiers de `static/` sont servis sans en-têtes de sécurité.
Ici, la page d'un jeu porte sa propre CSP, aussi fermée que celle du site.

- Un jeu vit à `/jeux/<dossier>/`, **avec la barre finale** (`trailingSlash =
  'always'` sur la route) : c'est ce qui permet à son `index.html` de charger
  `style.css` et `game.js` par des adresses relatives.
- Seuls `.html`, `.js` et `.css` sont servis. Pas d'images ni de sons pour
  l'instant : en ajouter demande d'étendre `TYPES` dans `fichiers-embarques.ts`.
- Le jeu s'ouvre en plein écran, sans l'habillage du site ; son `index.html`
  contient un lien « Retour à la bibliothèque ».
- Les `game.js` commencent par `// @ts-nocheck` : ce sont des scripts servis
  tels quels, `npm run check` ne les vérifie pas.
- En développement, ces fichiers sont servis avec `Cache-Control: no-store` ;
  en production, une heure de cache. Sans cela, le navigateur sert pendant une
  heure la version précédente d'un jeu qu'on vient de modifier, et on cherche
  longtemps une erreur qui n'existe plus.

## La boîte à outils

`/boite-a-outils` rassemble des outils interactifs de vulgarisation : le visiteur
entre son salaire ou son patrimoine, et voit ce que les chiffres publics disent
de sa situation. Même mécanique que les jeux, mais dans `src/lib/boite-a-outils/`
et listés dans `src/lib/boite-a-outils.ts`. Chaque outil vit à
`/boite-a-outils/<dossier>/` et son script s'appelle `outil.js` (et non
`game.js`).

C'est **une page à part entière**, pas une section de la bibliothèque : ils sont
appelés à devenir nombreux, et ce sont des outils d'argumentation pour la
campagne, pas des distractions. C'est aussi pourquoi ils ne sont pas servis sous
`/jeux/` : l'adresse d'une page se partage, et `/jeux/qui-paie-vraiment`
décrédibiliserait l'outil avant même qu'on l'ouvre.

La page **n'est pas dans l'en-tête de bureau** — une cinquième rubrique le ferait
déborder sur les écrans moyens. On y accède par le pied de page, par le menu
mobile (qui liste tout) et par l'encart en tête de la bibliothèque.

Les outils sont groupés en **rubriques** (`RUBRIQUES` dans `boite-a-outils.ts`,
chaque outil portant un champ `rubrique`). Elles existent pour que la page reste
lisible quand il y en aura vingt : une liste de vingt cartes ne se lit pas. Une
rubrique sans outil n'est pas affichée, on peut donc en déclarer une à l'avance.
Le `satisfies` sur `OUTILS` fait échouer `npm run check` si un outil pointe vers
une rubrique qui n'existe pas — une faute de frappe est attrapée à la
compilation, pas par un trou dans la page.

Quatre règles, dont la première n'est pas négociable :

1. **Chaque chiffre porte sa source et son année**, visibles en bas de la page,
   et chaque outil dit en toutes lettres ce que son calcul ne prend pas en
   compte. Le site est une cible politique : un chiffre invérifiable ou
   exagéré est une munition offerte aux adversaires, et une seule erreur
   trouvée discrédite tous les autres.
2. **Ne jamais « arrondir dans le bon sens ».** L'outil sur l'impôt applique
   la décote, qui annule l'impôt sur le revenu autour du SMIC : sans elle, il
   surestimait de moitié ce que paient les foyers modestes — précisément ceux
   à qui il s'adresse. Un chiffre gonflé en notre faveur est un chiffre faux.
3. **Rien de ce que saisit le visiteur ne quitte son navigateur.** Aucun envoi
   au serveur, aucun stockage : il n'y a donc aucune donnée à protéger, et la
   page peut le promettre sans mentir. La CSP interdit de toute façon tout
   appel réseau depuis ces pages.
4. Les `outil.js` commencent par `// @ts-nocheck`, comme les `game.js`.

Les chiffres actuels viennent de l'Insee (dépenses publiques par fonction 2024,
patrimoine des ménages 2024, dépenses pré-engagées, indice des prix à la
consommation, note de conjoncture), de la loi de finances pour 2026 (barème et
décote de l'impôt sur le revenu), de la loi de financement de la Sécurité
sociale pour 2026 (suspension de la réforme des retraites), de la Drees
(espérance de vie sans incapacité), du ministère de l'Intérieur (résultats des
législatives de 2024), de la DGFiP (résultats du contrôle fiscal), de l'IGEDD
(série Friggit sur les prix du logement), de l'observatoire des loyers de la
DHUP, de l'Institut des politiques publiques (note n° 92 sur l'imposition des
plus fortunés), du cabinet Proxinvest (rémunérations des dirigeants du CAC 40)
et du classement *Challenges* des fortunes françaises. **Ils vieillissent** : le
barème change chaque année, le SMIC, les prix du logement et les classements
aussi. Les valeurs sont regroupées en haut de chaque `outil.js`, sous un
commentaire qui le dit.

Deux sujets demandent une vigilance particulière :

- **Les retraites.** Trois états du droit se superposent depuis le 1er septembre
  2026 : celui d'avant 2023, la réforme de 2023, et sa suspension par la LFSS
  2026. `retraite/outil.js` porte les trois calendriers, génération par
  génération. La suspension est temporaire : les natifs de 1969 et après
  partent toujours à 64 ans.
- **Les chiffres contestés.** Quand une estimation ne fait pas consensus (le
  rendement de l'impôt plancher sur les très hauts patrimoines, le montant de la
  fraude fiscale), l'outil affiche la **fourchette** publiée, et non le chiffre
  qui nous arrange — quitte à laisser le visiteur choisir son hypothèse au
  curseur. De même, l'outil sur la proportionnelle affiche que ce scrutin aurait
  donné une cinquantaine de sièges de plus au RN en 2024. Un argument qui ne
  tient que lorsqu'il nous arrange n'est pas un argument, et une seule erreur
  trouvée discrédite les dix autres outils.

## Ajouter une page fixe

Créer `src/routes/mon-adresse/+page.svelte`, puis ajouter le lien dans la
navigation de `src/routes/+layout.svelte` et dans `PAGES_FIXES` de
`src/routes/sitemap.xml/+server.ts`.

## Le mode démonstration

`src/lib/server/demo.ts`, activé par `MODE_DEMO=1`. Sur une base vide, il crée
des contenus fictifs et un compte `demo` avec la 2FA déjà activée, puis la page
de connexion affiche les identifiants et le code du moment. L'administration
est donc ouverte à tout le monde : ce mode est réservé au site de test sur
Render (`render.yaml`, `DEMO.md`) et ne doit jamais être activé en production.
Les contenus fictifs sont dans le tableau `FICHES` de ce fichier ; les dates
d'action sont relatives au jour du démarrage, pour qu'il y ait toujours des
actions « à venir ».

## Déploiement

Voir `DEPLOIEMENT.md`. VPS français, Docker + Caddy, sauvegarde quotidienne par
`scripts/sauvegarde.sh`.

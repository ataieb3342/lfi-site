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

npm run outils:pages   # regénère la tête et le pied des pages d'outils (voir « La boîte à outils »)
```

Il n'y a pas de suite de tests automatisés : `npm run check` et une
vérification manuelle dans le navigateur tiennent ce rôle.

## Architecture

SvelteKit 2 (Svelte 5, runes) + SQLite + Tailwind 4. Un seul processus Node,
aucun service externe nécessaire au fonctionnement du serveur, aucune dépendance
native. Une fiche d’action peut toutefois afficher une carte Google Maps intégrée.

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
| `src/lib/components/Metadonnees.svelte` | Titre, description, adresse canonique et aperçus — sur **toutes** les pages publiques |
| `src/lib/donnees-structurees.ts` | Les fiches schema.org lues par Google (article, événement, organisation, fil d'Ariane) |
| `src/hooks.server.ts` | En-têtes de sécurité, session, garde `/admin` |
| `src/routes/[rubrique=rubrique]/` | Pages publiques `/articles`, `/actualites`, `/revue-de-presse` et la fiche d'un apéro |
| `src/routes/aperos/` | Page publique `/aperos` : prochain apéro et archive des thèmes |
| `src/routes/bibliotheque/` | Page publique `/bibliotheque` : sources approuvées et jeux |
| `src/lib/boite-a-outils/` + `src/routes/boite-a-outils/` | Page publique `/boite-a-outils` : les outils interactifs de vulgarisation (voir plus bas) |
| `src/lib/jeux/` + `src/routes/jeux/` | Page publique `/jeux` : les jeux faits maison, servis tels quels (voir plus bas) |
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
	 ajouter `'unsafe-inline'` à `script-src`. Pas de polices Google, pas de CDN,
	 pas d'outil de mesure d'audience. La seule exception externe autorisée est
	 `https://www.google.com` dans `frame-src`, pour les cartes Google Maps des
	 fiches d’action. Leur URL est validée côté serveur : aucun HTML libre n’est
	 interprété.
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
  étiquettes des listes et aux surfaces colorées : `.fond-degrade`,
  `.fond-actu`, `.fond-apero`, construites pareil (fond profond, deux lueurs).
  Quand la publication a une image de couverture, le bandeau du prochain apéro
  l'affiche en fond, teintée par la surface, pour qu'elle habille sans gêner la
  lecture.
- `.titre-affiche` est très gras, serré, **en casse normale** : ni italique ni
  majuscules.
- **Le rythme vertical suit une échelle de quatre valeurs, et pas d'autres.**
  Chaque page avait les siennes — `mt-8`, `mt-10`, `mt-12`, `mt-14`, `mt-16` —
  et l'ensemble était à la fois trop aéré et irrégulier : on ne retrouvait pas
  le même espacement d'une page à l'autre.

  | Usage | Classe |
  | --- | --- |
  | Rembourrage de `<main>` | `py-6` |
  | Sous l'en-tête d'une page | `pb-4` (voir ci-dessous) |
  | Entre deux sections de premier niveau | `mt-8` |
  | À l'intérieur d'une section | `mt-5` (ou `mt-6` pour un sous-bloc) |

  Le pied de page n'a **pas** de marge haute : le rembourrage bas de `<main>`
  fait l'écart, et le passage à une surface sombre marque la rupture à lui seul.
  Avant d'écrire une cinquième valeur, se demander si l'une des quatre ne
  conviendrait pas.

  Le principe qui revient partout : **deux marges ne s'additionnent jamais pour
  un même écart.** Quand un bloc porte déjà sa marge, celui d'à côté n'en met
  pas — c'est la raison du `main > :first-child` d'`app.css`, du `pt-6` (et non
  `py-6`) de la grille d'accueil au-dessus du bandeau Action populaire, et du
  pied de page sans marge.
- **Quand un bandeau suit l'en-tête, le filet passe dessous.** La surface
  colorée pose déjà la limite en haut : un trait par-dessus ferait une rayure.
  C'est en bas qu'il faut détacher le bandeau de la liste qui suit. Les listes
  de rubrique et la page des apéros n'ont donc pas de `border-b` sur leur
  `<header>`, mais un conteneur `border-b border-line pb-5` autour du bandeau.
  Les pages qui commencent par du texte gardent leur filet sous l'en-tête.

  Deux pièges. Le filet va sur un **conteneur**, jamais sur la surface colorée
  elle-même : elle est arrondie, la bordure s'y dessinerait par-dessus au lieu
  de faire un trait en dessous. Et sur les actualités, le bandeau Action
  populaire disparaît quand l'application est désactivée dans les réglages — le
  filet est donc conditionné par `aBandeau`, sans quoi la page afficherait un
  trait tout seul. L'accueil, lui, n'a pas de filet : son bandeau ouvre la page
  et le contenu qui suit a son propre en-tête.
- **Le premier bloc d'une page n'ajoute pas sa marge haute** à celle de
  `<main>`. C'est une règle d'`app.css` (`main > :first-child`) et non quelque
  chose à répéter page par page : sans elle, le bandeau de l'accueil cumulait
  `py-6` et `mt-6`, soit quarante-huit pixels de vide sous l'en-tête.
- **Un encart de page est une bande, pas un pavé** (`Encart.svelte`) : une
  centaine de pixels de haut, un surlignage, un titre de `text-base`, **une
  seule phrase** et de quoi cliquer. C'est une invitation posée en passant ; à
  250 pixels de haut, elle repoussait le contenu réel de la page sous la ligne
  de flottaison et se faisait sauter comme une publicité. Quand on en écrit un,
  le texte doit tenir sur une ligne à l'écran : trois lignes, c'est déjà trop.

  Le bandeau du prochain apéro (`BandeauApero.svelte`) suit le même gabarit
  sans passer par `Encart.svelte`, parce que son contenu vient d'une fiche :
  les retoucher ensemble, sinon l'écart se voit d'une page à l'autre.
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
rubrique le ferait déborder sur les écrans moyens. On y accède par le pied de
page, par le menu mobile et par l'encart en tête de la liste des articles.

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
- Le prochain apéro ouvre l'accueil, en bandeau (`prochainApero` dans
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

La page `/bibliotheque` porte **les ressources** — les sources approuvées des
apéros — et rien d'autre. Les **outils interactifs** (`/boite-a-outils`) et les
**jeux** (`/jeux`) ont chacun leur page : ils sont appelés à se multiplier, et
faire tourner un simulateur n'est pas la même chose que consulter un lien. Une
version antérieure empilait les trois sur la même page, qui devenait
interminable.

Les deux pages voisines sont atteintes par **deux cartes côte à côte en bas de
la bibliothèque**, sous « Aussi dans la bibliothèque ». En bas et non en tête :
on y arrive après avoir parcouru les ressources. C'est pour cela que la
pagination est courte — voir ci-dessous.

**Les ressources sont paginées**, huit par page (`PAR_PAGE` dans
`bibliotheque/+page.server.ts`). Le nombre est petit exprès : les deux cartes du
bas doivent rester visibles sans dérouler la page entière. Le numéro de page est
**borné aux pages qui existent**, pour que `?page=9` affiche la dernière plutôt
qu'une liste vide accompagnée d'un « aucune ressource » qui serait faux.

**La recherche se fait en SQL**, pas dans le navigateur (`clauseBibliotheque`
dans `content.ts`). C'est la pagination qui l'impose : une recherche côté
navigateur ne porterait que sur les huit lignes affichées, ce qui est pire que
pas de recherche du tout. Elle passe par l'adresse (`?q=`), donc elle fonctionne
sans JavaScript et un résultat se partage. Chaque mot doit apparaître quelque
part, six mots au plus. `lower()` de SQLite ignore les accents : « economie » ne
trouve pas « économie », et on s'en contente — corriger cela demanderait une
colonne normalisée et une migration.

**Les ressources sont en liste, pas en cartes** : une ressource est un lien, pas
un produit en vitrine, et la liste en montre quinze là où la grille en montrait
quatre. Les outils et les jeux, eux, sont en cartes.

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
actif** (motif `scriptActif`) : sans JavaScript, la
liste complète reste visible et aucun champ ne promet ce qu'il ne peut pas
faire.

Seuls les PDF approuvés sont accessibles au public dans `/bibliotheque`. Une
session d'administration peut ouvrir un PDF en attente pour le relire. Rejeter,
supprimer ou bloquer l'origine d'une proposition supprime également le fichier ;
la suppression d'un apéro nettoie les PDF de ses sources. Le serveur accepte des
requêtes de 60 Mo afin de laisser une marge au formulaire, mais le contrôle
applicatif reste fixé à 50 Mo.

## L'accueil

L'accueil s'ouvrait sur un **carrousel** de sept diapositives de 425 pixels :
un écran entier de surface colorée avant le premier article. Il a été retiré, et
`CarrouselAccueil.svelte` avec lui. La raison n'était pas seulement sa hauteur :
six diapositives sur sept répétaient ce qui se trouvait déjà ailleurs sur la même
page ou dans l'en-tête — l'identité du groupe est dans l'en-tête, le pied de page
et « Le groupe » ; les prochaines actions sont dans la colonne « Actualités » de
l'accueil, qui les remonte déjà en tête avec leur date en étiquette (tri
`agenda`) ; la bibliothèque est dans l'en-tête.

La page tient donc en quatre blocs, de haut en bas :

1. **Le prochain apéro**, en bandeau (`BandeauApero.svelte`, surface pourpre
   `.fond-apero`) : c'est la seule chose qui ne figure nulle part ailleurs sur
   cette page, il change toutes les deux semaines, et c'est le rendez-vous le
   plus concret pour quelqu'un qui découvre le groupe. Masqué s'il n'y a pas
   d'apéro annoncé.
2. **L'article à la une**, puis les articles récents.
3. **La colonne « Actualités »**, rendez-vous à venir en tête.
4. **Le bandeau Action populaire**, tout en bas — jamais en tête : on propose
   d'installer quelque chose à quelqu'un qui a lu la page, pas à quelqu'un qui
   arrive.

`BandeauApero.svelte` n'est pas construit sur `Encart.svelte` : celui-ci porte un
texte fixe, alors qu'ici la date, le lieu et l'image de couverture viennent de la
fiche de l'apéro. Les deux suivent en revanche **le même gabarit** — même
rembourrage, même taille de titre, même marge — pour qu'un visiteur ne voie
qu'une seule sorte de bandeau sur tout le site. Retoucher l'un sans l'autre se
remarque immédiatement.

Si l'on remet un jour un carrousel, se souvenir de ce qui l'avait rendu pénible :
il faut alors du `scroll-snap` et non du JavaScript (sans script, on doit pouvoir
faire glisser au doigt), **pas de défilement automatique** (une diapositive qui
bouge seule fait perdre sa place à qui lit lentement, gêne les lecteurs d'écran
et provoque des clics involontaires sur mobile), une diapositive exactement à la
largeur de la piste et calée à gauche (`snap-start`, sans `gap`, sinon le
navigateur ouvre la page sur la mauvaise diapositive), et `w-full` plutôt que
`min-w-full` (qui, avec `shrink-0`, laisse la diapositive s'élargir jusqu'à son
contenu et déborder sur mobile).

## Le bandeau Action populaire

Affiché en tête de la liste des actualités, au bas de chaque actualité et au bas
de l'accueil — pas ailleurs : c'est là que le visiteur cherche les prochains
rendez-vous, donc le moment où proposer l'application a du sens. Sur l'accueil il
est **tout en bas**, jamais en tête. Pour l'étendre à tout le site, déplacer le
composant dans `src/routes/+layout.svelte`, juste avant le `<footer>`.

C'est un `Encart` ordinaire, au même gabarit que ceux des articles et de la revue
de presse — mais il porte les couleurs de l'application
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
posées en tête d'une page : la bibliothèque depuis la revue de presse, la revue
de presse depuis les articles, Action populaire depuis les actualités et le bas
de l'accueil. Ils avaient chacun leur mise en page ; d'une page à l'autre, le
visiteur ne reconnaissait pas qu'il s'agissait de la même chose.

**Un encart annonce toujours une autre page.** Posé en tête d'une page pour
vanter une section de cette même page, il a le gabarit du bandeau Action
populaire : le visiteur le lit comme une publicité et le saute, et le contenu
réel de la page part sous la ligne de flottaison. C'est ce qui arrivait à la
boîte à outils annoncée depuis la bibliothèque, avant qu'elle n'y devienne une
section ordinaire.

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
fin de page. Deux surfaces colorées sur la même page se font concurrence.

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

## Les vidéos

Un paragraphe qui ne contient **que** le lien d'une vidéo YouTube devient un
bloc cliquable — règle `bloc_video` de `src/lib/server/markdown.ts` :

    https://youtu.be/cW1Yay_1XaQ                 → « Regarder la vidéo »
    [Le titre de la vidéo](https://youtu.be/…)   → « Le titre de la vidéo »

Il faut une ligne vide avant et après : c'est ce qui en fait un paragraphe à
lui seul. Un lien au fil d'une phrase, ou un lien en gras, reste un lien
ordinaire. C'est voulu : la liste des sources en fin d'article ne doit pas se
transformer en une pile de pavés.

**La vidéo n'est pas jouée dans la page, et ce n'est pas un oubli.** Une iframe
YouTube obligerait à inscrire un domaine de Google dans la CSP (règle n° 2 des
règles de sécurité), donc à annoncer à Google chaque visiteur d'un article
avant même qu'il ait cliqué — sur un site dont le pied de page promet de
n'utiliser aucun service tiers. Le bloc ne charge rien de l'extérieur : c'est
du texte et un triangle dessiné en SVG. La lecture se fait sur YouTube, après
un clic délibéré.

L'adresse du lien est **reconstruite** à partir des onze caractères de
l'identifiant validés par la regex, jamais recopiée telle quelle : rien de ce
qu'a écrit l'auteur ne se retrouve dans le `href`. C'est ce qui permet de
générer ce HTML sans rouvrir la porte que `html: false` ferme.

Pour ajouter une plateforme (PeerTube, Vimeo), étendre `VIDEO` et la
construction de l'URL dans le moteur de rendu. `linkify` doit d'abord avoir
reconnu l'adresse comme un lien, sans quoi la règle ne voit rien.

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
Articles, Apéros, Bibliothèque — qui couvre les outils, les lectures et les
jeux) et un bouton « Nous rejoindre ». Le logo ramène
à l'accueil ; « Le groupe » est dans le pied de page. Le menu mobile, lui,
liste tout (`liensMobile` dans `src/routes/+layout.svelte`). Ajouter un lien
dans l'en-tête de bureau le fait déborder sur les écrans moyens : préférer le
pied de page ou le menu mobile.

## Les jeux

`/jeux` montre quelques jeux faits maison. Chaque jeu est un dossier de
`src/lib/jeux/` (un `index.html`, un `game.js`, un `style.css`, en JavaScript
simple, sans dépendance), et une ligne dans `src/lib/jeux.ts` (dossier, titre,
description). Un dossier absent de cette liste n'est pas servi.

Même mécanique et même place dans le site que la boîte à outils : une page à
part, hors de l'en-tête de bureau, atteinte par la carte en bas de la
bibliothèque, par le pied de page et par le menu mobile.

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

La boîte à outils rassemble des outils interactifs de vulgarisation : le
visiteur entre son salaire ou son patrimoine, et voit ce que les chiffres publics
disent de sa situation. Même mécanique que les jeux, mais dans
`src/lib/boite-a-outils/` et listés dans `src/lib/boite-a-outils.ts`. Chaque
outil vit à `/boite-a-outils/<dossier>/` et son script s'appelle `outil.js` (et
non `game.js`).

C'est **une page à part entière**, pas une section de la bibliothèque : ils sont
appelés à devenir nombreux, et ce sont des outils d'argumentation pour la
campagne, pas des distractions. C'est aussi pourquoi ils ne sont pas servis sous
`/jeux/` : l'adresse d'une page se partage, et `/jeux/qui-paie-vraiment`
décrédibiliserait l'outil avant même qu'on l'ouvre.

### Le parcours

Les trois maillons — comment on entre, comment on choisit, ce qu'on fait ensuite
— ont été repris ensemble ; les traiter séparément avait produit un annuaire
sans entrée ni sortie.

- **On entre** par la carte en bas de la bibliothèque, par le pied de page ou
  par le menu mobile. La page n'est pas dans l'en-tête de bureau : une cinquième
  rubrique le ferait déborder sur les écrans moyens.
- **On choisit** : deux outils sont mis en avant sous « Pour commencer »
  (`enAvant: true` dans `OUTILS`, avec une `accroche` plus longue que la
  description). Onze cartes égales ne disent pas par où entrer. Ils sont
  choisis pour être les plus contre-intuitifs — un sur soi, un sur le pays — et
  `rubriquesGarnies()` les **retire de leur rubrique** : les revoir dix
  centimètres plus bas se lit comme un bug.
- **On ressort** par le pied de page de l'outil (voir plus bas). Avant, la page
  s'arrêtait sur ses sources : on avait fait le calcul, on était convaincu, et
  on fermait l'onglet.

Les outils sont groupés en **rubriques** (`RUBRIQUES` dans `boite-a-outils.ts`,
chaque outil portant un champ `rubrique`). Elles sont **deux** et ne doivent pas
se multiplier : la première version en comptait cinq pour onze outils, dont
trois n'avaient qu'un seul outil, si bien que la page affichait plus de titres de
rubrique que de contenu. Le partage retenu est celui que fait le visiteur
lui-même — « est-ce que ça parle de moi, ou du pays ? ». Une rubrique sans outil
n'est pas affichée, on peut donc en déclarer une à l'avance. Le `satisfies` sur
`OUTILS` fait échouer `npm run check` si un outil pointe vers une rubrique qui
n'existe pas — une faute de frappe est attrapée à la compilation, pas par un trou
dans la page.

### La tête et le pied de page d'un outil

Sous les sources, chaque outil porte un `<nav class="suite">` : une phrase qui
invite à se servir du calcul, **deux outils pour enchaîner**, et une ligne de
liens vers la bibliothèque, les apéros et « Nous rejoindre ». Dans son `<head>`,
il porte son titre et sa description pour les moteurs de recherche.

Ces pages sont du HTML statique servi tel quel : elles ne peuvent rien calculer
à l'affichage et n'ont pas accès à `boite-a-outils.ts`. Les deux blocs sont donc
**écrits par un script**, chacun entre ses marqueurs (`<!-- tête -->` et
`<!-- pied -->`) :

```bash
npm run outils:pages   # après tout ajout, retrait ou renommage d'un outil
```

Il est idempotent et ne touche à rien d'autre dans le fichier. Les outils
proposés viennent d'`outilsSuivants()`, qui tourne sur la rubrique : après le
dernier on revient au premier, donc personne ne tombe sur une fin. **Ne pas
modifier une tête ni un pied à la main** : la prochaine exécution du script les
écrasera.

La description reprise dans la tête est l'`accroche` de l'outil quand elle
existe, sa `description` sinon. C'est une raison de plus d'écrire une accroche
pour chaque outil et pas seulement pour les deux mis en avant : ces pages sont
celles que quelqu'un qui ne connaît pas le groupe a le plus de chances de
trouver — on ne cherche pas « LFI Dijon », on cherche « combien d'impôts je
paie ». Le nom du site y est écrit en dur, repris de `DEFAULTS` : le renommer
dans l'administration demande de relancer le script.

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

Chaque outil a **sa** couleur (`--accent` et `--accent-fort` de son `style.css`),
qui habille ses cartes de résultat et ses graphiques. Le surlignage de l'en-tête,
lui, est l'étiquette de la rubrique : il dit « Comprendre et argumenter » et
porte le violet (`--rubrique`) sur tous les outils, comme la page qui y mène. Un
outil dont le surlignage change de couleur ou de texte n'a plus l'air de venir
de la même rubrique que la page qu'on vient de quitter.

Le reste de la palette (`--surface`, `--carte`, `--surface-alt`, `--ink`…) est
recopié d'`app.css` dans chaque `style.css` : **la retoucher sur le site oblige
à la répercuter ici**, sinon passer du site à un outil fait un saut de couleur.

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

## Le référencement

Le site n'a aucun outil de mesure d'audience et n'en aura pas (règle n° 2 des
règles de sécurité). Tout ce qui suit se joue donc dans le HTML, sans script et
sans service tiers.

**Toute page publique passe par `Metadonnees.svelte`.** Une page qui écrit son
propre `<svelte:head>` perd l'adresse canonique et les aperçus, et personne ne
s'en aperçoit avant des mois. Le composant écrit, en une fois : le titre, la
description, `rel="canonical"`, les balises Open Graph, et les données
structurées qu'on lui passe.

- **L'adresse canonique est la balise la plus importante.** Elle dit « cette
  page, c'est cette adresse-là ». Sans elle, `/articles`, `/articles?page=1` et
  la même page atteinte depuis un lien portant une étiquette de campagne
  comptent pour trois pages qui se font concurrence, et aucune ne ressort.
- **Une page paginée se désigne elle-même**, avec son numéro dans le titre et
  dans son adresse canonique. Renvoyer toutes les pages vers la première ferait
  sortir de l'index les publications anciennes, qui ne sont listées nulle part
  ailleurs.
- **Les pages de résultats de recherche portent `noindex, follow`** : il y en a
  autant que de mots qu'on peut taper, elles ne contiennent rien d'original, et
  elles diluent la page qu'elles filtrent. `follow` est essentiel : sans lui,
  les ressources listées deviendraient invisibles.
- **Ce qu'on tient hors de l'index porte un `noindex`, on ne l'interdit pas
  dans `robots.txt`.** Une adresse interdite au robot n'est jamais lue, donc son
  `noindex` n'est jamais vu, et une adresse déjà connue de Google y reste
  indéfiniment. Seule l'administration est interdite dans `robots.txt`.
- **`/media` n'est pas interdit au robot.** Ce sont les images des
  publications, celles-là mêmes qu'on annonce en aperçu quand un lien est
  partagé : interdites, la vignette d'un partage est vide et le lien est moins
  cliqué.

### Les données structurées

`donnees-structurees.ts` construit les fiches schema.org que le composant écrit
dans la page, au format JSON-LD. C'est un **bloc de données, pas un script** :
le navigateur ne l'exécute pas, et la politique de sécurité n'a donc rien à
assouplir.

- Un **apéro est un `Event`**, pas un article : une date, une heure, l'adresse
  du bar. C'est ce qui permet à Google de l'afficher comme un rendez-vous, et
  c'est le seul endroit du site où l'adresse physique du groupe est déclarée
  au moteur.
- L'accueil porte l'**`Organization`**, avec `areaServed: Dijon` : c'est ce qui
  rattache le site aux recherches locales.
- Toute page qui se réfère à l'organisation (`publisher`, `organizer`) doit
  aussi porter le bloc `editeur()`. Un renvoi par identifiant n'est résolu qu'à
  l'intérieur d'une même page : sans ce bloc, l'article pointerait dans le vide
  et le moteur écarterait la fiche entière.
- **Une fiche ne doit jamais annoncer autre chose que ce que la page affiche.**
  C'est traité comme une tromperie, et cela fait perdre le bénéfice de
  l'ensemble — pas seulement de la page fautive.

### Ce que le code ne peut pas faire

Ces quatre points-là ne sont pas dans le dépôt et doivent être faits à la main,
une fois :

1. Déclarer le site dans la **Search Console** de Google et y envoyer
   `/sitemap.xml`. Sans cela, l'indexation d'un site neuf prend des semaines.
2. Créer une **fiche d'établissement Google** pour le groupe. C'est le premier
   levier des recherches locales, loin devant tout le reste.
3. Obtenir des **liens entrants** : annuaire des groupes d'action sur
   `actionpopulaire.fr`, sites des groupes voisins, presse locale. C'est le
   facteur que Google pondère le plus, et le seul qui ne se code pas.
4. **Publier régulièrement.** Un site qui ne bouge pas est recrawlé de moins en
   moins souvent.

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

La fiche portant `illustree: true` reçoit une **image de couverture**, encodée
en base64 dans `demo-image.ts`. Elle est dans le code et non dans
`data/uploads/` parce que ce dossier est le stockage du site en fonctionnement :
il est dans `.gitignore` et n'existe pas au démarrage d'un conteneur neuf. Sur
Render, la démo repart d'une base vide à chaque déploiement — sans cette copie,
l'article à la une y serait sans illustration. Même raisonnement que pour les
jeux et les outils : ce qui doit survivre au déploiement vit dans le dépôt, pas
dans les données. **Le vrai site n'a rien à faire ici** : il reçoit ses images
par Administration → Médias.

## Déploiement

Voir `DEPLOIEMENT.md`. VPS français, Docker + Caddy, sauvegarde quotidienne par
`scripts/sauvegarde.sh`.

**Pousser sur `main` met le site à jour.** `scripts/deployer.sh` tourne toutes
les cinq minutes sur le serveur : si `main` a bougé, il sauvegarde, récupère le
code et redémarre ; sinon il ne fait rien. C'est le serveur qui interroge
GitHub, et non l'inverse — aucune clé d'accès à la machine de production ne
traîne donc chez un tiers.

Deux conséquences à garder en tête. Un commit poussé part **en production dans
les cinq minutes**, sans relecture : `npm run check` avant de pousser n'est pas
une politesse. Et si la compilation échoue, les conteneurs en place continuent
de servir la version précédente — le site ne tombe pas, il cesse simplement de
se mettre à jour, ce que seul `/var/log/deploiement-site.log` dira.

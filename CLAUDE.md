# Site du groupe d'action LFI Dijon

Site d'information d'un groupe militant local : publication d'articles et de
actualités par des administrateurs, commentaires anonymes modérés.

**Le site en ligne : https://lfi-dijon.fr/** (production, mise à jour par
`main`, voir « Déploiement »). Pour savoir ce qui est réellement publié - les
médias recommandés, les rendez-vous, les articles -, regarder ce site plutôt
que la base de démonstration : le dépôt ne contient que les données de départ.

Le site est une cible politique. Les choix techniques privilégient
systématiquement la robustesse et la lisibilité sur la sophistication.

## Commandes

```bash
npm run dev      # développement sur http://localhost:5173
npm run check    # vérification TypeScript + Svelte - À LANCER APRÈS CHAQUE MODIFICATION
npm run build    # compilation de production

node --test src/lib/jeux/mythology-rts/tests/*.test.js  # tests du jeu de stratégie

npm run outils:pages   # regénère la tête et le pied des pages d'outils (voir « La boîte à outils »)
```

Le site Svelte est contrôlé par `npm run check` et `npm run build`. Les jeux
autonomes ne passent pas dans le contrôle TypeScript/Svelte ; le jeu de
stratégie possède une suite dédiée avec `node --test`. Une vérification
manuelle dans le navigateur reste nécessaire pour les parcours éditoriaux.

## Architecture

SvelteKit 2 (Svelte 5, runes) + SQLite + Tailwind 4. Un seul processus Node,
aucun service externe nécessaire au fonctionnement du serveur, aucune dépendance
native.

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
| `src/lib/server/limiteur.ts` | Écarte les adresses qui envoient trop de requêtes (voir « Les vagues de requêtes ») |
| `src/lib/server/frequentation.ts` | Compte les visites et le trafic, sans cookie ni adresse IP (voir « La fréquentation ») |
| `src/lib/components/Logo.svelte` | Le phi officiel, en dégradé ou en monochrome |
| `src/lib/components/BandeauApplication.svelte` | Invitation à installer Action populaire |
| `src/lib/components/Encart.svelte` | Le gabarit unique des encarts d'appel |
| `src/lib/components/Metadonnees.svelte` | Titre, description, adresse canonique et aperçus - sur **toutes** les pages publiques |
| `src/lib/components/Partage.svelte` | Les boutons de partage en bas de chaque publication (voir « Le partage ») |
| `src/lib/components/Histogramme.svelte` | Le graphique en colonnes de l'administration |
| `src/lib/donnees-structurees.ts` | Les fiches schema.org lues par Google (article, événement, organisation, fil d'Ariane) |
| `src/hooks.server.ts` | En-têtes de sécurité, session, garde `/admin`, limite par adresse, comptage des visites |
| `src/routes/[rubrique=rubrique]/` | La liste des articles (`/articles`), les fiches de toutes les publications, et les redirections des anciennes adresses |
| `src/routes/agenda/` | Page publique `/agenda` : les prochains rendez-vous puis le calendrier du mois |
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
	 pas d'outil de mesure d'audience extérieur ni d’iframe externe. Le site
	 compte lui-même ses visites, côté serveur et sans script (voir « La
	 fréquentation »).
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
  lueurs radiales, l'une rouge, l'autre violette - pas le dégradé diagonal du
  logo en aplat. Le dégradé pur ne sert qu'en filet fin (`.filet-degrade`).
- **Chaque type de publication a sa couleur**, prise aux trois couleurs du
  logo : violet pour les articles, rouge pour les événements, pourpre pour les
  apéros (`COULEUR_KIND` et `FOND_KIND` dans `format.ts`). Elle sert aux
  étiquettes des listes et aux surfaces colorées : `.fond-degrade`,
  `.fond-actu`, `.fond-apero`, construites pareil (fond profond, deux lueurs).
  Quand la publication a une image de couverture, le bandeau du prochain apéro
  l'affiche en fond, teintée par la surface, pour qu'elle habille sans gêner la
  lecture.
- `.titre-affiche` est très gras, serré, **en casse normale** : ni italique ni
  majuscules.
- **Le rythme vertical suit une échelle de quatre valeurs, et pas d'autres.**
  Chaque page avait les siennes - `mt-8`, `mt-10`, `mt-12`, `mt-14`, `mt-16` -
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
  pas - c'est la raison du `main > :first-child` d'`app.css`, du `pt-6` (et non
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
  de faire un trait en dessous. Et sur l'agenda, le bandeau Action
  populaire disparaît quand l'application est désactivée dans les réglages - le
  filet est donc conditionné par `data.app.actif`, sans quoi la page afficherait
  un trait tout seul. L'accueil, lui, n'a pas de filet : son bandeau ouvre la page
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
  le relief sans une seule ombre portée - en thème sombre aussi, où la carte est
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

## Deux familles, quatre types de publication

Le visiteur se pose deux questions, et le site range tout d'après elles :
**« où est-ce que je peux venir ? »** (l'agenda) et **« qu'est-ce que vous
faites, qu'est-ce que vous pensez ? »** (les articles). Celui qui publie se pose
la même : « est-ce que les gens peuvent venir ? » - oui, c'est un rendez-vous ;
non, c'est un article.

Une seule table `publications`, distinguée par la colonne `kind` :

| Famille | Type affiché | `kind` | `event_category` | Où il apparaît |
| --- | --- | --- | --- | --- |
| Articles | Article | `article` | `autre` | `/articles` |
| Agenda | Événement | `actu` | `reunion` | `/agenda`, fiche sous `/actualites/…` |
| Agenda | Formation | `actu` | `formation` | `/agenda`, fiche sous `/actualites/…` |
| Agenda | Apéro thématique | `apero` | `apero` | `/agenda` et `/aperos` |

- Un **article** n'a pas de date de rendez-vous, qu'il fasse trois lignes ou
  trois pages : analyse, compte rendu, prise de position, guide, annonce
  courte. Le formulaire efface la date et les informations pratiques d'un
  article.
- Un **rendez-vous** a toujours une date (`event_at`, `AAAA-MM-JJ`). C'est elle
  qui le place dans l'agenda, puis dans le passé.

**Il y en a eu sept, et c'était trop** (octobre 2026). Actualité (brève),
retour d'action et revue de presse existaient en plus : le menu « Actualités »
mêlait sept entrées des deux familles, la page Actualités était en fait un
second agenda rempli de « rendez-vous passés », et l'équipe elle-même se
trompait de case (un apéro publié comme événement, des comptes rendus publiés
comme articles, une revue de presse qui contenait des guides). La migration 021
a tout rangé : revues, brèves et retours d'action sont devenus des articles,
les rendez-vous sans catégorie des événements, et les apéros publiés comme
événements des apéros. **Avant de rajouter un type, se demander s'il ne s'agit
pas d'un article** : un type de plus, c'est une case de plus où se tromper.

Les adresses partagées avant ce rangement continuent de fonctionner. Le slug
étant unique dans toute la table, la fiche redirige vers sa rubrique actuelle
(`/revue-de-presse/x` et `/actualites/x` vers `/articles/x` quand c'est devenu
un article), et les anciennes listes redirigent (`/actualites` vers `/agenda`,
`/revue-de-presse` vers `/articles`). C'est pour cela que le `match` de
`src/params/rubrique.ts` accepte encore `revue-de-presse`. La contrainte
`check` accepte encore `'revue'` : reconstruire la table pour l'en retirer ne
rapportait rien.

Les événements et formations gardent leurs fiches sous `/actualites/…`, même
si le mot n'apparaît plus nulle part sur le site : des liens ont été partagés,
et le visiteur ne lit pas l'adresse. `LISTE_RUBRIQUE` (`rubriques.ts`) dit
quelle page liste chaque rubrique - l'agenda pour `actualites`.

Ajouter un type demande de toucher, dans cet ordre : la contrainte `check` de
`publications` (une migration qui reconstruit la table, voir la 007), `Kind`
dans `rubriques.ts` et `content.ts`, les tables de `rubriques.ts`, le
`match` de `src/params/rubrique.ts`, `LIBELLE_KIND`, `COULEUR_KIND` et
`FOND_KIND` de `format.ts`, la validation de `formulaires.ts`, le menu du
formulaire de publication (et sa phrase d'aide), le filtre de
l'administration et `PAGES_FIXES` du plan du site. Le flux RSS et les cartes
suivent tout seuls.

## L'agenda

`/agenda` a **deux vues**, choisies par l'adresse et non par un script :

- **la liste** (par défaut) : tous les rendez-vous à venir (quarante au plus),
  regroupés par mois. Chaque ligne porte la date en grand à gauche, comme un
  agenda papier, puis le type, l'heure, le lieu (ceux des réglages pour un
  apéro), le titre et le chapô, avec un liseré de la couleur du type.
  « Aujourd'hui » et « Demain » sont signalés. C'est la seule vue lisible sur
  téléphone, et la seule indexée ;
- **le calendrier** (`?vue=calendrier&mois=AAAA-MM`) : un mois en grille, les
  jours passés estompés. Il sert à se projeter, ou à retrouver un rendez-vous
  passé - la liste ne montre que l'avenir et y renvoie par un lien.

Le **filtre par type** (`?type=reunion|formation|apero`) vaut pour les deux
vues. Les pastilles et le choix de la vue sont des **liens** : tout fonctionne
sans JavaScript et une vue filtrée se partage. Les vues filtrées et les mois du
calendrier portent `noindex, follow`.

La première version empilait la liste des dix prochains et le calendrier du
mois en cours - deux agendas sur la même page, dont un mois à moitié passé -,
et ses lignes reprenaient le gabarit des articles : ni heure, ni lieu, la date
en petit. La page faisait quatre mille pixels sur téléphone.

Le bandeau Action populaire est **en bas**, comme sur l'accueil : on propose
l'application à quelqu'un qui a vu les rendez-vous. Avec le filtre « Apéros »,
un lien mène à `/aperos`, qui garde l'archive des thèmes et leurs résumés.

## La page Articles

`/articles` s'appelle « Articles », simplement. Elle a d'abord été « À lire »,
qu'on ne comprenait pas comme un titre de rubrique.

La première page s'ouvre sur l'article le plus récent en grand, puis une
grille de trois colonnes : 1 + 12, quatre rangées pleines ; les pages
suivantes en ont douze (`PREMIERE_PAGE` et `PAR_PAGE`). Les cartes
(`CarteArticle.svelte`, partagée avec l'accueil) n'ont pas d'étiquette
« Article » - tout ce qui est listé en est un - et ont **toujours une
image** : sans couverture, le phi officiel en couleur sur une carte
(`.vignette-article`). Sans cela les articles sans image n'avaient pas la forme
de leurs voisins et la liste paraissait cassée. Deux essais l'ont précédé : un
aplat lavande presque de la couleur de la page avec un phi pâle, qu'on prenait
pour une image qui n'avait pas chargé, puis une version claire de
`.fond-degrade`, d'un rose-mauve délavé que le site n'a nulle part ailleurs. Le
violet profond de `.fond-degrade` lui-même est exclu : quatre articles sans
image à la suite feraient autant de pavés sombres. Sur téléphone, la grille
redevient une liste à vignettes.

L'ordre est celui des dates, sans faire remonter les fiches à la une : la une
est un choix pour l'accueil, et le plus récent doit rester en tête.

La bibliothèque est annoncée d'une ligne sous le chapô, et non par un encart
coloré : posé avant le premier article, le pavé violet se lisait comme une
publicité et repoussait la liste.

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
  `+layout.server.ts` sous `data.apero`. Une fiche peut définir ses propres
  horaires, lieu et adresse ; dès qu'un lieu ou une adresse spécifique est
  renseigné, le couple propre à la fiche remplace entièrement le couple
  habituel afin de ne jamais associer un nouveau lieu à l'ancienne adresse.
- Le prochain apéro a sa fiche dans le fil « Les prochains rendez-vous » de
  l'accueil, comme les autres rendez-vous (voir « L'accueil »). Il est aussi
  dans le flux RSS et dans le plan du site. `BandeauApero.svelte` n'est plus
  utilisé sur l'accueil.
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

La page `/bibliotheque` porte **les ressources** - les sources approuvées des
apéros - et rien d'autre. Les **outils interactifs** (`/boite-a-outils`) et les
**jeux** (`/jeux`) ont chacun leur page : ils sont appelés à se multiplier, et
faire tourner un simulateur n'est pas la même chose que consulter un lien. Une
version antérieure empilait les trois sur la même page, qui devenait
interminable.

Les pages voisines - outils, jeux et médias recommandés (`/medias`) - sont
atteintes par **trois cartes en bas de la bibliothèque**, sous « Aussi dans la bibliothèque ». En bas et non en tête :
on y arrive après avoir parcouru les ressources. C'est pour cela que la
pagination est courte - voir ci-dessous.

**Les ressources sont paginées**, huit par page (`PAR_PAGE` dans
`bibliotheque/+page.server.ts`). Le nombre est petit exprès : les cartes du
bas doivent rester visibles sans dérouler la page entière. Le numéro de page est
**borné aux pages qui existent**, pour que `?page=9` affiche la dernière plutôt
qu'une liste vide accompagnée d'un « aucune ressource » qui serait faux.

**La recherche se fait en SQL**, pas dans le navigateur (`clauseBibliotheque`
dans `content.ts`). C'est la pagination qui l'impose : une recherche côté
navigateur ne porterait que sur les huit lignes affichées, ce qui est pire que
pas de recherche du tout. Elle passe par l'adresse (`?q=`), donc elle fonctionne
sans JavaScript et un résultat se partage. Chaque mot doit apparaître quelque
part, six mots au plus. `lower()` de SQLite ignore les accents : « economie » ne
trouve pas « économie », et on s'en contente - corriger cela demanderait une
colonne normalisée et une migration.

**Les ressources sont en liste, pas en cartes** : une ressource est un lien, pas
un produit en vitrine, et la liste en montre quinze là où la grille en montrait
quatre. Les outils et les jeux, eux, sont en cartes.

Les cartes du site - outils comme jeux - **n'ont pas de bouton** : le lien du
titre est étendu à toute la carte par son `::after`. Un bouton sous chaque carte,
répété une dizaine de fois, n'ajoutait rien.

Attention si l'on habille un encart avec `.fond-degrade` : **ne pas le combiner
avec `.carte`**. `.carte` est déclarée après dans `app.css` et écrase le fond, ce
qui donne du texte blanc sur fond blanc. La surface porte déjà son fond et son
texte ; il ne lui manque que le rembourrage et l'arrondi.

Les ressources ont un champ de recherche qui filtre la liste **dans le
navigateur**, sur les données déjà chargées - titre, note, auteur, nom du site
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
page ou dans l'en-tête - l'identité du groupe est dans l'en-tête, le pied de page
et « Le groupe » ; les rendez-vous publics sont dans le fil de l'accueil, et
la bibliothèque est dans l'en-tête.

Le carrousel avait été remplacé par un grand bandeau d'ouverture (devise,
boutons, prochain rendez-vous), une rangée de trois cartes de navigation et le
bandeau du prochain apéro : ensemble, ils repoussaient l'article à la une à
878 pixels sur téléphone. Ils ont été retirés à leur tour (septembre 2026).

La page tient maintenant en quatre blocs, de haut en bas :

1. **L'ouverture**, sur la surface `.fond-degrade` - le seul pavé coloré de la
   page : une ligne d'identité, la devise en `h1`, puis le **fil « Les
   prochains rendez-vous »** : les six prochains (`DANS_LE_FIL` dans
   `+page.server.ts`), événements, formations et apéros confondus
   (`listAgenda`). **Un nombre et non une durée** : le fil couvrait d'abord
   quinze jours, et n'affichait que deux fiches quand le rendez-vous suivant
   tombait le seizième jour. Chaque fiche porte
   « Aujourd'hui » ou « Demain » quand c'est le cas, l'heure, le titre, le
   type et le lieu, et un liseré dans la couleur de sa catégorie (les classes
   `agenda-*` de la page agenda). Sur téléphone, le fil défile au doigt
   (`scroll-snap`, aucun script) ; la fiche suivante qui dépasse à droite dit
   qu'on peut faire glisser. L'article à la une commence vers 340 pixels.
2. **Les publications à la une**, puis les articles récents. Toute publication
   en ligne peut y être mise : article, événement, formation ou apéro. Cinq
   au plus (`MAX_A_LA_UNE` dans
   `content.ts`) ; elles forment une grille et ne sont pas répétées dans les
   listes situées juste en dessous.
   La première est en grand (image à gauche, texte à droite), les suivantes en
   cartes compactes deux par ligne, avec une vignette. Avec de grandes images
   partout, une fiche sans image posée à côté d'une fiche illustrée était
   étirée et restait vide. La grande fiche ne prend toute la largeur que si le
   reste est pair, sinon la dernière resterait seule sur sa ligne. Si rien
   n'est à la une, la section disparaît et les articles restent dans leur
   liste normale.

   **La une se gère sur sa propre page**, Administration → À la une
   (`admin/(interne)/a-la-une`) : ce qui y est, dans l'ordre de l'accueil
   (`pinned_order`), avec des flèches pour ranger, « Retirer », et de quoi
   ajouter une publication récente ou cherchée. Ce n'est plus une case du
   formulaire de publication - le formulaire dit seulement si la fiche est à
   la une et à quel rang : avec une case par fiche, il fallait rouvrir les
   publications une à une pour savoir ce qui s'affichait, et l'ordre ne se
   réglait pas. Le formulaire porte en revanche un bouton **« Enregistrer et
   mettre à la une »** (actions `creerEtUne` et `enregistrerEtUne`,
   `enregistrerALaUne` dans `formulaires.ts`) : il enregistre d'abord, puis
   ajoute la fiche en fin de une. Il remplace un lien « Gérer la une → » qui
   quittait la page sans rien enregistrer et faisait perdre le texte en
   cours. Si la fiche est un brouillon ou que la une est pleine, le texte est
   enregistré quand même et la page dit pourquoi la une a refusé. **Aucun
   lien du formulaire ne doit changer de page** : la page de la une ne s'y
   ouvre que dans un nouvel onglet. **Rien n'expire tout seul** : l'ancienne expiration après
   quinze jours faisait disparaître des fiches sans prévenir (migration 020).
   `pinned_at` ne dit plus que depuis quand. Chaque ajout, retrait et
   déplacement passe par `audit()`.
3. **« Derniers articles »**, sur toute la largeur, dans la grille de la page
   Articles (`CarteArticle`, six fiches, deux rangées pleines :
   `DERNIERS_ARTICLES`). La moitié droite a longtemps porté « Plus tard dans
   l'agenda », les rendez-vous suivant ceux du fil : elle coupait le milieu de
   la page entre deux sujets, pour une liste que « Tout l'agenda → » donne
   déjà. Elle a été retirée (octobre 2026) ; **l'agenda de l'accueil, c'est le
   fil du haut, et rien d'autre**.
   Dessous, **« S'informer ailleurs »** (surlignage « On recommande ») : les
   médias cochés « Sur l'accueil » dans l'administration. Une phrase dit
   pourquoi, puis ils sont **rangés par format**, une rangée « À regarder »,
   une rangée « À lire ». **La liste peut être longue** et la section doit
   tenir quel que soit le nombre : sur ordinateur, tous sont visibles en
   grille de trois cartes compactes ; sur téléphone, chaque rangée défile au
   doigt comme le fil des rendez-vous (`scroll-snap`, aucun script). Pas de
   carrousel à diapositives : presque personne ne dépasse la première, les
   autres médias seraient cachés. Pas en tête de page : un lien sortant dès
   l'arrivée fait partir le visiteur avant qu'il ait vu ce que fait le groupe.
4. **Le bandeau Action populaire**, tout en bas - jamais en tête : on propose
   d'installer quelque chose à quelqu'un qui a lu la page, pas à quelqu'un qui
   arrive.

**Un rendez-vous qui revient n'est affiché qu'une fois** (`regrouperRepetitions`
dans `+page.server.ts`). Le site n'a pas de récurrence : le rassemblement de
chaque samedi est une fiche par date, et six fois le même titre remplissaient
la page. Seule la prochaine date est montrée ; si toutes les dates à venir
sont espacées d'une semaine, la fiche dit « Chaque samedi », sinon « Et 3
autres dates ». Le regroupement se fait sur le titre exact, mais jamais entre
deux fiches portant la même date : deux rendez-vous réellement distincts le
même jour restent tous les deux visibles. Pour qu'il
fonctionne, les fiches d'un même rendez-vous doivent porter le même titre.

`BandeauApero.svelte` n'est pas construit sur `Encart.svelte` : celui-ci porte un
texte fixe, alors qu'ici la date, le lieu et l'image de couverture viennent de la
fiche de l'apéro. Les deux suivent en revanche **le même gabarit** - même
rembourrage, même taille de titre, même marge - pour qu'un visiteur ne voie
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

Affiché au bas de l'agenda, au bas de chaque événement et au bas
de l'accueil - pas ailleurs : c'est là que le visiteur cherche les prochains
rendez-vous, donc le moment où proposer l'application a du sens. Sur l'accueil il
est **tout en bas**, jamais en tête. Pour l'étendre à tout le site, déplacer le
composant dans `src/routes/+layout.svelte`, juste avant le `<footer>`.

C'est un `Encart` ordinaire - mais il porte les couleurs de l'application
(jaune `#f0e80d`, bleu nuit `#0b0b33`) et non celles du site, écrites en dur
plutôt que prises dans les jetons : elles ne doivent bouger ni avec le thème
sombre, ni si l'on retouche la palette du site. Ce contraste avec le reste de la page est voulu - c'est ce qui
fait remarquer le bandeau.

Les adresses des magasins d'applications sont dans les réglages
(`app_url_android`, `app_url_ios`) et non dans le code : un lien de magasin
change, et le modifier ne doit pas demander de redéploiement. Elles sont filtrées
à l'enregistrement pour n'accepter que `https://` - sans ce filtre, un
`javascript:…` saisi dans le formulaire s'exécuterait au clic du visiteur.

Quand les deux champs sont vides, le bandeau renvoie vers actionpopulaire.fr
plutôt que d'afficher des boutons morts.

## Les encarts d'appel

`src/lib/components/Encart.svelte` est le gabarit **unique** des invitations
posées sur une page : aujourd'hui, Action populaire en bas de l'agenda et de
l'accueil. Ils avaient chacun leur mise en page ; d'une page à l'autre, le
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
surface (`href`) ou des boutons (`actions`) - jamais les deux : le lien étendu
passerait derrière les boutons.

Ne jamais ajouter `.carte` à une surface : `.carte` est déclarée après dans
`app.css` et écraserait le fond, ce qui donne du texte blanc sur fond blanc. La
surface porte déjà son fond et son texte ; le composant ajoute le reste.

Un encart mène toujours vers une page, jamais vers une publication précise,
sinon il faut le modifier à chaque publication.

**Avant d'en poser un en tête d'une liste, préférer une ligne de lien sous le
chapô.** Les encarts de tête - la revue de presse sur les articles, la
bibliothèque sur la revue de presse, Action populaire sur les actualités -
passaient avant le contenu, se lisaient comme des publicités et repoussaient la
liste sous la ligne de flottaison : ils ont été retirés en octobre 2026. Le
bandeau Action populaire, lui, va **en bas** de l'agenda et de l'accueil : on
propose l'application à quelqu'un qui a vu les rendez-vous.

**Une page n'a qu'un seul pavé coloré.** La page des apéros en a déjà un en tête
(le prochain apéro) : son renvoi vers la bibliothèque est donc un simple lien en
fin de page. Deux surfaces colorées sur la même page se font concurrence.

## Le logo

`src/lib/components/Logo.svelte` contient le phi officiel 2024, en SVG écrit
directement dans le composant. Deux variantes :

- `variante="couleur"` (par défaut) : le dégradé officiel, pour les fonds clairs
- `variante="mono"` : une seule couleur héritée du parent - mettre `text-white`
  sur un fond coloré

Il est en format portrait : le dimensionner par la hauteur (`h-10 w-auto`), pas
par un carré, sinon il est inutilement rétréci.

Le fichier d'origine récupéré sur Wikimedia pesait 61 Ko dont 52 Ko d'aperçu PNG
masqué et un tracé en `display:none`, restes du recadrage. Ils ont été retirés.
Les couleurs du dégradé de `app.css` sont celles, exactes, de ce fichier.

## Les vidéos

Un paragraphe qui ne contient **que** le lien d'une vidéo YouTube devient un
bloc cliquable - règle `bloc_video` de `src/lib/server/markdown.ts` :

    https://youtu.be/cW1Yay_1XaQ                 → « Regarder la vidéo »
    [Le titre de la vidéo](https://youtu.be/…)   → « Le titre de la vidéo »

Il faut une ligne vide avant et après : c'est ce qui en fait un paragraphe à
lui seul. Un lien au fil d'une phrase, ou un lien en gras, reste un lien
ordinaire. C'est voulu : la liste des sources en fin d'article ne doit pas se
transformer en une pile de pavés.

**La vidéo n'est pas jouée dans la page, et ce n'est pas un oubli.** Une iframe
YouTube obligerait à inscrire un domaine de Google dans la CSP (règle n° 2 des
règles de sécurité), donc à annoncer à Google chaque visiteur d'un article
avant même qu'il ait cliqué - sur un site dont le pied de page promet de
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

## Le partage

Chaque publication (article, événement, formation, apéro) se termine par
une rangée de boutons : WhatsApp, Facebook, Telegram, Bluesky, X, e-mail
(`Partage.svelte`, liste `reseaux`). Pas sur l'aperçu d'un brouillon.

- **Ce sont de simples liens** vers la page de partage de chaque réseau. Les
  boutons « officiels » des réseaux sont des scripts et des iframes qui leur
  signalent chaque lecteur, qu'il partage ou non : la CSP les refuse (règle
  n° 2), et le pied de page promet qu'aucun service tiers n'est utilisé. Rien
  ne part vers un réseau avant le clic.
- Deux boutons n'apparaissent qu'avec le script : « Copier le lien » (avec une
  méthode de secours pour les navigateurs intégrés à Facebook ou Instagram, qui
  refusent l'accès au presse-papiers) et « Autres applications », le menu de
  partage du téléphone.
- Les icônes sont les logos de Simple Icons (domaine public), recopiés dans le
  composant : des SVG du projet, pas des fichiers venus de l'extérieur.

**L'ajout à l'agenda.** Un rendez-vous à venir (événement, formation,
apéro - pas un brouillon) porte deux boutons sous sa
date (`src/lib/agenda.ts`) : « Apple, Outlook » sert un fichier `.ics`
(`/<rubrique>/<slug>/agenda.ics`), que l'iPhone et le Mac proposent d'ajouter
dès qu'on l'ouvre ; « Google Agenda » est un simple lien prérempli, plus sûr
sur Android où un `.ics` finit souvent dans les téléchargements. Les heures
restent en heure de Paris ; sans heure de fin, le rendez-vous est inscrit pour
deux heures, sans heure du tout, pour la journée.

**L'image d'aperçu.** Un lien partagé affiche l'image de couverture de la
publication. Sans couverture, `Metadonnees.svelte` annonce
`static/apercu-partage.jpg` : le phi blanc sur le fond de `.fond-degrade`, en
1200 × 630, le format des grandes cartes de partage. Avant, une page sans
couverture n'avait aucune image, et son lien passait inaperçu dans un fil.
Les réseaux gardent l'aperçu d'une adresse en mémoire un certain temps : une
page déjà partagée avant ce changement ne le montre pas tout de suite.

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

L'en-tête porte les deux portes du site, **Agenda** et **Articles**, en liens
simples (`liensPrincipaux` dans `src/routes/+layout.svelte`), puis le menu
**Ressources** (bibliothèque, outils, jeux, médias), « Qui sommes-nous ? » et le
bouton « Nous rejoindre ». Le logo ramène à l'accueil. Le menu mobile reprend
la même chose. « Agenda » s'allume aussi sur les fiches d'événements
(`/actualites/…`) et sur les apéros (`sections`).

Pas de menu déroulant pour les publications : l'ancien menu « Actualités »
alignait sept entrées des deux familles, et on s'y perdait. Ajouter un lien
dans l'en-tête de bureau le fait déborder sur les écrans moyens : préférer le
pied de page.

Le pied de page range ses liens en trois colonnes titrées - Le groupe,
Ressources, Le site (`groupesPied`) - à droite de la présentation du groupe sur
grand écran, en dessous ailleurs. Le choix d'affichage est dans la barre du
bas, avec le copyright. En une seule liste de onze liens, la colonne faisait
plus de 400 pixels de haut et laissait la moitié gauche vide.

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

## Les médias recommandés

`/medias` liste quelques médias que le groupe conseille (nom, format « à
regarder » ou « à lire », lien, une phrase qui dit pourquoi). Ils sont en base
(table `medias_recommandes`, migration 019, qui a repris les quatre premiers)
et se gèrent dans Administration → Médias recommandés
(`admin/(interne)/medias-recommandes`, logique dans
`src/lib/server/medias-recommandes.ts`) : ajout, modification, ordre
(flèches), suppression, et la case **« Sur l'accueil »** qui choisit ceux que
reprend la section « On recommande ». Tous sont sur `/medias` ; sans aucun
média coché, la section de l'accueil disparaît. Chaque action passe par
`audit()` : la recommandation est un choix politique, on doit savoir qui l'a
faite. Chaque média porte une phrase qui dit **pourquoi** on le
recommande : c'est ce qui fait de la liste un conseil et non un annuaire.
Même place que les jeux : carte en bas de la bibliothèque, pied de page, menu
« Ressources ». Sur l'accueil, ils sont sous les articles et l'agenda
(voir « L'accueil »).

Le lien n'accepte que `https://` (il finit dans un `href` public). L'adresse
`/admin/medias` est déjà prise par les images : d'où `medias-recommandes`.

Chaque média a son **logo**, servi par le site : les quatre premiers sont dans
`static/images/medias/`, les suivants sont envoyés depuis le formulaire et
passent par `storeUpload` comme toute image (type lu dans les octets, SVG
refusé). Le logo envoyé est relié à l'image par `logo_media_id`, ce qui
l'empêche d'être supprimé depuis Administration → Images tant qu'il sert.
Jamais chargé depuis le site du média : la CSP l'interdit, et ce serait
annoncer chaque visiteur de l'accueil à YouTube ou à Mediapart.

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

Les trois maillons - comment on entre, comment on choisit, ce qu'on fait ensuite
- ont été repris ensemble ; les traiter séparément avait produit un annuaire
sans entrée ni sortie.

- **On entre** par la carte en bas de la bibliothèque, par le pied de page ou
  par le menu mobile. La page n'est pas dans l'en-tête de bureau : une cinquième
  rubrique le ferait déborder sur les écrans moyens.
- **On choisit** : deux outils sont mis en avant sous « Pour commencer »
  (`enAvant: true` dans `OUTILS`, avec une `accroche` plus longue que la
  description). Onze cartes égales ne disent pas par où entrer. Ils sont
  choisis pour être les plus contre-intuitifs - un sur soi, un sur le pays - et
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
lui-même - « est-ce que ça parle de moi, ou du pays ? ». Une rubrique sans outil
n'est pas affichée, on peut donc en déclarer une à l'avance. Le `satisfies` sur
`OUTILS` fait échouer `npm run check` si un outil pointe vers une rubrique qui
n'existe pas - une faute de frappe est attrapée à la compilation, pas par un trou
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
trouver - on ne cherche pas « LFI Dijon », on cherche « combien d'impôts je
paie ». Le nom du site y est écrit en dur, repris de `DEFAULTS` : le renommer
dans l'administration demande de relancer le script.

L'adresse canonique, `og:url` et l'image d'aperçu, elles, ne sont **pas**
écrites par le script : elles demandent le domaine du site, qu'un fichier
statique ignore. `fichiers-embarques.ts` les ajoute à la fin du `<head>` au
moment de servir la page, pour les outils comme pour les jeux.

Quatre règles, dont la première n'est pas négociable :

1. **Chaque chiffre porte sa source et son année**, visibles en bas de la page,
   et chaque outil dit en toutes lettres ce que son calcul ne prend pas en
   compte. Le site est une cible politique : un chiffre invérifiable ou
   exagéré est une munition offerte aux adversaires, et une seule erreur
   trouvée discrédite tous les autres.
2. **Ne jamais « arrondir dans le bon sens ».** L'outil sur l'impôt applique
   la décote, qui annule l'impôt sur le revenu autour du SMIC : sans elle, il
   surestimait de moitié ce que paient les foyers modestes - précisément ceux
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
  qui nous arrange - quitte à laisser le visiteur choisir son hypothèse au
  curseur. De même, l'outil sur la proportionnelle affiche que ce scrutin aurait
  donné une cinquantaine de sièges de plus au RN en 2024. Un argument qui ne
  tient que lorsqu'il nous arrange n'est pas un argument, et une seule erreur
  trouvée discrédite les dix autres outils.

## Le référencement

Le site n'a aucun outil de mesure d'audience extérieur et n'en aura pas (règle
n° 2 des règles de sécurité) : il compte seulement ses visites lui-même, côté
serveur (voir « La fréquentation »). Tout ce qui suit se joue donc dans le HTML,
sans script et sans service tiers.

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
  l'ensemble - pas seulement de la page fautive.

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

## Les vagues de requêtes

Le 16 octobre 2026 vers 21 h 27, environ 80 adresses ont envoyé 75 000 requêtes
en dix minutes, presque toutes sur la page d'accueil, puis 26 000 autres vers
1 h. Le site est resté figé de 21 h 27 à 1 h 07 : trois heures et demie, alors
que la première vague s'était éteinte au bout de dix minutes. La chaîne, telle
que les journaux la montrent :

1. Le site fabrique une page en quelques dizaines de millisecondes. Face à plus
   de 500 requêtes par seconde, il a pris du retard, et Caddy a accumulé les
   requêtes en attente.
2. Caddy est monté à 3 Go de mémoire sur les 4 du serveur ; le système l'a tué
   deux fois.
3. Le serveur entier, à court de mémoire, s'est enrayé. Docker ne lisait plus
   les journaux, et Caddy, qui écrit une ligne d'erreur par requête perdue,
   s'est arrêté net en attendant de pouvoir écrire. Des lignes écrites à 21 h 29
   n'ont été reçues qu'entre 1 h 01 et 1 h 06, au moment précis où le site est
   revenu.

Quatre protections répondent chacune à un maillon, de l'extérieur vers
l'intérieur :

- **Des plafonds de mémoire** (`docker/compose.yml`) : 512 Mo pour Caddy, 1 Go
  pour le site. Un conteneur qui s'emballe est arrêté et relancé en quelques
  secondes, sans entraîner le reste du serveur.
- **Des journaux bornés et non bloquants** (`docker/compose.yml`) : trois
  fichiers de 10 Mo, en mode `non-blocking`. Mieux vaut perdre des lignes que
  figer le programme qui les écrit.
- **Caddy ne fait plus attendre** (`docker/Caddyfile`) : au-delà de cent
  requêtes en cours de traitement par le site (`unhealthy_request_count`), il
  répond tout de suite que le site est surchargé, avec un message lisible
  (`handle_errors`). Il ferme aussi les connexions trop lentes ou inactives.
- **Le site écarte les adresses insistantes** (`src/lib/server/limiteur.ts`),
  avant toute lecture de la base : refuser coûte un dixième de milliseconde,
  fabriquer la page cent fois plus. Chaque adresse a deux réserves : une
  générale (300 requêtes d'affilée, puis 5 par seconde) et une par page (60 fois
  la même page, puis 10 par minute). Les adresses IPv6 sont regroupées par bloc
  de 64 bits, sans quoi un attaquant en changerait à chaque requête.

Les seuils sont larges exprès : une même adresse peut cacher tout le Wi-Fi d'un
bar pendant un apéro, une salle de réunion, ou les abonnés d'un opérateur mobile
qui partage ses adresses. Avant de les resserrer, se demander qui serait
bloqué.

**Le site ne se sert qu'en IPv4, exprès.** Le réseau Docker n'a pas d'IPv6 :
un visiteur IPv6 passait par `docker-proxy` et arrivait au site sous l'adresse
de la passerelle Docker (172.18.0.1). Tous les visiteurs IPv6 avaient alors la
même adresse, donc la même réserve dans le limiteur et la même empreinte pour
les commentaires : « Bloquer cette origine » sur l'un les bloquait tous. Depuis
le 17 octobre 2026, le domaine n'a plus d'enregistrement AAAA, et
`docker/compose.yml` ne publie les ports que sur `0.0.0.0`. **Ne pas remettre
d'enregistrement AAAA** sans avoir d'abord donné l'IPv6 au réseau Docker.

Le limiteur garde ses compteurs en mémoire, et non en base comme
`ratelimit.ts` (commentaires, connexion) : écrire chaque requête dans SQLite
ferait exactement le travail que l'attaquant cherche à imposer.

**Ce que ces protections ne font pas** : arrêter une vague venue de milliers
d'adresses qui demandent chacune peu de pages. Le plafond de Caddy garde alors
le serveur debout, mais les visiteurs lisent « surchargé » le temps de la
vague. Au-delà, il faudrait un service de filtrage placé devant le site
(Cloudflare ou équivalent), qui verrait passer chaque visiteur : c'est
contraire à ce que promet le site, et cette décision n'a pas été prise.

Les réglages de `compose.yml` ne s'appliquent qu'à la recréation des
conteneurs. `scripts/deployer.sh` s'en charge quand le fichier change.

## La fréquentation

Administration → Fréquentation montre les visites des trente derniers jours,
les pages les plus lues, les sites d'où viennent les visiteurs, et le trafic
avec les pics détectés. Le tableau de bord signale un pic des dernières
48 heures.

Le site compte lui-même, dans `src/lib/server/frequentation.ts` appelé par
`hooks.server.ts`. **Aucun script, aucun cookie, aucun service extérieur** :
tout vient de ce que chaque requête apporte de toute façon. **Aucune adresse IP
ni aucun identifiant de visiteur n'est conservé** (règle n° 3) :

- pour compter les visiteurs distincts d'une journée, on calcule une empreinte
  de l'adresse et du navigateur avec un sel tiré au hasard chaque jour et gardé
  **en mémoire seulement**. À minuit, il est oublié sans avoir été écrit nulle
  part : plus personne ne peut relier deux visites. Seul le total part en base ;
- les compteurs sont versés en base une fois par minute, en une transaction, et
  à l'arrêt du conteneur (`sveltekit:shutdown`) ;
- la table des minutes est purgée au bout de 90 jours (`nettoyer()` dans
  `db.ts`) ; les totaux par jour sont gardés. La page Confidentialité le dit :
  la tenir à jour si cela change.

Compte comme page vue une requête GET réussie qui renvoie du HTML, ou les
données d'une page quand le visiteur navigue sans recharger (SvelteKit ne
redemande alors que ses données). Les images, les flux, l'administration, les
administrateurs connectés et la vérification de santé de Docker ne comptent
pas ; les robots qui s'annoncent sont comptés à part.

C'est pour cela que `app.html` précharge **les données d'une page au clic**
(`data-sveltekit-preload-data="tap"`), et son code seulement au survol.
Précharger les données au survol comptait comme lue chaque page effleurée par
la souris, et faisait calculer au serveur des pages que personne n'ouvrait. Sur
téléphone, rien ne change : le préchargement y part au toucher dans les deux
cas.

Les chiffres sont des **ordres de grandeur**. Un redémarrage du site (chaque
mise à jour) oublie le sel du jour : quelqu'un qui revient le même jour compte
alors deux fois. Les « visites » sur sept ou trente jours additionnent les
visiteurs de chaque jour : quelqu'un qui revient trois jours compte trois fois.

Un **pic** est une minute de plus de 600 requêtes (`SEUIL_PIC`) ; le site en
reçoit d'habitude quelques dizaines. Il est lu comme une « attaque probable »
quand au moins un cinquième des requêtes ont été bloquées, ou quand chaque
adresse en envoie en moyenne plus de soixante par minute ; sinon comme une
« forte affluence », un article qui circule. Les requêtes que Caddy refuse
lui-même n'atteignent pas le site et n'apparaissent donc pas.

Les listes (pages lues, provenances) tiennent chacune sur une ligne, avec une
barre proportionnelle derrière le chiffre, et n'en montrent que huit : le reste
est replié sous « Voir les suivantes », comme les pics au-delà des trois plus
récents. Avec le titre puis l'adresse de chaque page sur deux lignes, la liste
faisait défiler un écran entier ; l'adresse est passée dans l'infobulle.

Les graphiques (`Histogramme.svelte`) sont faits de boîtes HTML et non d'un
dessin SVG, pour que le texte ne rapetisse pas sur téléphone. Leurs deux
couleurs (`--color-graphe` et `--color-graphe-alerte` dans `app.css`) sont
dérivées du violet et du rouge du logo, et ont été vérifiées pour rester
distinctes aux yeux des daltoniens, dans les deux thèmes : les changer demande
de refaire cette vérification. Chaque graphique se parcourt au clavier et a son
tableau de chiffres dépliable.

## Ajouter une page fixe

Créer `src/routes/mon-adresse/+page.svelte`, puis ajouter le lien dans la
navigation de `src/routes/+layout.svelte` et dans `PAGES_FIXES` de
`src/routes/sitemap.xml/+server.ts`. Ajouter aussi son titre dans `PAGES_FIXES`
de `src/routes/admin/(interne)/frequentation/+page.server.ts`, pour que la page
Fréquentation l'affiche par son nom plutôt que par son adresse.

## Le mode démonstration

`src/lib/server/demo.ts`, activé par `MODE_DEMO=1`. Sur une base vide, il crée
des contenus fictifs et un compte `demo` avec la 2FA déjà activée, puis la page
de connexion affiche les identifiants et le code du moment. L'administration
est donc ouverte à tout le monde : ce mode est réservé au site de test sur
Render (`render.yaml`, `DEMO.md`) et ne doit jamais être activé en production.
Les contenus fictifs sont dans le tableau `FICHES` de ce fichier ; les dates
des rendez-vous sont relatives au jour du démarrage.

La fiche portant `illustree: true` reçoit une **image de couverture**, encodée
en base64 dans `demo-image.ts`. Elle est dans le code et non dans
`data/uploads/` parce que ce dossier est le stockage du site en fonctionnement :
il est dans `.gitignore` et n'existe pas au démarrage d'un conteneur neuf. Sur
Render, la démo repart d'une base vide à chaque déploiement - sans cette copie,
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
GitHub, et non l'inverse - aucune clé d'accès à la machine de production ne
traîne donc chez un tiers.

Deux conséquences à garder en tête. Un commit poussé part **en production dans
les cinq minutes**, sans relecture : `npm run check` avant de pousser n'est pas
une politesse. Et si la compilation échoue, les conteneurs en place continuent
de servir la version précédente - le site ne tombe pas, il cesse simplement de
se mettre à jour, ce que seul `/var/log/deploiement-site.log` dira.

**Tout dossier ajouté dans `/srv/lfi-site` sur le serveur doit figurer dans
`.dockerignore`** : c'est ce que Docker reçoit pour compiler. Le 19 octobre
2026, les sauvegardes et les preuves de l'attaque, absentes de ce fichier,
étaient recopiées à chaque mise à jour et gardées dans le cache de Docker,
jusqu'à remplir le disque de 40 Go. Le site a cessé de se mettre à jour et de
se sauvegarder sans rien signaler. `deployer.sh` fait depuis le ménage des
images et du cache après chaque mise à jour, et le journal note la place libre.

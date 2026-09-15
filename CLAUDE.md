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
| `src/hooks.server.ts` | En-têtes de sécurité, session, garde `/admin` |
| `src/routes/[rubrique=rubrique]/` | Pages publiques `/articles`, `/actualites` et la fiche d'un apéro |
| `src/routes/aperos/` | Page publique `/aperos` : prochain apéro et archive des thèmes |
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
- **Le fond clair n'est pas un blanc pur** (`--color-surface`) et le texte
  n'est pas un noir pur : le contraste reste très large mais la page
  n'éblouit pas. `--color-line` est le filet décoratif ; `--color-line-forte`
  sert aux contours qu'on manipule (champs, boutons secondaires, pastilles),
  pour tenir le contraste de 3 pour 1 exigé sur les commandes.
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

## Les trois types de publication

Une seule table `publications`, distinguée par la colonne `kind` :

- **`article`** — analyses, comptes rendus, prises de position. Classés du plus
  récent au plus ancien.
- **`actu`** — actualités : annonces de rendez-vous, mobilisations, réactions à
  chaud. Elles ont une colonne `event_at` facultative (date de l'action, au
  format `AAAA-MM-JJ`).
- **`apero`** — apéros thématiques (voir plus bas). `event_at` y est
  obligatoire : c'est la date de la soirée.

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

## Le carrousel d'accueil

`src/lib/components/CarrouselAccueil.svelte`. Quatre sortes de diapositives,
dans cet ordre : le prochain apéro thématique (s'il est annoncé, sur la surface
pourpre `.fond-apero`), l'identité du groupe, les prochaines actions (les
actualités dont la date n'est pas passée, trois au plus, alimentées
automatiquement), et la bulle Action populaire. L'apéro passe devant l'identité
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

Affiché au bas de la liste des actualités et de chaque actualité — pas ailleurs :
c'est là que le visiteur cherche les prochains rendez-vous, donc le moment où
proposer l'application a du sens. Pour l'étendre à tout le site, déplacer le
composant dans `src/routes/+layout.svelte`, juste avant le `<footer>`.

Le bandeau porte les couleurs de l'application (jaune `#f0e80d`, bleu nuit
`#0b0b33`) et non celles du site, écrites en dur plutôt que prises dans les
jetons : elles ne doivent bouger ni avec le thème sombre, ni si l'on retouche la
palette du site. Ce contraste avec le reste de la page est voulu — c'est ce qui
fait remarquer le bandeau.

Les adresses des magasins d'applications sont dans les réglages
(`app_url_android`, `app_url_ios`) et non dans le code : un lien de magasin
change, et le modifier ne doit pas demander de redéploiement. Elles sont filtrées
à l'enregistrement pour n'accepter que `https://` — sans ce filtre, un
`javascript:…` saisi dans le formulaire s'exécuterait au clic du visiteur.

Quand les deux champs sont vides, le bandeau renvoie vers actionpopulaire.fr
plutôt que d'afficher des boutons morts.

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

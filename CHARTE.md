# Charte graphique et structure du site

Ce document dit **à quoi ressemble une page du site et où elle se range**. Il
est court exprès : c'est ce qu'on relit avant d'ajouter une page ou un écran.
Le pourquoi de chaque règle, et l'histoire des essais qui l'ont précédée, sont
dans `CLAUDE.md` (« Direction artistique », « L'en-tête », « L'accueil »).

Une partie de ces règles est vérifiée automatiquement par
`garde-fous/charte.test.ts` et `garde-fous/structure.test.ts` (`npm test`).
Une règle marquée ✅ fait échouer les vérifications quand on l'enfreint.

## 1. La structure : où va une nouvelle page

Le site répond à deux questions. L'en-tête n'a donc que deux portes.

| Le visiteur se demande | Il va dans | Ce qu'il y trouve |
| --- | --- | --- |
| « Où est-ce que je peux venir ? » | **Agenda** | événements, formations, apéros |
| « Qu'est-ce que vous faites, qu'est-ce que vous pensez ? » | **Articles** | tout texte sans date de rendez-vous : actus, articles, séries |
| « De quoi puis-je me servir ? » | **Ressources** (menu) | bibliothèque, boîte à outils, jeux, dessins, médias |

Puis « Qui sommes-nous ? » et le bouton « Nous rejoindre ». C'est tout.

- ✅ **On n'ajoute rien à côté d'Agenda et d'Articles.** La navigation est
  décidée dans `src/lib/structure.ts`, et nulle part ailleurs.
- Une nouvelle page qu'on consulte ou dont on se sert va dans le menu
  **Ressources**, et en carte en bas de la bibliothèque. C'est une décision à
  faire relire, pas un ajout en passant.
- Une page secondaire (mentions, confidentialité…) va dans le **pied de page**.
- ✅ **Trois types de publication** (`article`, `actu`, `apero`), pas un de
  plus. Avant d'en imaginer un nouveau : c'est presque toujours un article, au
  format actu, article ou série.

Pour ajouter une page, suivre « Ajouter une page fixe » dans `CLAUDE.md`.

## 2. Le gabarit d'une page

Toutes les pages publiques commencent de la même façon. À recopier :

```svelte
<Metadonnees titre="Ma page - {data.settings.siteName}" description="Une phrase." />

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-ocre uppercase">Ressources</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Le titre de la page</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">Le chapô : une ou deux phrases.</p>
</header>

<section class="mt-8" aria-labelledby="ma-section">
	<h2 id="ma-section" class="text-lg font-bold text-ink">Une section</h2>
	<p class="mt-5 text-ink-soft">…</p>
</section>
```

- ✅ Toute page publique passe par `<Metadonnees />` (titre, description,
  adresse canonique, aperçu de partage). Pas de `<svelte:head>` à la main.
- Un **surlignage** en petites capitales, le **titre** en `.titre-affiche`, un
  **chapô**, un **filet** sous l'en-tête. Une page sans ce filet se voit tout
  de suite.
- ✅ `.titre-affiche` reste en casse normale : ni italique, ni majuscules.
- **Un seul pavé coloré par page.** Deux surfaces colorées se font concurrence.

## 3. Couleurs

Les couleurs sont des **jetons** d'`app.css`, qui changent tout seuls avec le
thème sombre. On n'écrit jamais une couleur directement.

| Pour | Classe |
| --- | --- |
| Le texte | `text-ink`, puis `text-ink-soft`, puis `text-ink-faint` |
| La page | `bg-surface` (un crème très clair, pas un blanc pur) |
| Ce qui se pose sur la page (carte, champ, menu) | `bg-carte` ou `.carte` |
| Ce qui s'y creuse (étiquette, encadré discret) | `bg-surface-alt` |
| Un filet décoratif | `border-line` |
| Le contour d'une commande (champ, bouton secondaire) | `border-line-forte` |
| Les liens et la couleur principale | `text-brand` (rouge chouette) |
| Un accent | `text-accent` (bleu nuit) - avec parcimonie |

Chaque type de publication a sa couleur, prise au logo de la chouette :
**rouge** pour les articles (`text-brand`), **bleu nuit** pour les événements
(`text-accent`), **ocre** pour les apéros (`text-ocre`).

- ✅ Pas de couleur Tailwind par défaut (`bg-red-50`, `text-green-900`,
  `bg-gray-100`…) : elles ne suivent ni la palette ni le thème sombre.
- ✅ Pas de couleur en `#rrggbb` dans une page.
- ✅ Sur un fond rouge, le texte est `text-sur-brand`, jamais `text-white` :
  en thème sombre le rouge devient clair, et le texte doit devenir sombre.
- Pas d'ombre portée : le relief vient des trois niveaux page / carte / creux.

## 4. Les briques

Avant d'écrire une classe à la main, prendre celle qui existe.

| Besoin | Brique |
| --- | --- |
| Un bouton | `.bouton` (principal), `.bouton-secondaire`, `.bouton-danger` - toujours en pilule |
| Un champ de formulaire | `.champ`, son libellé `.etiquette`, son explication `.aide` |
| Un message d'erreur | `.alerte` ; une réussite : `.alerte alerte-succes` |
| Une carte | `.carte` ; cliquable : le lien du titre étendu par `after:absolute after:inset-0`, **sans bouton** |
| Une surface colorée | `.fond-degrade` (rouge), `.fond-actu` (bleu nuit), `.fond-apero` (ocre) |
| Une invitation vers une autre page | `Encart.svelte` : une bande, une seule phrase |
| Le logo | `Logo.svelte`, dimensionné par la hauteur (`h-10 w-auto`) |

- ✅ Jamais `.carte` **et** une surface colorée sur le même élément : `.carte`
  écrase le fond, ce qui donne du texte blanc sur fond blanc.
- Les ressources sont en **liste** ; les outils, les jeux et les dessins en
  **cartes**.
- Le texte d'une publication suit la mise en page **« Revue »**
  (`.article-revue` d'`app.css`) : deux familles seulement, une police à
  empattements pour lire, Stack Sans pour les titres, en casse normale. Pas de
  capitales serrées dans un article.

## 5. Espacements

Quatre valeurs, et pas d'autres. Avant d'en écrire une cinquième, se demander
laquelle des quatre convient.

| Où | Classe |
| --- | --- |
| Le rembourrage de `<main>` | `py-6` (déjà posé par le gabarit du site) |
| Sous l'en-tête d'une page | `pb-4` |
| Entre deux sections | `mt-8` |
| À l'intérieur d'une section | `mt-5` (ou `mt-6` pour un sous-bloc) |

- ✅ Pas de `mt-10`, `mt-12`, `mt-16`… sur une page publique.
- **Deux marges ne s'additionnent jamais pour un même écart** : quand un bloc
  porte sa marge, son voisin n'en met pas.

## 6. Ce que le site ne fait jamais

- Charger quoi que ce soit d'un autre site : police, script, image, vidéo
  intégrée, outil de mesure d'audience. ✅
- Dépendre de JavaScript pour lire ou naviguer : les menus sont des
  `<details>`, les filtres des liens, les formulaires de vrais formulaires.
- Faire bouger quelque chose tout seul (carrousel, défilement automatique).
- Poser une invitation colorée **avant** le contenu de la page : elle se lit
  comme une publicité et repousse ce que le visiteur est venu chercher.

## 7. Le code qui porte tout cela

- **Tout est en français** : fichiers, fonctions, variables, commentaires,
  messages. Ceux qui reprendront ce code sont des militants.
- Chaque fichier commence par dire ce qu'il fait et **pourquoi**.
- ✅ Indentation par tabulations, pas de ligne de plus de 250 caractères.
- Avant de proposer un changement : `npm run verifier`.

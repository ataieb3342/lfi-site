# Chroniques des Astres — Les Terres d'Aube (V0.20.2)

Petit jeu de stratégie original, jouable en solo dans un navigateur sur PC. Aucun compte ni installation de dépendances.

## Démarrer

Décompresse le ZIP, puis **double-clic sur `index.html`**. Le jeu fonctionne localement dans un navigateur de bureau, sans Python ni PHP, sans connexion réseau et sans installation supplémentaire. Conserve les dossiers `js`, `css` et `assets` à côté de `index.html`. En haut de l’écran, le repère **CARTE V0.16 · CHARGÉE** confirme que la nouvelle image a été ouverte. Si le repère indique **IMAGE MANQUANTE**, vérifie le dossier `assets`.

## Objectif et commandes

Détruis le sanctuaire rouge adverse. Si le tien est détruit, tu perds. L’IA commence sans caserne : ses ouvriers récoltent de la nourriture, du bois et de l’or. Après 35 secondes, un ouvrier finance et construit sa caserne avec les ressources disponibles. Elle entraîne ensuite des fantassins, lanciers, archers et cavaliers avec ses réserves récoltées. Elle produit aussi des ouvriers, construit des maisons selon sa population et peut financer une deuxième caserne. Elle rassemble une armée avant de lancer une attaque : 6 unités au début, 11 ensuite, puis 20 en fin de partie. Elle laisse du temps entre les vagues et détourne ses soldats pour défendre sa base si nécessaire. La carte illustrée mesure 3000 × 2250 unités. Les rivières et les falaises bloquent le passage ; les forêts ralentissent les unités ; les ponts et passages sont des itinéraires utiles.

- Clic gauche sur une unité ou un bâtiment : sélectionner ; glisser pour sélectionner plusieurs unités ; Maj + clic pour ajouter ou retirer une unité ; double clic sur une unité pour sélectionner toutes les unités alliées du même type visibles à l’écran.
- Clic droit sur une ressource : la récolter avec les ouvriers sélectionnés ; clic droit sur le sol : se déplacer ; clic droit sur un ennemi : l'attaquer.
- Ouvrier sélectionné : « Maison » ou « Caserne », puis clic gauche sur un endroit libre pour construire. Échap annule le choix.
- Sanctuaire sélectionné : former un ouvrier. Caserne terminée sélectionnée : former un fantassin, un lancier, un archer ou un cavalier.
- Ctrl + 1 à 9 : mémoriser un groupe d’unités ; 1 à 9 : le rappeler. Formation compacte ou en ligne : boutons dans le panneau de commandes, ou F et L.
- ZQSD / WASD / flèches : déplacer la caméra. Molette : zoom. Le bouton ? ouvre l'aide en jeu. Clique ou glisse sur la mini-carte en bas à droite pour déplacer rapidement la caméra.

Les unités suivent des angles libres sur le terrain ouvert tout en respectant les ponts et obstacles, contournent les autres unités et recalculent leur trajet lorsqu’elles restent bloquées. Les ouvriers peuvent emprunter différents côtés du sanctuaire pour déposer les ressources, même à plusieurs sur un même gisement.

La construction est refusée si un ouvrier ou un soldat se tient sur le futur emplacement. Éloigne les unités, puis relance la construction.

Un chantier interrompu reste en place : sélectionne un ou plusieurs ouvriers, puis fais un clic droit sur le bâtiment inachevé pour reprendre sans repayer.

La maison coûte 65 bois et augmente la limite de population de 5. La caserne coûte 120 bois, 55 or et 50 pierre. L'ouvrier coûte 55 nourriture ; le fantassin 65 nourriture et 35 or ; l’archer 55 nourriture, 35 bois et 25 or. L’archer a moins de vie, mais attaque de plus loin avec des flèches visibles qui infligent leurs dégâts à l’impact. La partie démarre avec 350 nourriture, 260 bois, 240 or et 90 pierre : assez pour construire une caserne et former plusieurs fantassins sans récolter au préalable. Pour le début de partie, lance la caserne avec un ouvrier, forme tes premiers défenseurs, puis place-les près de ton sanctuaire ou d’un pont. En Normal, la première attaque rassemble dix unités après environ quatre minutes de jeu ; les suivantes grandissent avec le temps et les ressources jusqu’à dix-huit unités. En Simple, la première vague de six arrive plus tard ; en Difficile, quatorze unités peuvent attaquer plus tôt. Prépare tes défenses dès le début. L’IA récolte les ressources de la carte, paie ses unités et envoie aussi des archers. Les gisements contiennent désormais 900 à 2 000 ressources selon leur type pour permettre des parties plus longues.

## Modifier le jeu

Les coûts et caractéristiques sont dans `js/data.js`, l'état du monde et la carte dans `js/world.js`, les règles dans `js/game.js`, le dessin dans `js/render.js`, les commandes dans `js/main.js`, la caméra dans `js/camera.js` et le style dans `css/game.css`. Pour modifier le jeu, édite les modules, puis lance `node tools/build-standalone.mjs` pour reconstruire `js/game-standalone.js` ; Node.js sert uniquement au développement, pas au joueur. Les tests se lancent avec `node --test` depuis le dossier extrait.

Le jeu comprend trois âges, des améliorations militaires et économiques, un champion, une unité mythologique et deux pouvoirs du sanctuaire.

## Terrain de la carte V0.16

L’image affichée (`assets/battlefield.png`) reste propre. Les collisions sont déjà intégrées dans `js/terrain.js` : eau (`#`) et rochers (`X`) infranchissables, forêts (`g`) accessibles à 50 % de vitesse, sol libre (`.`). La construction est réservée au sol libre, y compris pour l’emprise du bâtiment. Les trajets tiennent compte du coût des forêts et utilisent les ponts.

La référence annotée `tools/reference-hitbox.png` et le script `tools/build-hitboxes.py` permettent de régénérer les données pendant le développement. **Pour jouer, aucun script ni Python n’est nécessaire.** Si tu modifies les sources JavaScript, reconstruis `js/game-standalone.js` avec `node tools/build-standalone.mjs` sur une machine de développement ; le ZIP contient déjà ce fichier prêt à lancer.

## Combat V0.13

La caserne forme les fantassins et lanciers à l’Âge I ; archers et cavaliers sont débloqués à l’Âge II, et les champions à l’Âge III. Le gardien mythique est formé dans l’atelier à l’Âge III. Leurs caractéristiques sont définies dans `js/data.js` : points de vie, dégâts, armure, portée, cadence, vitesse, population et prix. Les cavaliers occupent deux places de population.

Les contres donnent un bonus de dégâts de 20 % avant l’armure : lancier contre cavalier, cavalier contre archer, archer contre fantassin. Ces valeurs et la vitesse et la portée maximale des flèches sont regroupées dans `COMBAT` dans `js/data.js`. Les flèches se déplacent vers leur cible ; un tir qui ne peut plus toucher disparaît après sa portée maximale ou si sa cible meurt. Les combattants repèrent automatiquement les ennemis proches et reprennent une cible quand la précédente disparaît.

## Intelligence artificielle V0.14

L’IA recrute progressivement de nouveaux ouvriers, distribue les tâches de collecte entre nourriture, bois, or et pierre, et paie chaque bâtiment et unité avec ses propres ressources. Elle ajoute des maisons avant d’atteindre sa limite de population et une seconde caserne lorsque le bois et la pierre récoltés le permettent. Ses bâtiments sont réellement construits par des ouvriers ; leurs chantiers peuvent reprendre après une interruption. Les implantations de l’IA laissent accessibles les gisements voisins.

L’armée attend d’être assez nombreuse : les seuils configurables dans `AI.waveStages` (`js/data.js`) passent à 6, 11 et 20 unités à mesure que la partie avance. Le temps entre les vagues augmente aussi. L’IA répartit les entraînements entre fantassins, lanciers, archers et cavaliers selon ses ressources et l’effectif déjà présent ; elle peut différer un entraînement pour économiser en vue d’un cavalier.

Une incursion près de ses bâtiments déclenche la défense par quelques soldats, sans engager les ouvriers. Les soldats partis en attaque peuvent être rappelés et reprennent leur mission après l’alerte. Les offensives alternent entre deux ponts vérifiés par le pathfinding ; si le passage prévu devient impossible, elles recalculent un chemin valide en tenant compte des obstacles.

## Déplacements et formations V0.15

Sélectionne tes unités au rectangle, par double clic sur un type visible, ou en composant une sélection avec Maj + clic. Maj + clic sur une unité déjà sélectionnée la retire. Ctrl + 1 à 9 mémorise un groupe ; la touche numérique correspondante rappelle les unités survivantes.

Les boutons « Compacte » et « En ligne » (raccourcis F et L) fixent la disposition des prochains ordres de déplacement. Chaque membre reçoit une position distincte accessible, en fonction de l’orientation du trajet. Les trajets utilisent les collisions et le pathfinding existants ; les unités se succèdent aux passages étroits et recalculent leurs trajets si elles sont bloquées. Clic droit sur un sanctuaire allié : les ouvriers chargés rapportent leurs ressources, les autres unités se rapprochent du bâtiment.

## Brouillard de guerre et mini-carte V0.16

Une zone inexplorée est masquée. Une zone déjà explorée reste sombre lorsqu’aucune unité ou construction alliée ne la voit. Les unités et bâtiments ennemis sont affichés et ciblables uniquement lorsqu’ils se trouvent dans une zone actuellement visible. Les gisements précédemment découverts restent visibles sous le brouillard sombre. Les rayons de vision de chaque type d’unité et de bâtiment sont réglables dans `js/data.js`.

La mini-carte reflète les mêmes zones visibles, explorées ou inconnues. Elle représente le terrain, les cours d’eau et obstacles, les unités et bâtiments alliés, les ennemis actuellement repérés et le cadre de la caméra. Un clic ou un glissement du bouton gauche sur la mini-carte déplace la caméra ; cela ne change pas la sélection des unités.

## Sprites des factions V0.19

Les cinq unités et les trois bâtiments de chaque faction utilisent les planches fournies : bleu pour le joueur et rouge pour l’IA. Les cinq unités bleues et les cinq unités rouges proviennent désormais de planches individuelles transparentes, sans les plages blanches des anciennes découpes ; le cavalier rouge utilise également la planche jointe. Les unités affichent leurs poses d’attente, de marche et d’action ; les deux ouvriers disposent de poses de construction. Les planches contiennent aussi les poses de mort pour une éventuelle animation future. Les bâtiments rouges proviennent de la planche précédente. Les images prêtes à afficher se trouvent dans `assets/sprites/` ; les planches originales sont conservées dans `assets/sprite-sources/`. Le brouillard de guerre continue de masquer les ennemis hors du champ de vision. Si une image manque ou tarde à se charger, le dessin précédent prend le relais.

Le jeu se lance toujours directement par `index.html`, sans Python, PHP ni réseau. Pour modifier les planches sur une machine de développement, `python3 tools/extract-sprites.py` régénère les images transparentes avec Pillow, NumPy et SciPy ; puis `node tools/build-standalone.mjs` reconstruit le JavaScript autonome si son code a changé. Ces outils ne sont pas nécessaires sur le PC utilisé pour jouer.

## Âges et technologies V0.20

Le joueur et l’IA commencent à l’Âge I. Sélectionne le sanctuaire pour acheter le passage à l’Âge II puis à l’Âge III. Les recherches prennent du temps ; le sanctuaire ne peut pas former d’ouvrier pendant un passage d’âge. Les coûts et durées se règlent dans `AGES` (`js/data.js`). Un bâtiment ou une unité ne peut être créé avant son âge de déblocage (`UNLOCK_AGE`).

À l’Âge II, construis un atelier avec un ouvrier et sélectionne-le pour acheter des technologies de dégâts, santé, armure, récolte et déplacement. À l’Âge III, tu peux poursuivre ces recherches et former un champion à la caserne ou un gardien mythique à l’atelier. Chaque amélioration occupe temporairement un atelier ; ses effets profitent aux unités existantes et futures. Les technologies, leurs effets et leurs prérequis sont regroupés dans `TECHNOLOGIES` (`js/data.js`).

À l’Âge III, sélectionne le sanctuaire pour déclencher la Bénédiction astrale (soigne les alliés blessés proches) ou la Tempête astrale (attaque des ennemis visibles proches). Les pouvoirs coûtent des ressources et possèdent chacun un temps de recharge. Leurs coûts et portées sont définis dans `POWERS` (`js/data.js`). L’IA progresse elle aussi et peut utiliser ces pouvoirs pour défendre sa base. Le champion et le gardien mythique réutilisent des poses existantes, distinguées dans le jeu par leur taille et leur aura.

## Difficulté de l’IA — V0.20.1

Au lancement de chaque partie, choisis **Simple**, **Normal** ou **Difficile**. Le choix est indiqué dans l’en-tête et reste actif jusqu’à la fin de cette partie. « Nouvelle partie » permet de choisir à nouveau. Normal est le niveau par défaut dans le moteur.

Simple laisse plus de temps avant la première attaque et déploie surtout de petits groupes de fantassins et de lanciers. Normal ouvre avec une dizaine d’unités puis développe des armées mixtes. Difficile prépare d’abord 14 unités, réagit aux troupes adverses qu’il peut voir après un délai d’analyse, défend plus vite et partage ses raids entre les deux ponts. Il gère davantage de villageois pour renouveler ses attaques. Les trois niveaux utilisent les mêmes caractéristiques, prix, temps de production, ressources de départ et récoltes.

Les réglages sont centralisés dans `AI_DIFFICULTIES` (`js/data.js`). `economicBonus` vaut 0 pour tous les niveaux ; il réserve seulement un emplacement pour un éventuel équilibrage futur et n’ajoute actuellement aucune ressource. Les chemins utilisent toujours les collisions et ponts de la carte. Le gisement d’or central a été décalé sur une case accessible afin que les villageois puissent réellement y récolter après épuisement du gisement près de la base.

## Équilibrage V0.20.2

Normal produit et répartit davantage de villageois, réagit aux groupes militaires qu’il voit (au moins quatre unités d’un type), mobilise plus de défenseurs et envoie des vagues de 10, 14, 16 puis 18 unités. Il retarde volontairement l’Âge III jusqu’à sa troisième offensive pour conserver une pression militaire continue. Difficile conserve ses grandes attaques réparties sur deux itinéraires. Simple reste le niveau de découverte. Aucun niveau ne reçoit de ressources gratuites ni de bonus de caractéristiques.

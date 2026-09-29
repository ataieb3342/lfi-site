# RTS mythologique web — conception V0.1

## Intention

Créer un jeu de stratégie en temps réel original, inspiré des mécaniques du genre mythologique, que le joueur puisse télécharger puis lancer sur son PC. Cette première version doit former une partie courte et jouable contre une IA. Les noms, visuels, factions et textes seront originaux. Le projet doit être découpé en modules JavaScript pour permettre les évolutions futures sans réécrire le jeu entier.

## Périmètre proposé

Une faction jouable et un camp adverse, sur une carte unique vue du dessus. Le joueur commence avec un centre de village et trois ouvriers. Ressources : nourriture, bois et or. Les ouvriers récoltent sur ordre et rapportent automatiquement au centre. Le joueur construit une maison et une caserne, produit des ouvriers et des soldats, puis détruit le centre adverse pour gagner. Il perd si son propre centre est détruit. L'IA produit des soldats et attaque périodiquement ; elle peut récolter avec une économie simplifiée.

Les coûts, durées, points de vie et dégâts seront réunis dans des fichiers de données faciles à régler. Les bâtiments en chantier nécessitent un ouvrier et deviennent utilisables après construction. Les unités évitent les bâtiments et obstacles, et les ordres restent exécutables après déplacement de la caméra.

## Commandes et interface

- Clic gauche : sélectionner une unité ou un bâtiment ; glisser : sélectionner plusieurs unités.
- Clic droit : déplacer, récolter, construire ou attaquer selon la cible et l'outil actif.
- Barre latérale : actions accessibles pour la sélection, coûts et files de production.
- Caméra : touches ZQSD et WASD, déplacement aux bords de l'écran ; molette pour zoomer.
- Interface : ressources, sélection, santé, aide des commandes, message de victoire ou défaite et bouton recommencer.

Les interactions doivent fonctionner à la souris sur navigateur de bureau. Une partie reste entièrement locale : aucun compte, serveur, bibliothèque externe ni sauvegarde en ligne nécessaires pour la V0.1.

## Structure technique

`index.html` et `css/game.css` portent l'écran. `js/main.js` initialise le jeu. Des modules ES natifs séparent : boucle de jeu et état ; carte/caméra/rendu Canvas 2D ; unités et bâtiments ; ordres et sélection ; économie et production ; combat et IA ; données de réglage. Un petit serveur local (`python -m http.server`) permet d'exécuter les modules ES depuis un navigateur. Le livrable est une archive ZIP contenant les sources et un README avec les commandes de démarrage.

Le moteur utilise une boucle à pas de temps borné et dessine uniquement la fenêtre visible. Les positions des objets sont conservées en coordonnées du monde, indépendamment de la caméra. La navigation doit contourner les bâtiments fixes ; un algorithme de grille simple suffit pour cette carte et ces effectifs.

## Séquence de réalisation

1. Carte, caméra, affichage, sélection et ordres de déplacement.
2. Ressources, récolte et livraison ; construction de maisons et casernes.
3. Formation des unités, combat, IA et conditions de victoire.
4. Ajustement d'une partie complète, vérification du chargement et du jeu, documentation et ZIP.

## Critères de validation

La partie se lance depuis le serveur local sans erreur JavaScript. On peut sélectionner les trois ouvriers, récolter chacune des trois ressources, construire une maison et une caserne, entraîner au moins un soldat, attaquer le camp ennemi, gagner ou perdre, puis recommencer. La navigation, le zoom et les commandes fonctionnent après déplacement de la caméra. Chaque fonctionnalité principale est dans un module ciblé, sans dépendances à télécharger.

## Hors V0.1

Autres factions, changements d'âge, divinités et pouvoirs, créatures mythologiques, brouillard de guerre, multijoueur et sauvegardes : ces systèmes seront des étapes ultérieures.

## Points à confirmer

Ce document propose la direction artistique initiale (formes et couleurs originales dessinées en Canvas) et les raccourcis clavier. Ils peuvent être ajustés après un premier essai. La carte, les coûts et l'équilibrage constituent une base de prototype.

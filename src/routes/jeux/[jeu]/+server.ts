import type { RequestHandler } from './$types';
import { servirFichierDeJeu } from './fichiers';

// La page d'un jeu vit à `/jeux/snake/`, avec la barre finale : c'est ce qui
// permet à son `index.html` de charger `style.css` et `game.js` par des
// adresses relatives, sans rien modifier dans le jeu.
export const trailingSlash = 'always';

export const GET: RequestHandler = ({ params }) => servirFichierDeJeu(params.jeu, 'index.html');

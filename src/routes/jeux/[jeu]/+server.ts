import type { RequestHandler } from './$types';
import { JEUX } from '$lib/jeux';
import { servirFichierEmbarque } from '$lib/fichiers-embarques';

// La page d'un jeu vit à `/jeux/snake/`, avec la barre finale : c'est ce qui
// permet à son `index.html` de charger `style.css` et `game.js` par des
// adresses relatives, sans rien modifier dans le jeu.
export const trailingSlash = 'always';

const DOSSIERS = JEUX.map((jeu) => jeu.dossier);

export const GET: RequestHandler = ({ params }) =>
	servirFichierEmbarque('jeux', DOSSIERS, params.jeu, 'index.html');

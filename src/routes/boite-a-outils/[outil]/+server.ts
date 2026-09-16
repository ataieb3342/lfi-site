import type { RequestHandler } from './$types';
import { OUTILS } from '$lib/boite-a-outils';
import { servirFichierEmbarque } from '$lib/fichiers-embarques';

// Comme pour les jeux, la page vit à `/boite-a-outils/qui-paie/`, avec la barre
// finale : c'est ce qui permet à son `index.html` de charger `style.css` et
// `outil.js` par des adresses relatives.
export const trailingSlash = 'always';

const DOSSIERS = OUTILS.map((outil) => outil.dossier);

export const GET: RequestHandler = ({ params }) =>
	servirFichierEmbarque('boite-a-outils', DOSSIERS, params.outil, 'index.html');

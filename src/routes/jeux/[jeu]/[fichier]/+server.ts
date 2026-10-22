import type { RequestHandler } from './$types';
import { JEUX } from '$lib/jeux';
import { servirFichierEmbarque } from '$lib/fichiers-embarques';

const DOSSIERS = JEUX.map((jeu) => jeu.dossier);

export const GET: RequestHandler = ({ params, url }) =>
	servirFichierEmbarque('jeux', DOSSIERS, params.jeu, params.fichier, url.origin);

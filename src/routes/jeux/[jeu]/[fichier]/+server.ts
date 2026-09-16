import type { RequestHandler } from './$types';
import { JEUX } from '$lib/jeux';
import { servirFichierEmbarque } from '$lib/fichiers-embarques';

const DOSSIERS = JEUX.map((jeu) => jeu.dossier);

export const GET: RequestHandler = ({ params }) =>
	servirFichierEmbarque('jeux', DOSSIERS, params.jeu, params.fichier);

import type { RequestHandler } from './$types';
import { OUTILS } from '$lib/boite-a-outils';
import { servirFichierEmbarque } from '$lib/fichiers-embarques';

const DOSSIERS = OUTILS.map((outil) => outil.dossier);

export const GET: RequestHandler = ({ params }) =>
	servirFichierEmbarque('boite-a-outils', DOSSIERS, params.outil, params.fichier);

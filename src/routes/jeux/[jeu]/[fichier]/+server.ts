import type { RequestHandler } from './$types';
import { servirFichierDeJeu } from '../fichiers';

export const GET: RequestHandler = ({ params }) => servirFichierDeJeu(params.jeu, params.fichier);

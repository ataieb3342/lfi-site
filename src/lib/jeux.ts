/**
 * Les jeux de la bibliothèque.
 *
 * Chaque jeu est un dossier de `src/lib/jeux/` contenant un `index.html`,
 * un `game.js` et un `style.css`, écrits à la main et sans dépendance. Il est
 * servi tel quel à l'adresse `/jeux/<dossier>/` par `src/routes/jeux/`.
 *
 * Pour ajouter un jeu : déposer son dossier ici et ajouter une ligne ci-dessous.
 * Un jeu absent de cette liste n'est pas servi, même si son dossier existe.
 */
export const JEUX = [
	{
		dossier: 'snake',
		titre: 'Tortue Mélenchon',
		description: 'Un snake : aide la tortue à récupérer le plus de votes possible.'
	},
	{
		dossier: 'pinball',
		titre: 'Space DSN',
		description: 'Un flipper dans l’espace, au clavier.'
	}
] as const;

export type Jeu = (typeof JEUX)[number];

export function urlJeu(jeu: Jeu): string {
	return `/jeux/${jeu.dossier}/`;
}

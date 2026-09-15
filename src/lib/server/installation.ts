import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { countAdmins } from './auth.ts';
import { randomToken, safeEqual } from './crypto.ts';

/**
 * Première installation.
 *
 * Le moment le plus dangereux de la vie d'un site est celui qui suit sa mise
 * en ligne : si la page de création du premier compte est librement
 * accessible, le premier robot venu prend la main sur le site.
 *
 * Tant qu'aucun administrateur n'existe, le serveur génère donc un jeton
 * d'installation à usage unique, écrit sur le disque et affiché dans les
 * journaux du serveur. Il faut le fournir pour créer le premier compte.
 * Le jeton est détruit dès que ce compte est créé.
 */

const CHEMIN = resolve(
	process.env.DATABASE_PATH ? dirname(resolve(process.env.DATABASE_PATH)) : 'data',
	'jeton-installation.txt'
);

export function installationRequise(): boolean {
	return countAdmins() === 0;
}

export function preparerJetonInstallation(): string | null {
	if (!installationRequise()) {
		supprimerJetonInstallation();
		return null;
	}
	if (!existsSync(CHEMIN)) {
		mkdirSync(dirname(CHEMIN), { recursive: true });
		writeFileSync(CHEMIN, randomToken(24), { mode: 0o600 });
	}
	const jeton = readFileSync(CHEMIN, 'utf8').trim();

	console.log(
		'\n' +
			'  ┌────────────────────────────────────────────────────────────────┐\n' +
			'  │  AUCUN COMPTE ADMINISTRATEUR                                   │\n' +
			'  │  Ouvrez /admin/installation et saisissez ce jeton :             │\n' +
			`  │  ${jeton.padEnd(62)}│\n` +
			'  └────────────────────────────────────────────────────────────────┘\n'
	);
	return jeton;
}

export function jetonInstallationValide(saisi: string): boolean {
	if (!existsSync(CHEMIN)) return false;
	return safeEqual(readFileSync(CHEMIN, 'utf8').trim(), saisi.trim());
}

export function supprimerJetonInstallation() {
	try {
		if (existsSync(CHEMIN)) unlinkSync(CHEMIN);
	} catch {
		// Sans conséquence : le jeton n'est de toute façon plus accepté une fois
		// qu'un compte administrateur existe.
	}
}

let annonceFaite = false;

/**
 * Appelé à la première requête reçue (et non au chargement du module, pour que
 * la compilation du site n'ait aucun effet de bord).
 */
export function annoncerInstallationSiNecessaire() {
	if (annonceFaite) return;
	annonceFaite = true;
	preparerJetonInstallation();
}

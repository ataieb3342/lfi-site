import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const DEV = process.env.NODE_ENV !== 'production';

/**
 * Clé secrète du serveur. Elle sert à :
 *   - pseudonymiser les adresses IP (HMAC) ;
 *   - signer les défis anti-spam ;
 *   - chiffrer les secrets de double authentification stockés en base.
 *
 * En production elle DOIT venir de la variable d'environnement SECRET_KEY.
 * Si elle change, toutes les sessions et toutes les 2FA sont invalidées :
 * ne pas la régénérer à la légère, et la sauvegarder avec la base.
 *
 * La clé est lue à la première utilisation, jamais au chargement du module :
 * la compilation du site n'a ainsi pas besoin des secrets de production.
 */
let cache: Buffer | null = null;

export function secretKey(): Buffer {
	if (cache) return cache;

	if (process.env.SECRET_KEY && process.env.SECRET_KEY.length >= 32) {
		cache = Buffer.from(process.env.SECRET_KEY, 'utf8');
		return cache;
	}

	if (!DEV) {
		throw new Error(
			'SECRET_KEY manquante ou trop courte (32 caractères minimum). ' +
				'Générez-la avec : openssl rand -base64 48'
		);
	}

	// En développement seulement : on génère une clé et on la garde sur disque
	// pour ne pas invalider les sessions à chaque redémarrage.
	const chemin = resolve(dossierDonnees(), '.dev-secret');
	if (!existsSync(chemin)) {
		mkdirSync(dirname(chemin), { recursive: true });
		writeFileSync(chemin, randomBytes(48).toString('base64'), { mode: 0o600 });
	}
	chmodSync(chemin, 0o600);
	console.warn('[secret] SECRET_KEY absente : clé de développement utilisée.');
	cache = Buffer.from(readFileSync(chemin, 'utf8'), 'utf8');
	return cache;
}

/** Dossier qui contient la base et les images. Sauvegardez-le en entier. */
export function dossierDonnees(): string {
	return process.env.DATABASE_PATH ? dirname(resolve(process.env.DATABASE_PATH)) : resolve('data');
}

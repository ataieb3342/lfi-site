import { createHash, randomInt } from 'node:crypto';
import { db } from './db.ts';
import { hmac, randomToken, safeEqual } from './crypto.ts';

/**
 * Anti-spam par preuve de travail, sans service tiers et sans cookie.
 *
 * Le principe : le serveur envoie un petit casse-tête que le navigateur résout
 * en force brute (quelques centaines de millisecondes, invisible pour un
 * humain qui rédige un commentaire). Un robot qui voudrait poster en masse
 * doit payer ce coût à chaque envoi, ce qui rend le spam industriel peu
 * rentable.
 *
 * Avantages sur un reCAPTCHA : aucune donnée n'est envoyée à Google, rien à
 * cliquer, accessible aux lecteurs d'écran, et conforme au RGPD par défaut.
 */

const MAX_NUMBER = 30_000; // ~15 000 hachages en moyenne
const TTL_MS = 30 * 60_000; // 30 minutes pour rédiger

export type Challenge = {
	salt: string;
	challenge: string;
	maxnumber: number;
	expires: number;
	signature: string;
};

function sign(challenge: string, expires: number): string {
	return hmac('captcha', `${challenge}.${expires}`);
}

export function createChallenge(): Challenge {
	const salt = randomToken(12);
	const expires = Date.now() + TTL_MS;
	const secretNumber = randomInt(0, MAX_NUMBER);
	const challenge = createHash('sha256').update(`${salt}${secretNumber}`).digest('hex');
	return { salt, challenge, maxnumber: MAX_NUMBER, expires, signature: sign(challenge, expires) };
}

export type Solution = { salt: string; number: number; expires: number; signature: string };

/**
 * Vérifie une solution renvoyée par le navigateur.
 *
 * Le serveur ne mémorise aucun défi : il recalcule le hachage à partir du sel
 * et du nombre trouvé, puis vérifie que sa propre signature HMAC correspond.
 * Un défi ne peut donc pas être fabriqué, et la table `used_challenges`
 * empêche de rejouer plusieurs fois la même solution.
 */
export function verifySolution(payload: string): boolean {
	let solution: Solution;
	try {
		solution = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
	} catch {
		return false;
	}

	const { salt, number, expires, signature } = solution ?? {};
	if (typeof salt !== 'string' || typeof signature !== 'string') return false;
	if (!Number.isInteger(number) || number < 0 || number > MAX_NUMBER) return false;
	if (!Number.isInteger(expires) || expires < Date.now()) return false;

	const challenge = createHash('sha256').update(`${salt}${number}`).digest('hex');
	if (!safeEqual(signature, sign(challenge, expires))) return false;

	// Rejeu : une solution ne vaut que pour un seul envoi.
	try {
		db().prepare('insert into used_challenges (token, expires_at) values (?, ?)').run(signature, expires);
	} catch {
		return false; // déjà utilisée
	}
	return true;
}

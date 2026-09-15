import { db } from './db.ts';

export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

function compter(bucket: string, depuis: number) {
	return db()
		.prepare(
			'select count(*) as n, min(created_at) as oldest from rate_limits where bucket = ? and created_at > ?'
		)
		.get(bucket, depuis) as { n: number; oldest: number | null };
}

/**
 * Limitation de débit par fenêtre glissante, stockée en base plutôt qu'en
 * mémoire : les compteurs survivent à un redémarrage, donc un attaquant ne
 * peut pas les remettre à zéro en faisant tomber le process.
 *
 * @param bucket  identifiant du compteur, ex. `comment:<hash ip>`
 * @param limit   nombre d'actions autorisées dans la fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(bucket: string, limit: number, windowMs: number): RateResult {
	const nowMs = Date.now();
	const since = nowMs - windowMs;
	const { n, oldest } = compter(bucket, since);

	if (n >= limit) {
		const retryAfterSec = Math.max(1, Math.ceil(((oldest ?? nowMs) + windowMs - nowMs) / 1000));
		return { ok: false, remaining: 0, retryAfterSec };
	}

	db().prepare('insert into rate_limits (bucket, created_at) values (?, ?)').run(bucket, nowMs);
	return { ok: true, remaining: limit - n - 1, retryAfterSec: 0 };
}

/** Consultation sans consommer de jeton. */
export function rateLimitPeek(bucket: string, limit: number, windowMs: number): RateResult {
	const nowMs = Date.now();
	const { n, oldest } = compter(bucket, nowMs - windowMs);
	const retryAfterSec =
		n >= limit ? Math.max(1, Math.ceil(((oldest ?? nowMs) + windowMs - nowMs) / 1000)) : 0;
	return { ok: n < limit, remaining: Math.max(0, limit - n), retryAfterSec };
}

/** Remet un compteur à zéro (ex. après une connexion réussie). */
export function rateLimitReset(bucket: string) {
	db().prepare('delete from rate_limits where bucket = ?').run(bucket);
}

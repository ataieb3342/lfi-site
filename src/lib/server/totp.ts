import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Double authentification TOTP (RFC 6238), compatible avec Aegis, FreeOTP,
 * Google Authenticator, Bitwarden, 1Password…
 *
 * Codes à 6 chiffres, fenêtre de 30 secondes, tolérance de ±1 pas pour
 * absorber le décalage d'horloge entre le téléphone et le serveur.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD = 30;
const DIGITS = 6;

export function base32Encode(buf: Buffer): string {
	let bits = 0;
	let value = 0;
	let out = '';
	for (const byte of buf) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
	return out;
}

export function base32Decode(input: string): Buffer {
	const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
	let bits = 0;
	let value = 0;
	const out: number[] = [];
	for (const char of clean) {
		const idx = ALPHABET.indexOf(char);
		if (idx === -1) continue;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

/** Nouveau secret TOTP (160 bits, la taille recommandée pour HMAC-SHA1). */
export function generateTotpSecret(): string {
	return base32Encode(randomBytes(20));
}

function hotp(secret: Buffer, counter: number): string {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64BE(BigInt(counter));
	const digest = createHmac('sha1', secret).update(buf).digest();
	const offset = digest[digest.length - 1] & 0x0f;
	const code =
		((digest[offset] & 0x7f) << 24) |
		(digest[offset + 1] << 16) |
		(digest[offset + 2] << 8) |
		digest[offset + 3];
	return String(code % 10 ** DIGITS).padStart(DIGITS, '0');
}

/** Le code attendu à l'instant présent (sert aux tests et à l'affichage). */
export function currentTotp(secretBase32: string, at = Date.now()): string {
	return hotp(base32Decode(secretBase32), Math.floor(at / 1000 / PERIOD));
}

/** Vérifie un code saisi, avec une tolérance de ±30 s. */
export function verifyTotp(secretBase32: string, token: string, at = Date.now()): boolean {
	const cleaned = token.replace(/\D/g, '');
	if (cleaned.length !== DIGITS) return false;
	const secret = base32Decode(secretBase32);
	const counter = Math.floor(at / 1000 / PERIOD);
	for (const drift of [0, -1, 1]) {
		const expected = Buffer.from(hotp(secret, counter + drift));
		if (timingSafeEqual(expected, Buffer.from(cleaned))) return true;
	}
	return false;
}

/** URI otpauth:// à encoder en QR code pour l'application d'authentification. */
export function totpUri(secretBase32: string, username: string, issuer: string): string {
	const label = encodeURIComponent(`${issuer}:${username}`);
	const params = new URLSearchParams({
		secret: secretBase32,
		issuer,
		algorithm: 'SHA1',
		digits: String(DIGITS),
		period: String(PERIOD)
	});
	return `otpauth://totp/${label}?${params}`;
}

import type { Handle, HandleServerError } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE, resolveSession } from '$lib/server/auth';
import { hmac } from '$lib/server/crypto';
import { annoncerInstallationSiNecessaire } from '$lib/server/installation';
import { modeDemo, preparerDemoSiNecessaire } from '$lib/server/demo';

/** Chemins de l'administration accessibles sans être connecté. */
const PUBLIC_ADMIN_PATHS = ['/admin/connexion', '/admin/installation'];

export const handle: Handle = async ({ event, resolve }) => {
	// En mode démonstration (MODE_DEMO=1), la base est remplie de contenus
	// fictifs et un compte de test est créé avant la première requête.
	await preparerDemoSiNecessaire();
	annoncerInstallationSiNecessaire();

	// L'adresse IP n'est jamais conservée en clair : on n'en garde qu'un HMAC,
	// suffisant pour limiter le spam et bloquer un importun, mais qui ne permet
	// pas de remonter à une personne si la base venait à fuiter.
	let clientAddress = 'inconnue';
	try {
		clientAddress = event.getClientAddress();
	} catch {
		// Certains contextes (prérendu) n'ont pas d'adresse : on continue.
	}
	event.locals.ipHash = hmac('ip', clientAddress);
	event.locals.admin = resolveSession(event.cookies.get(SESSION_COOKIE));

	// Garde d'accès : tout /admin exige une session valide.
	if (event.url.pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.includes(event.url.pathname)) {
		if (!event.locals.admin) {
			const suite = event.url.pathname + event.url.search;
			redirect(303, `/admin/connexion?suite=${encodeURIComponent(suite)}`);
		}
	}

	const response = await resolve(event);

	// En-têtes de sécurité. La CSP elle-même est configurée dans vite.config.ts.
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	response.headers.set(
		'Permissions-Policy',
		'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=(), interest-cohort=()'
	);

	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	}

	// Un site de démonstration ne doit pas apparaître dans les moteurs de recherche.
	if (modeDemo()) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}

	// Les pages d'administration ne doivent jamais être mises en cache, ni par
	// le navigateur ni par un intermédiaire.
	if (event.url.pathname.startsWith('/admin')) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
	}

	return response;
};

/**
 * Les erreurs serveur sont journalisées côté serveur mais jamais renvoyées au
 * visiteur : un message d'erreur détaillé renseigne un attaquant sur la pile
 * technique et les chemins de fichiers.
 */
export const handleError: HandleServerError = ({ error, event, status }) => {
	if (status !== 404) {
		console.error(`[erreur ${status}] ${event.request.method} ${event.url.pathname}`, error);
	}
	return { message: status === 404 ? 'Page introuvable' : "Une erreur est survenue." };
};

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { audit, clearSessionCookie, destroySession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.admin) {
		destroySession(locals.admin.sessionId);
		audit(locals.admin, 'deconnexion', locals.admin.username, '', locals.ipHash);
	}
	clearSessionCookie(cookies);
	redirect(303, '/');
};

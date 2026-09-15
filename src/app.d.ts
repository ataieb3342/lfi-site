import type { AdminSession } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			/** Admin connecté, ou null. Rempli par src/hooks.server.ts. */
			admin: AdminSession | null;
			/** IP pseudonymisée (HMAC). Jamais l'IP en clair : RGPD. */
			ipHash: string;
		}
		interface PageData {
			admin?: { id: number; displayName: string; role: string } | null;
		}
	}
}

export {};

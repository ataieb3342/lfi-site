import type { AdminSession } from '$lib/server/auth';
import type { Theme } from '$lib/server/theme';

declare global {
	namespace App {
		interface Locals {
			/** Admin connecté, ou null. Rempli par src/hooks.server.ts. */
			admin: AdminSession | null;
			/** IP pseudonymisée (HMAC). Jamais l'IP en clair : RGPD. */
			ipHash: string;
			/** Affichage choisi par le visiteur : 'clair', 'sombre' ou 'auto' (suit le système). */
			theme: Theme;
		}
		interface PageData {
			admin?: { id: number; displayName: string; role: string } | null;
		}
	}
}

export {};

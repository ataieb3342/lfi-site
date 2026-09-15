import { db } from './db.ts';

/**
 * Réglages du site, modifiables depuis l'interface d'administration sans
 * toucher au code ni redéployer.
 */
export const DEFAULTS = {
	site_name: 'LFI Dijon Centre',
	site_tagline: "Groupe d'action de La France insoumise",
	site_description:
		"Actualités, analyses et rendez-vous du groupe d'action de La France insoumise du centre de Dijon.",
	contact_email: '',
	/** 'pre' = tout commentaire est validé avant publication ; 'post' = publication immédiate. */
	comments_mode: 'pre' as 'pre' | 'post',
	/** '0' ferme les commentaires sur tout le site, quel que soit le réglage par publication. */
	comments_enabled: '1',

	/* Bandeau de téléchargement de l'application Action populaire, affiché en bas
	   des pages d'actualités. Les adresses sont réglables ici plutôt qu'écrites
	   dans le code : un lien de magasin d'applications change, et le modifier ne
	   doit pas demander de redéploiement. */
	app_bandeau_actif: '1',
	// Fiches officielles de l'application, éditeur « La France insoumise ».
	app_url_android: 'https://play.google.com/store/apps/details?id=fr.actionpopulaire.twa',
	app_url_ios: 'https://apps.apple.com/fr/app/action-populaire/id1559737444'
} satisfies Record<string, string>;

export type SettingKey = keyof typeof DEFAULTS;

export function getSetting<K extends SettingKey>(key: K): string {
	const row = db().prepare('select value from settings where key = ?').get(key) as
		| { value: string }
		| undefined;
	return row?.value ?? String(DEFAULTS[key]);
}

export function getSettings(): Record<SettingKey, string> {
	const rows = db().prepare('select key, value from settings').all() as { key: string; value: string }[];
	const out = { ...DEFAULTS } as Record<string, string>;
	for (const { key, value } of rows) if (key in DEFAULTS) out[key] = value;
	return out as Record<SettingKey, string>;
}

export function setSetting(key: SettingKey, value: string) {
	db().prepare(
		'insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value'
	).run(key, value);
}

export function commentsGloballyOpen(): boolean {
	return getSetting('comments_enabled') === '1';
}

export function preModerationEnabled(): boolean {
	return getSetting('comments_mode') !== 'post';
}

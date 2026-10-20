/**
 * Les médias que le groupe recommande, affichés sur `/medias` et, pour ceux
 * qu'on coche, sur l'accueil.
 *
 * La liste est en base et se gère dans Administration → Médias recommandés
 * (`src/lib/server/medias-recommandes.ts`). Ce fichier ne garde que ce que
 * les pages partagent : les formats et le regroupement par format.
 *
 * Elle doit rester courte. Vingt médias, c'est un annuaire ; cinq, c'est un
 * conseil. Chaque média porte une phrase qui dit pourquoi on le recommande,
 * pas seulement ce qu'il est.
 *
 * Les logos sont servis par le site et jamais chargés depuis celui du média :
 * la CSP l'interdit (`img-src 'self'`), et chaque affichage de l'accueil
 * annoncerait sinon le visiteur à YouTube ou à Mediapart.
 */
export const FORMATS = [
	{ id: 'regarder', titre: 'À regarder' },
	{ id: 'lire', titre: 'À lire' }
] as const;

export type Format = (typeof FORMATS)[number]['id'];

export type MediaRecommandeVue = {
	id: number;
	nom: string;
	format: Format;
	lien: string;
	description: string;
	logo: string;
	accueil: boolean;
};

export function titreFormat(format: Format): string {
	return FORMATS.find((f) => f.id === format)?.titre ?? '';
}

/** Les formats qui ont au moins un média, chacun avec les siens. */
export function mediasParFormat(medias: MediaRecommandeVue[]) {
	return FORMATS.map((format) => ({
		...format,
		medias: medias.filter((m) => m.format === format.id)
	})).filter((f) => f.medias.length > 0);
}

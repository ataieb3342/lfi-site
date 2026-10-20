import { db, now } from './db.ts';
import { getMedia } from './media.ts';
import type { Format } from '$lib/medias';

/**
 * Les médias recommandés (table `medias_recommandes`), gérés depuis
 * Administration → Médias recommandés.
 *
 * Tous sont listés sur `/medias` ; seuls ceux dont `accueil` vaut 1 sont
 * repris sur l'accueil. L'ordre est celui de `position`, choisi à la main.
 */

export type MediaRecommande = {
	id: number;
	nom: string;
	format: Format;
	lien: string;
	description: string;
	logo: string;
	logo_media_id: number | null;
	accueil: number;
	position: number;
	created_at: string;
};

export type ChampsMediaRecommande = {
	nom: string;
	format: Format;
	lien: string;
	description: string;
	accueil: boolean;
};

export function listMediasRecommandes(options: { accueil?: boolean } = {}): MediaRecommande[] {
	const filtre = options.accueil ? 'where accueil = 1' : '';
	return db()
		.prepare(`select * from medias_recommandes ${filtre} order by position, id`)
		.all() as MediaRecommande[];
}

export function getMediaRecommande(id: number): MediaRecommande | undefined {
	return db().prepare('select * from medias_recommandes where id = ?').get(id) as MediaRecommande | undefined;
}

/**
 * Vérifie un formulaire de média. Le lien finit dans un `href` public : seul
 * `https://` est accepté, sinon un `javascript:…` s'exécuterait au clic.
 */
export function lireChampsMediaRecommande(form: FormData): ChampsMediaRecommande | { erreur: string } {
	const nom = String(form.get('nom') ?? '').trim().slice(0, 80);
	const format = form.get('format') === 'lire' ? 'lire' : 'regarder';
	const lien = String(form.get('lien') ?? '').trim().slice(0, 500);
	const description = String(form.get('description') ?? '').trim().slice(0, 300);
	const accueil = form.get('accueil') === '1';

	if (!nom) return { erreur: 'Indiquez le nom du média.' };
	if (!/^https:\/\/[^\s"'<>]+$/.test(lien)) {
		return { erreur: 'Le lien doit être une adresse complète commençant par https://' };
	}
	try {
		new URL(lien);
	} catch {
		return { erreur: 'Le lien n’est pas une adresse valide.' };
	}
	return { nom, format, lien, description, accueil };
}

export function creerMediaRecommande(champs: ChampsMediaRecommande, logoMediaId: number | null): number {
	const logo = logoMediaId ? adresseLogo(logoMediaId) : '';
	const { suivante } = db()
		.prepare('select coalesce(max(position), 0) + 1 as suivante from medias_recommandes')
		.get() as { suivante: number };
	const resultat = db()
		.prepare(
			`insert into medias_recommandes (nom, format, lien, description, logo, logo_media_id, accueil, position, created_at)
			 values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(champs.nom, champs.format, champs.lien, champs.description, logo, logoMediaId, champs.accueil ? 1 : 0, suivante, now());
	return Number(resultat.lastInsertRowid);
}

/** `logoMediaId` à `null` garde le logo actuel. */
export function modifierMediaRecommande(id: number, champs: ChampsMediaRecommande, logoMediaId: number | null) {
	db()
		.prepare('update medias_recommandes set nom = ?, format = ?, lien = ?, description = ?, accueil = ? where id = ?')
		.run(champs.nom, champs.format, champs.lien, champs.description, champs.accueil ? 1 : 0, id);
	if (logoMediaId) {
		db()
			.prepare('update medias_recommandes set logo = ?, logo_media_id = ? where id = ?')
			.run(adresseLogo(logoMediaId), logoMediaId, id);
	}
}

export function basculerAccueil(id: number, accueil: boolean) {
	db().prepare('update medias_recommandes set accueil = ? where id = ?').run(accueil ? 1 : 0, id);
}

/** Échange la place d'un média avec son voisin du dessus ou du dessous. */
export function deplacerMediaRecommande(id: number, sens: 'haut' | 'bas') {
	const liste = listMediasRecommandes();
	const i = liste.findIndex((m) => m.id === id);
	const j = sens === 'haut' ? i - 1 : i + 1;
	if (i < 0 || j < 0 || j >= liste.length) return;
	[liste[i], liste[j]] = [liste[j], liste[i]];
	// Les positions sont renumérotées à chaque fois : deux médias qui auraient
	// la même position ne pourraient sinon jamais être départagés.
	const maj = db().prepare('update medias_recommandes set position = ? where id = ?');
	db().exec('begin');
	try {
		liste.forEach((m, k) => maj.run(k + 1, m.id));
		db().exec('commit');
	} catch (err) {
		db().exec('rollback');
		throw err;
	}
}

export function supprimerMediaRecommande(id: number) {
	db().prepare('delete from medias_recommandes where id = ?').run(id);
}

function adresseLogo(mediaId: number): string {
	const media = getMedia(mediaId);
	return media ? `/media/${media.filename}` : '';
}

import { RUBRIQUE_PAR_KIND, type Kind } from '$lib/rubriques';

const MOIS = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

/**
 * « 3 septembre 2026 »
 *
 * Une date seule (AAAA-MM-JJ) est interprétée à midi : sans cela, elle serait
 * lue à minuit UTC et pourrait s'afficher la veille selon le fuseau du visiteur.
 */
export function formatDate(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
	if (Number.isNaN(d.getTime())) return '';
	return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** « 3 septembre 2026 à 14h05 » */
export function formatDateTime(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${formatDate(iso)} à ${hh}h${mm}`;
}

/** « il y a 3 jours » — pour la file de modération. */
export function formatRelative(iso: string | null | undefined): string {
	if (!iso) return '';
	const diff = Date.now() - new Date(iso).getTime();
	const min = Math.round(diff / 60000);
	if (min < 1) return "à l'instant";
	if (min < 60) return `il y a ${min} min`;
	const h = Math.round(min / 60);
	if (h < 24) return `il y a ${h} h`;
	const j = Math.round(h / 24);
	if (j < 31) return `il y a ${j} jour${j > 1 ? 's' : ''}`;
	return formatDate(iso);
}

/** Taille lisible d'un document : « 820 Ko » ou « 45,2 Mo ». */
export function formatTailleFichier(octets: number): string {
	if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
	return `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

export const LIBELLE_KIND: Record<string, string> = {
	article: 'Article',
	actu: 'Actualité',
	apero: 'Apéro thématique'
};

/**
 * Couleur de chaque type de publication, prise aux trois couleurs du logo :
 * violet pour les articles, rouge pour les actualités, pourpre pour les apéros.
 * Sert aux étiquettes des listes et aux surfaces du carrousel.
 */
export const COULEUR_KIND: Record<string, string> = {
	article: 'text-brand',
	actu: 'text-accent',
	apero: 'text-pourpre'
};

/** Surface colorée de chaque type (voir app.css), pour les diapositives. */
export const FOND_KIND: Record<string, string> = {
	article: 'fond-degrade',
	actu: 'fond-actu',
	apero: 'fond-apero'
};

/** Chemin public d'une publication. */
export function lienPublication(kind: string, slug: string): string {
	const rubrique = RUBRIQUE_PAR_KIND[kind as Kind] ?? 'actualites';
	return `/${rubrique}/${slug}`;
}

/**
 * Date d'une action à venir, en version courte : « mer. 18 sept. ».
 * Utilisée dans les listes, où la ligne doit rester compacte.
 */
export function formatDateCourte(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** « lundi 28 septembre 2026 » — la date d'un rendez-vous, jour de la semaine compris. */
export function formatDateLongue(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

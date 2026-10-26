import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBySlugAnyStatus } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import { toPlainText } from '$lib/server/markdown';
import { getSettings } from '$lib/server/settings';
import { KIND_PAR_RUBRIQUE, type Rubrique } from '$lib/rubriques';
import { fichierIcs, rendezVous } from '$lib/agenda';

/**
 * Le rendez-vous d'une fiche, au format des agendas : l'iPhone ou le Mac
 * proposent de l'ajouter dès qu'on l'ouvre. Voir `src/lib/agenda.ts`.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const publication = getBySlugAnyStatus(params.slug);
	const kindAttendu = KIND_PAR_RUBRIQUE[params.rubrique as Rubrique];
	// Un brouillon n'est pas public, et un article n'est pas un rendez-vous.
	if (!publication || publication.kind !== kindAttendu || publication.status !== 'published' || !publication.event_at) {
		error(404, 'Page introuvable');
	}

	const settings = getSettings();
	const vue = presentPublication(publication);
	const cadre = {
		rythme: settings.apero_rythme,
		heure: settings.apero_heure,
		lieu: settings.apero_lieu,
		adresse: settings.apero_adresse,
		presentation: settings.apero_presentation
	};
	const adresse = `${url.origin}/${params.rubrique}/${publication.slug}`;
	const r = rendezVous(vue, cadre, vue.summary || toPlainText(publication.body, 300), adresse);
	if (!r) error(404, 'Page introuvable');

	return new Response(fichierIcs(r, `publication-${publication.id}@${url.hostname}`, settings.site_name), {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${publication.slug}.ics"`,
			'Cache-Control': 'public, max-age=300'
		}
	});
};

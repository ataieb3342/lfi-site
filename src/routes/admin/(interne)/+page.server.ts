import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listForAdmin } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import { recentAudit } from '$lib/server/auth';
import { picRecent, resumeFrequentation } from '$lib/server/frequentation';

export const load: PageServerLoad = async () => {
	const compte = (sql: string) => (db().prepare(sql).get() as { n: number }).n;

	return {
		stats: {
			aLaUne: compte("select count(*) as n from publications where pinned = 1 and status = 'published'"),
			articles: compte("select count(*) as n from publications where kind = 'article' and status = 'published'"),
			rendezVous: compte(
				"select count(*) as n from publications where kind in ('actu', 'apero') and status = 'published' and event_at >= date('now', 'localtime')"
			),
			brouillons: compte("select count(*) as n from publications where status = 'draft'"),
			commentaires: compte("select count(*) as n from comments where status = 'approved'")
		},
		recentes: listForAdmin().slice(0, 6).map(presentPublication),
		journal: recentAudit(8),
		frequentation: resumeFrequentation(),
		picRecent: picRecent()
	};
};

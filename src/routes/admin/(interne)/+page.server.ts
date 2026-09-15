import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listForAdmin } from '$lib/server/content';
import { presentPublication } from '$lib/server/present';
import { recentAudit } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	const compte = (sql: string) => (db().prepare(sql).get() as { n: number }).n;

	return {
		stats: {
			articles: compte("select count(*) as n from publications where kind = 'article' and status = 'published'"),
			actus: compte("select count(*) as n from publications where kind = 'actu' and status = 'published'"),
			brouillons: compte("select count(*) as n from publications where status = 'draft'"),
			commentaires: compte("select count(*) as n from comments where status = 'approved'")
		},
		recentes: listForAdmin().slice(0, 6).map(presentPublication),
		journal: recentAudit(8)
	};
};

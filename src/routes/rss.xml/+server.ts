import type { RequestHandler } from './$types';
import { listPublished } from '$lib/server/content';
import { toPlainText } from '$lib/server/markdown';
import { getSettings } from '$lib/server/settings';
import { RUBRIQUE_PAR_KIND } from '$lib/rubriques';

function echapper(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Flux RSS : permet de suivre le site sans réseau social ni compte. */
export const GET: RequestHandler = async ({ url }) => {
	const settings = getSettings();
	const publications = listPublished({ limit: 40 });
	const base = url.origin;

	const items = publications
		.map((p) => {
			const lien = `${base}/${RUBRIQUE_PAR_KIND[p.kind]}/${p.slug}`;
			const description = p.summary || toPlainText(p.body, 400);
			return `		<item>
			<title>${echapper(p.title)}</title>
			<link>${echapper(lien)}</link>
			<guid isPermaLink="true">${echapper(lien)}</guid>
			<pubDate>${new Date(p.published_at ?? p.created_at).toUTCString()}</pubDate>
			<description>${echapper(description)}</description>
		</item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${echapper(settings.site_name)}</title>
		<link>${echapper(base)}</link>
		<description>${echapper(settings.site_description)}</description>
		<language>fr</language>
		<atom:link href="${echapper(base)}/rss.xml" rel="self" type="application/rss+xml" />
${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600'
		}
	});
};

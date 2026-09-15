import MarkdownIt from 'markdown-it';

/**
 * Rendu Markdown des articles.
 *
 * `html: false` est la ligne la plus importante du fichier : le HTML brut
 * écrit dans un article n'est jamais interprété, il est échappé. Même si un
 * compte administrateur était compromis, il ne pourrait pas injecter de
 * <script> dans les pages du site.
 */
const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
	breaks: true
});

// Les liens sortants s'ouvrent dans un nouvel onglet, sans fuite de référent.
const defaultLinkOpen =
	md.renderer.rules.link_open ??
	((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
	const href = String(tokens[idx].attrGet('href') ?? '');
	if (/^https?:\/\//i.test(href)) {
		tokens[idx].attrSet('target', '_blank');
		tokens[idx].attrSet('rel', 'noopener noreferrer nofollow');
	}
	return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
	return md.render(source ?? '');
}

/** Version texte brut, pour les résumés, le flux RSS et les métadonnées. */
export function toPlainText(source: string, maxLength = 300): string {
	const text = (source ?? '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#*_>`~|-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length <= maxLength) return text;
	return text.slice(0, text.lastIndexOf(' ', maxLength)).trimEnd() + '…';
}

/** Échappement HTML pour les contenus non-Markdown (commentaires, titres). */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

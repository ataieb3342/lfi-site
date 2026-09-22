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

/**
 * Bloc vidéo.
 *
 * Un paragraphe qui ne contient QUE le lien d'une vidéo devient un bloc
 * cliquable, au lieu d'une adresse nue au milieu du texte :
 *
 *     https://youtu.be/xxxxxxxxxxx          → « Regarder la vidéo »
 *     [Le titre de la vidéo](https://…)     → « Le titre de la vidéo »
 *
 * Il faut une ligne vide avant et après : c'est ce qui en fait un paragraphe
 * à lui seul. Un lien au fil d'une phrase reste un lien ordinaire.
 *
 * La vidéo n'est PAS jouée dans la page, et ce n'est pas un oubli. La CSP est
 * en `default-src 'none'` (vite.config.ts) : une iframe YouTube exigerait d'y
 * inscrire un domaine de Google, donc que chaque visiteur d'un article soit
 * annoncé à Google avant même d'avoir cliqué. Le bloc ci-dessous ne charge
 * rien de l'extérieur — c'est du texte et une forme dessinée par nous — et la
 * lecture se fait sur YouTube, après un clic délibéré.
 */
const VIDEO =
	/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})(?:[?&#][^\s]*)?$/i;

function identifiantVideo(href: string): string | null {
	const trouve = VIDEO.exec(href.trim());
	return trouve ? trouve[1] : null;
}

md.core.ruler.push('bloc_video', (state) => {
	const jetons = state.tokens;
	for (let i = 0; i + 2 < jetons.length; i++) {
		if (jetons[i].type !== 'paragraph_open') continue;
		if (jetons[i + 1].type !== 'inline') continue;
		if (jetons[i + 2].type !== 'paragraph_close') continue;

		// Exactement un lien, et rien d'autre : ouverture, texte, fermeture.
		const enfants = jetons[i + 1].children ?? [];
		if (enfants.length !== 3) continue;
		if (enfants[0].type !== 'link_open') continue;
		if (enfants[1].type !== 'text') continue;
		if (enfants[2].type !== 'link_close') continue;

		const identifiant = identifiantVideo(String(enfants[0].attrGet('href') ?? ''));
		if (!identifiant) continue;

		// Quand linkify a transformé une adresse nue, le texte EST l'adresse :
		// il ne ferait pas un titre.
		const texte = enfants[1].content.trim();
		const titre = /^https?:\/\//i.test(texte) ? '' : texte;

		const jeton = new state.Token('bloc_video', '', 0);
		jeton.block = true;
		jeton.meta = { identifiant, titre };
		jetons.splice(i, 3, jeton);
	}
});

md.renderer.rules.bloc_video = (tokens, idx) => {
	const { identifiant, titre } = tokens[idx].meta as { identifiant: string; titre: string };

	// L'adresse est reconstruite à partir des onze caractères validés par la
	// regex, jamais recopiée telle quelle : rien de ce qu'a écrit l'auteur ne
	// se retrouve dans le href.
	const url = `https://www.youtube.com/watch?v=${identifiant}`;
	const libelle = titre ? escapeHtml(titre) : 'Regarder la vidéo';

	return (
		`<a class="video" href="${url}" target="_blank" rel="noopener noreferrer nofollow">` +
		`<span class="video-icone" aria-hidden="true">` +
		`<svg viewBox="0 0 24 24" width="22" height="22" focusable="false">` +
		`<path d="M8 5.2v13.6L19 12z" fill="currentColor" /></svg></span>` +
		`<span class="video-texte"><span class="video-titre">${libelle}</span>` +
		`<span class="video-source">Vidéo YouTube — la lecture se fait sur youtube.com</span>` +
		`</span></a>\n`
	);
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

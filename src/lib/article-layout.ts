export type ArticleElement = {
	kind: 'image' | 'bubble';
	align: 'left' | 'right' | 'center';
	width: number;
	clear: boolean;
	keepWithNext?: true;
	halo?: 'parchment';
	src?: string;
	alt?: string;
	crop?: number;
	text?: string;
	color?: 'ochre' | 'blue';
	bubbleStyle?: 'speech-left' | 'speech-right' | 'thought';
	nearImage?: true;
};

export const layoutFence = 'element-article';
export const bounded = (value: unknown, fallback: number, low: number, high: number) =>
	typeof value === 'number' && Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : fallback;

export function safeImageUrl(value: unknown): value is string {
	return typeof value === 'string' && value.length <= 2000 && /^(\/(?!\/)|https:\/\/)/i.test(value) && !/[\s\\\x00-\x1f]/.test(value);
}

export function parseArticleElement(source: string): ArticleElement | null {
	try {
		const data = JSON.parse(source);
		if (!data || !['image', 'bubble'].includes(data.kind)) return null;
		const common = {
			align: data.align === 'left' || data.align === 'center' ? data.align : 'right',
			width: bounded(data.width, 35, 20, 100),
			clear: data.clear !== false,
			...(data.keepWithNext === true ? { keepWithNext: true as const } : {})
		} as const;
		if (data.kind === 'image') {
			if (!safeImageUrl(data.src)) return null;
			return { kind: 'image', ...common, src: data.src, alt: typeof data.alt === 'string' ? data.alt.slice(0, 500) : '', crop: bounded(data.crop, 1, 1, 1.6), ...(data.halo === 'parchment' ? { halo: 'parchment' as const } : {}) };
		}
		if (typeof data.text !== 'string') return null;
		const bubbleStyle = data.bubbleStyle === 'speech-left' || data.bubbleStyle === 'speech-right' || data.bubbleStyle === 'thought' ? data.bubbleStyle as ArticleElement['bubbleStyle'] : undefined;
		return { kind: 'bubble', ...common, text: data.text.slice(0, 1500), color: data.color === 'blue' ? 'blue' : 'ochre', ...(bubbleStyle ? { bubbleStyle } : {}), ...(data.nearImage === true && bubbleStyle?.startsWith('speech-') ? { nearImage: true as const } : {}) };
	} catch { return null; }
}

export function serializeArticleElement(element: ArticleElement): string {
	const normalized = parseArticleElement(JSON.stringify(element));
	return '```' + layoutFence + '\n' + JSON.stringify(normalized ?? element) + '\n```';
}

export const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function articleElementClass(element: ArticleElement): string {
	return `article-element article-element-${element.kind} article-element-${element.align}${element.clear ? ' article-element-clear' : ''}${element.kind === 'image' && element.halo === 'parchment' ? ' article-element-parchment' : ''}${element.kind === 'bubble' && element.nearImage ? ' article-element-near-image' : ''}`;
}

export function articleBubbleClass(element: ArticleElement): string {
	return `article-bubble article-bubble-${element.color}${element.bubbleStyle ? ` article-bubble-shaped article-bubble-${element.bubbleStyle}` : ''}`;
}

/** Text stays separate and editable; each speech contour is a single closed path. */
export function articleBubbleDecoration(element: ArticleElement): string {
	if (!element.bubbleStyle) return '';
	const speech = 'M200 1 C310 1 399 18 399 40 C399 62 310 79 200 79 C148 79 100 75 65 67 L28 108 L44 60 C16 54 1 47 1 40 C1 18 90 1 200 1 Z';
	const thought = 'M36 26 C15 6 66 -2 94 8 C120 -5 161 1 179 8 C209 -4 253 0 271 9 C306 -1 348 7 348 20 C387 17 408 41 383 51 C402 69 361 83 334 72 C310 88 266 82 250 76 C220 87 177 83 161 75 C127 89 91 80 80 73 C40 84 8 67 21 52 C-4 43 10 28 36 26 Z';
	const path = element.bubbleStyle === 'thought' ? thought : speech;
	const dots = element.bubbleStyle === 'thought' ? '<ellipse cx="53" cy="91" rx="12" ry="7"/><ellipse cx="35" cy="106" rx="6" ry="4"/>' : '';
	const compact = `<svg class="article-bubble-decoration" viewBox="0 0 400 112" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/>${dots}</svg>`;
	if (!element.nearImage) return compact;
	return compact + '<svg class="article-bubble-decoration article-bubble-decoration-extended" viewBox="0 0 486 111" preserveAspectRatio="none" aria-hidden="true"><path d="M287 1 C396 1 484 18 484 40 C484 63 396 79 287 79 C226 79 171 74 130 65 L1 108 L107 54 C96 50 90 45 90 40 C90 18 177 1 287 1 Z"/></svg>';
}

export function articleElementContent(element: ArticleElement): string {
	if (element.kind === 'bubble') {
		const decoration = articleBubbleDecoration(element);
		const text = escapeAttribute(element.text ?? '');
		return `<div class="${articleBubbleClass(element)}">${decoration}${decoration ? `<div class="article-bubble-text">${text}</div>` : text}</div>`;
	}
	const image = `<img src="${escapeAttribute(element.src ?? '')}" alt="${escapeAttribute(element.alt ?? '')}" loading="lazy">`;
	return (element.crop ?? 1) > 1 ? `<div class="article-image-crop" style="--image-zoom:${element.crop}">${image}</div>` : image;
}

export function renderArticleElement(element: ArticleElement): string {
	return `<aside class="${articleElementClass(element)}" style="--element-width:${element.width}%">${articleElementContent(element)}</aside>`;
}

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
		return { kind: 'bubble', ...common, text: data.text.slice(0, 1500), color: data.color === 'blue' ? 'blue' : 'ochre' };
	} catch { return null; }
}

export function serializeArticleElement(element: ArticleElement): string {
	const normalized = parseArticleElement(JSON.stringify(element));
	return '```' + layoutFence + '\n' + JSON.stringify(normalized ?? element) + '\n```';
}

export const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function articleElementClass(element: ArticleElement): string {
	return `article-element article-element-${element.kind} article-element-${element.align}${element.clear ? ' article-element-clear' : ''}${element.kind === 'image' && element.halo === 'parchment' ? ' article-element-parchment' : ''}`;
}

export function articleElementContent(element: ArticleElement): string {
	if (element.kind === 'bubble') return `<div class="article-bubble article-bubble-${element.color}">${escapeAttribute(element.text ?? '')}</div>`;
	const image = `<img src="${escapeAttribute(element.src ?? '')}" alt="${escapeAttribute(element.alt ?? '')}" loading="lazy">`;
	return (element.crop ?? 1) > 1 ? `<div class="article-image-crop" style="--image-zoom:${element.crop}">${image}</div>` : image;
}

export function renderArticleElement(element: ArticleElement): string {
	return `<aside class="${articleElementClass(element)}" style="--element-width:${element.width}%">${articleElementContent(element)}</aside>`;
}

import type { ArticleElement } from './article-layout.ts';

type FlowBlock = { element?: ArticleElement; type?: string; editable?: boolean; source?: string };
export type ArticleFlow<T> = { items: T[]; grouped: boolean };

/** An explicit attachment ends at a text block, never across a heading or table. */
export function groupArticleFlow<T extends FlowBlock>(blocks: T[]): ArticleFlow<T>[] {
	const result: ArticleFlow<T>[] = [];
	for (let index = 0; index < blocks.length; index++) {
		const items = [blocks[index]];
		while (items.at(-1)?.element?.keepWithNext && index + 1 < blocks.length) {
			const next = blocks[index + 1];
			const text = next.type ? ['paragraph_open', 'bullet_list_open', 'ordered_list_open', 'blockquote_open'].includes(next.type) : next.editable && !/^#{1,6}\s/.test(next.source ?? '');
			if (!next.element && !text) break;
			items.push(next);
			index++;
		}
		result.push({ items, grouped: items.length > 1 });
	}
	return result;
}

export function articleFlowClass(items: FlowBlock[]): string {
	if (items.every(item => item.element)) return 'article-flow article-flow-objects' + (items.every(item => item.element?.kind === 'bubble') && items[0].element?.dialogueLayout === 'staggered' ? ' article-flow-staggered' : '');
	return `article-flow article-flow-${items[0].element?.align ?? 'left'}`;
}

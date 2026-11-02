import { markdownBlocks } from './markdown.ts';
import { defaultScene, parseScene, scenePattern } from './speech-bubbles.ts';
import { parseArticleElement, serializeArticleElement, safeImageUrl, type ArticleElement } from './article-layout.ts';

export type EditorBlock = { id: string; source: string; html: string; editable: boolean; element?: ArticleElement; type?: string };
let sequence = 0;
export const blockId = () => `article-block-${++sequence}`;

export function elementBlock(element: ArticleElement): EditorBlock {
	return { id: blockId(), source: serializeArticleElement(element), html: '', editable: false, element };
}

export function parseEditorDocument(source: string): EditorBlock[] {
	return markdownBlocks(source).flatMap(block => {
		const config = /^```element-article\s*\n([\s\S]*?)\n```\s*$/.exec(block.source);
		const element = config && parseArticleElement(config[1]);
		if (element) return [{ ...elementBlock(element), source: block.source }];
		const oldScene = scenePattern.exec(block.source);
		const legacyDialogue = /^!\[dialogue-cgt\s*\|([^\]]*)\]\(([^)]+)\)\s*$/.exec(block.source);
		const scene = oldScene ? parseScene(oldScene[1]) : legacyDialogue ? { ...defaultScene(), image: legacyDialogue[2], alt: legacyDialogue[1].trim() } : null;
		if (scene) {
			return [
				elementBlock({ kind: 'image', src: scene.image, alt: scene.alt, align: scene.align, width: 35, clear: false, crop: 1 }),
				...scene.bubbles.map(bubble => elementBlock({ kind: 'bubble', text: bubble.text, color: bubble.color, align: bubble.color === 'blue' ? 'left' : 'right', width: 33, clear: true }))
			];
		}
		const image = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)\s*$/.exec(block.source);
		// Keep the original Amfis characters and their existing dialogue intact.
		if (image && !/^(R|Raïssa)\s*\|/i.test(image[1]) && safeImageUrl(image[2]) && !['/images/articles/sticker-rita.png', '/images/articles/zaza-fond-bleu.png'].includes(image[2])) {
			const right = /^aquarelle-droite\s*\|/i.test(image[1]);
			return [{ ...elementBlock({ kind: 'image', src: image[2], alt: image[1].replace(/^aquarelle-droite\s*\|\s*/i, ''), align: right ? 'right' : 'center', width: right ? 35 : 100, clear: false, crop: 1 }), source: block.source }];
		}
		return [{ id: blockId(), source: block.source, html: block.html, type: block.type, editable: ['paragraph_open', 'heading_open', 'bullet_list_open', 'ordered_list_open', 'blockquote_open'].includes(block.type) && !/<(?:img|aside|table)\b/.test(block.html) }];
	});
}

export function serializeEditorDocument(blocks: EditorBlock[]): string {
	return blocks.map(block => block.element ? serializeArticleElement(block.element) : block.source.replace(/^\n+|\n+$/g, '')).filter(Boolean).join('\n\n');
}

export type Bubble = { text: string; x: number; y: number; width: number; color: 'ochre' | 'blue' };
export type BubbleScene = {
	image: string;
	alt: string;
	align: 'right' | 'left' | 'center';
	bubbles: Bubble[];
};

export const scenePattern = /```illustration-bulles\s*\n([\s\S]*?)\n```/;
const number = (value: unknown, fallback: number, min: number, max: number) =>
	typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function parseScene(value: string): BubbleScene | null {
	try {
		const data = JSON.parse(value);
		if (!data || typeof data.image !== 'string' || !Array.isArray(data.bubbles)) return null;
		// Only local images or HTTPS; reject protocol-relative URLs and control characters.
		if (!/^(\/(?!\/)|https:\/\/)/i.test(data.image) || /[\s\\\x00-\x1f]/.test(data.image)) return null;
		return {
			image: data.image,
			alt: typeof data.alt === 'string' ? data.alt.slice(0, 500) : '',
			align: data.align === 'left' || data.align === 'center' ? data.align : 'right',
			bubbles: data.bubbles.slice(0, 12).filter((b: unknown) => b && typeof b === 'object').map((b: Bubble) => {
				const width = number(b.width, 65, 25, 95);
				return {
					text: typeof b.text === 'string' ? b.text.slice(0, 500) : '',
					x: number(b.x, 0, 0, 100 - width),
					y: number(b.y, 50, 0, 90),
					width,
					color: b.color === 'blue' ? 'blue' : 'ochre'
				};
			})
		};
	} catch { return null; }
}

export function defaultScene(): BubbleScene {
	return {
		image: '/images/articles/cgt3-fondu-detoure.png',
		alt: 'Devant un local de la CGT', align: 'right',
		bubbles: [
			{ text: 'Vous travaillez dans quoi ?\nIl faut aller dans votre branche pour vous syndiquer !', x: 30, y: 48, width: 68, color: 'ochre' },
			{ text: 'Ma branche ?…\nMais, je suis chômeur.\nCe que je trouve… c’est aléatoire.', x: 0, y: 63, width: 72, color: 'blue' },
			{ text: 'Ah, mais vous travaillez dans quoi d’habitude ?', x: 30, y: 79, width: 68, color: 'ochre' },
			{ text: 'Ah oui…', x: 5, y: 90, width: 40, color: 'blue' }
		]
	};
}

export function serializeScene(scene: BubbleScene): string {
	return '```illustration-bulles\n' + JSON.stringify(scene) + '\n```';
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function sceneMarkup(scene: BubbleScene): string {
	return `<figure class="bubble-scene bubble-scene-${scene.align}"><div class="bubble-canvas"><img class="bubble-drawing" src="${escape(scene.image)}" alt="${escape(scene.alt)}">${scene.bubbles.map(b => `<span class="speech-bubble speech-bubble-${b.color}" style="left:${b.x}%;top:${b.y}%;width:${b.width}%">${escape(b.text)}</span>`).join('')}</div></figure>`;
}

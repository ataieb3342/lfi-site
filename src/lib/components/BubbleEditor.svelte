<script lang="ts">
	import { defaultScene, parseScene, scenePattern, serializeScene, type BubbleScene } from '../speech-bubbles.ts';
	let { body = $bindable(''), insertionPoint = () => body.length }: { body: string; insertionPoint?: () => number } = $props();
	let scene = $state<BubbleScene>(defaultScene());
	let selected = $state(0);
	let message = $state('');
	let loaded = $state(false);
	let canvas: HTMLDivElement;
	let drag: { index: number; x: number; y: number; left: number; top: number } | null = null;
	const legacyPattern = /!\[(?:dialogue-cgt\s*\||aquarelle-droite\s*\||[^\]]*CGT)[^\]]*\]\(([^)]+)\)/i;
	function load() {
		const match = scenePattern.exec(body);
		scene = (match && parseScene(match[1])) || defaultScene();
		const legacy = legacyPattern.exec(body);
		if (!match && legacy) scene.image = legacy[1];
		selected = 0;
		message = '';
	}
	$effect(() => { if (!loaded) { load(); loaded = true; } });
	function save() {
		const valid = parseScene(JSON.stringify(scene));
		if (!valid) { message = 'Choisissez une adresse d’image locale ou HTTPS valide.'; return; }
		scene = valid;
		const block = serializeScene(scene);
		const match = scenePattern.exec(body);
		if (match) body = body.slice(0, match.index) + block + body.slice(match.index + match[0].length);
		else if (legacyPattern.test(body)) body = body.replace(legacyPattern, () => block);
		else { const position = insertionPoint(); body = body.slice(0, position) + '\n\n' + block + '\n\n' + body.slice(position); }
		message = 'Disposition appliquée au texte. Enregistrez la publication pour la conserver.';
	}
	function start(event: PointerEvent, index: number) {
		selected = index;
		const b = scene.bubbles[index];
		drag = { index, x: event.clientX, y: event.clientY, left: b.x, top: b.y };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}
	function move(event: PointerEvent) {
		if (!drag) return;
		const rect = canvas.getBoundingClientRect();
		const b = scene.bubbles[drag.index];
		b.x = Math.round(Math.max(0, Math.min(100 - b.width, drag.left + (event.clientX - drag.x) * 100 / rect.width)));
		b.y = Math.round(Math.max(0, Math.min(90, drag.top + (event.clientY - drag.y) * 100 / rect.height)));
	}
</script>

<details class="carte mt-4">
	<summary class="cursor-pointer font-bold">Placer les bulles sur mon illustration</summary>
	<p class="aide">Déplacez les bulles à la souris ou au doigt. Cliquez sur une bulle pour modifier son texte. Les réglages ci-dessous permettent aussi de la déplacer au clavier. Cliquez ensuite sur « Appliquer au texte », puis enregistrez la publication.</p>
	<label class="etiquette" for="bubble-image">Adresse de l’image</label>
	<input class="champ" id="bubble-image" bind:value={scene.image} />
	<label class="etiquette mt-2" for="bubble-alt">Description de l’image</label>
	<input class="champ" id="bubble-alt" bind:value={scene.alt} />
	<label class="etiquette mt-2" for="bubble-align">Position de l’illustration dans l’article</label>
	<select class="champ" id="bubble-align" bind:value={scene.align}>
		<option value="right">À droite du texte</option><option value="left">À gauche du texte</option><option value="center">Centrée, entre les paragraphes</option>
	</select>
	<div class="bubble-editor-preview mt-4">
		<div class="bubble-canvas" bind:this={canvas}>
			<img class="bubble-drawing" src={scene.image} alt={scene.alt} draggable="false" />
			{#each scene.bubbles as bubble, index}
				<button type="button" class="speech-bubble speech-bubble-{bubble.color}" class:selected={selected === index}
					style:left="{bubble.x}%" style:top="{bubble.y}%" style:width="{bubble.width}%"
					aria-label="Modifier la bulle {index + 1} : {bubble.text}" aria-pressed={selected === index}
					onclick={() => selected = index} onpointerdown={(event) => start(event, index)} onpointermove={move} onpointerup={() => drag = null} onpointercancel={() => drag = null}>{bubble.text}</button>
			{/each}
		</div>
	</div>
	<div class="mt-3 flex flex-wrap gap-2">
		<button type="button" class="bouton-secondaire" disabled={scene.bubbles.length >= 12} onclick={() => { scene.bubbles.push({ text: 'Votre texte', x: 5, y: 50, width: 60, color: 'blue' }); selected = scene.bubbles.length - 1; }}>Ajouter une bulle</button>
		<button type="button" class="bouton-secondaire" disabled={!scene.bubbles.length} onclick={() => { scene.bubbles.splice(selected, 1); selected = Math.max(0, selected - 1); }}>Supprimer la bulle sélectionnée</button>
	</div>
	{#if scene.bubbles[selected]}
		<label class="etiquette mt-3" for="bubble-text">Texte de la bulle {selected + 1}</label>
		<textarea id="bubble-text" class="champ" rows="3" maxlength="500" bind:value={scene.bubbles[selected].text}></textarea>
		<div class="mt-2 grid grid-cols-2 gap-3">
			<label>Position horizontale<input class="champ" type="range" min="0" max={100 - scene.bubbles[selected].width} bind:value={scene.bubbles[selected].x} /></label>
			<label>Position verticale<input class="champ" type="range" min="0" max="90" bind:value={scene.bubbles[selected].y} /></label>
			<label>Largeur<input class="champ" type="range" min="25" max="95" bind:value={scene.bubbles[selected].width} oninput={() => { scene.bubbles[selected].x = Math.min(scene.bubbles[selected].x, 100 - scene.bubbles[selected].width); }} /></label>
			<label>Couleur<select class="champ" bind:value={scene.bubbles[selected].color}><option value="ochre">Ocre</option><option value="blue">Bleu</option></select></label>
		</div>
	{/if}
	<div class="mt-4 flex flex-wrap gap-2">
		<button type="button" class="bouton" onclick={save}>Appliquer au texte</button>
		<button type="button" class="bouton-secondaire" onclick={load}>Recharger depuis le texte</button>
	</div>
	<p role="status" class="aide">{message}</p>
</details>

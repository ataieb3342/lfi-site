<script lang="ts">
	import TurndownService from 'turndown';
	import { renderMarkdown } from '../markdown.ts';
	import { blockId, elementBlock, parseEditorDocument, serializeEditorDocument, type EditorBlock } from '../article-editor.ts';
	import { articleElementClass, articleElementContent, parseArticleElement, safeImageUrl, type ArticleElement } from '../article-layout.ts';
	import { defaultScene } from '../speech-bubbles.ts';

	let { body = $bindable(''), layout = 'standard', title = '', summary = '' }: { body: string; layout?: string; title?: string; summary?: string } = $props();
	let blocks = $state<EditorBlock[]>([]);
	let selected = $state<string | null>(null);
	let active = $state<string | null>(null);
	let dragged = $state<string | null>(null);
	let dropTarget = $state<string | null>(null);
	let message = $state('');
	let imageForm = $state(false);
	let imageUrl = $state('');
	let imageAlt = $state('');
	let editingMode = $state<'markdown' | 'visual'>('markdown');
	let linkForm = $state(false);
	let linkUrl = $state('');
	let savedRange: Range | null = null;
	let lastBody: string | null = null;
	let undoStack = $state<string[]>([]);
	let redoStack = $state<string[]>([]);
	const dirtyText = new Set<string>();
	let paper = $state<HTMLDivElement>(undefined!);
	const current = $derived(blocks.find(block => block.id === selected));
	const currentElement = $derived(current?.element);
	const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*', bulletListMarker: '-' });
	converter.addRule('editorial-spans', {
		filter: node => node.nodeName === 'SPAN' && /texte-(?:police|couleur)-/.test(node.getAttribute('class') ?? ''),
		replacement: (content, node) => {
			const match = /texte-(police|couleur)-(public-sans|gowun-batang|union-gothic|stack-sans|condensee|violet|rouge|turquoise|vert|rose|jaune)\b/.exec((node as HTMLElement).className);
			return match ? `[[${match[1]}:${match[2]}|${content}]]` : content;
		}
	});
	converter.addRule('line-breaks', { filter: 'br', replacement: () => '\n' });
	converter.remove(['script', 'style']);

	$effect(() => {
		if (body !== lastBody) {
			blocks = parseEditorDocument(body);
			dirtyText.clear();
			lastBody = body;
			selected = null;
			active = null;
		}
	});

	function commit() {
		const value = serializeEditorDocument(blocks);
		if (value === body) return;
		undoStack = [...undoStack.slice(-79), body];
		redoStack = [];
		lastBody = value;
		body = value;
	}
	function restore(value: string) {
		lastBody = value;
		body = value;
		blocks = parseEditorDocument(value);
		dirtyText.clear();
		selected = null;
		active = null;
	}
	function undo() {
		if (!undoStack.length) return;
		const previous = undoStack.at(-1)!;
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, body];
		restore(previous);
	}
	function redo() {
		if (!redoStack.length) return;
		const next = redoStack.at(-1)!;
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, body];
		restore(next);
	}
	function updateText(event: Event, block: EditorBlock) {
		if (event.type === 'input') dirtyText.add(block.id);
		const node = event.currentTarget as HTMLElement;
		block.source = converter.turndown(node.innerHTML);
		commit();
	}
	function finishText(event: FocusEvent, block: EditorBlock) {
		if (!dirtyText.has(block.id)) return;
		updateText(event, block);
		dirtyText.delete(block.id);
		const parts = parseEditorDocument(block.source);
		if (parts.length > 1) {
			const index = blocks.findIndex(item => item.id === block.id);
			if (index >= 0) {
				parts[0].id = block.id;
				for (const part of parts) if (part.html) part.html = renderMarkdown(part.source, body);
				blocks.splice(index, 1, ...parts);
			}
			return;
		}
		block.html = renderMarkdown(block.source, body);
	}
	function pasteText(event: ClipboardEvent) {
		event.preventDefault();
		document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '');
	}
	function format(command: string, value?: string) {
		const selection = window.getSelection();
		if (!selection?.rangeCount || !paper.contains(selection.getRangeAt(0).commonAncestorContainer)) { message = 'Sélectionnez un passage dans l’article pour le mettre en forme.'; return; }
		document.execCommand(command, false, value);
	}
	function rememberSelection() {
		const selection = window.getSelection();
		savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
	}
	function addLink() {
		if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(linkUrl) || /[\s\x00-\x1f]/.test(linkUrl)) { message = 'Choisissez une adresse de lien valide.'; return; }
		if (!savedRange || !paper.contains(savedRange.commonAncestorContainer)) { message = 'Sélectionnez d’abord le texte du lien dans l’article.'; return; }
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(savedRange);
		document.execCommand('createLink', false, linkUrl);
		linkForm = false;
		linkUrl = '';
	}
	function applyStyle(type: 'police' | 'couleur', value: string) {
		if (!value || !savedRange || !paper.contains(savedRange.commonAncestorContainer)) return;
		const span = document.createElement('span');
		span.className = `texte-${type}-${value}`;
		span.append(savedRange.extractContents());
		savedRange.insertNode(span);
		span.closest('[contenteditable="true"]')?.dispatchEvent(new Event('input', { bubbles: true }));
	}
	function insert(element: ArticleElement) {
		const block = elementBlock(element);
		const position = blocks.findIndex(item => item.id === (selected ?? active));
		blocks.splice(position < 0 ? blocks.length : position + 1, 0, block);
		selected = block.id;
		commit();
	}
	function addImage() {
		if (!safeImageUrl(imageUrl)) { message = 'Copiez une adresse d’image du site ou un lien HTTPS valide.'; return; }
		insert({ kind: 'image', src: imageUrl, alt: imageAlt, align: 'right', width: 35, clear: false, crop: 1 });
		imageForm = false;
		imageUrl = '';
		imageAlt = '';
		message = 'Image insérée. Déplacez-la avec sa poignée ou les boutons de placement.';
	}
	function changeElement() {
		if (!current?.element) return;
		const valid = parseArticleElement(JSON.stringify(current.element));
		if (!valid) { message = 'Cette adresse d’image n’est pas valide.'; return; }
		current.element = valid;
		commit();
	}
	function removeSelected() {
		blocks = blocks.filter(block => block.id !== selected);
		selected = null;
		commit();
	}
	function moveSelected(delta: number) {
		const index = blocks.findIndex(block => block.id === selected);
		const destination = index + delta;
		if (index < 0 || destination < 0 || destination >= blocks.length) return;
		const [block] = blocks.splice(index, 1);
		blocks.splice(destination, 0, block);
		commit();
	}
	function drop(event: DragEvent, target?: EditorBlock) {
		if (!dragged) return;
		event.preventDefault();
		const moving = blocks.find(block => block.id === dragged);
		if (!moving || moving === target) { dragged = null; dropTarget = null; return; }
		const others = blocks.filter(block => block !== moving);
		const position = target ? others.indexOf(target) : others.length;
		others.splice(Math.max(0, position), 0, moving);
		if (moving.element) {
			const bounds = paper.getBoundingClientRect();
			if (event.clientX < bounds.left + bounds.width * 0.4) moving.element.align = 'left';
			else if (event.clientX > bounds.left + bounds.width * 0.6) moving.element.align = 'right';
		}
		blocks = others;
		selected = moving.id;
		dragged = null;
		dropTarget = null;
		commit();
		message = 'Élément déplacé. Le texte s’adapte à sa nouvelle position.';
	}
	function keyboard(event: KeyboardEvent) {
		if (!(event.target instanceof Element) || !event.target.closest('.article-editor')) return;
		if (event.target.closest('input, textarea, select')) return;
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
			event.preventDefault();
			if (event.shiftKey) redo(); else undo();
		}
	}
	function addDialogue() {
		for (const bubble of defaultScene().bubbles) insert({ kind: 'bubble', text: bubble.text, color: bubble.color, align: bubble.color === 'blue' ? 'left' : 'right', width: bubble.text === 'Ah oui…' ? 23 : 33, clear: true });
	}
</script>

<svelte:window onkeydown={keyboard} />
<div class="article-editor" role="group" aria-label="Éditeur visuel de l’article">
	<div class="article-editor-toolbar" role="group" aria-label="Mode d’édition">
		<button type="button" class="bouton-secondaire" aria-pressed={editingMode === 'markdown'} onclick={() => editingMode = 'markdown'}>Markdown</button>
		<button type="button" class="bouton-secondaire" aria-pressed={editingMode === 'visual'} onclick={() => editingMode = 'visual'}>Visuel</button>
	</div>
	{#if editingMode === 'markdown'}
		<textarea class="champ font-mono text-sm" rows="22" aria-label="Texte Markdown de l’article" bind:value={body}></textarea>
		<p class="aide">Écrivez en Markdown, ou choisissez « Visuel » pour déplacer les images et les bulles. Le contenu est partagé entre les deux modes.</p>
	{:else}
	<div class="article-editor-toolbar" aria-label="Outils d’édition">
		<button type="button" class="bouton-secondaire" disabled={!undoStack.length} onclick={undo}>Annuler</button>
		<button type="button" class="bouton-secondaire" disabled={!redoStack.length} onclick={redo}>Rétablir</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => event.preventDefault()} onclick={() => format('bold')}>Gras</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => event.preventDefault()} onclick={() => format('italic')}>Italique</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => event.preventDefault()} onclick={() => format('formatBlock', 'h2')}>Titre</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => event.preventDefault()} onclick={() => format('formatBlock', 'blockquote')}>Citation</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => event.preventDefault()} onclick={() => format('insertUnorderedList')}>Liste</button>
		<button type="button" class="bouton-secondaire" onpointerdown={event => { event.preventDefault(); rememberSelection(); }} onclick={() => { linkForm = !linkForm; }}>Lien</button>
		<button type="button" class="bouton-secondaire" onclick={() => { imageForm = !imageForm; selected = null; }}>Ajouter une image</button>
		<button type="button" class="bouton-secondaire" onclick={() => insert({ kind: 'bubble', text: 'Votre réplique', color: 'blue', align: 'left', width: 33, clear: true })}>Ajouter une bulle</button>
	</div>
	<details class="article-editor-extra">
		<summary>Mise en forme d’un passage</summary>
		<div class="article-editor-toolbar">
			<label>Police<select class="champ" onpointerdown={rememberSelection} onchange={event => { applyStyle('police', event.currentTarget.value); event.currentTarget.value = ''; }}><option value="">Police du site</option><option value="public-sans">Public Sans</option><option value="gowun-batang">Gowun Batang</option><option value="union-gothic">Union Gothic</option><option value="stack-sans">Stack Sans Headline</option><option value="condensee">Titre condensé</option></select></label>
			<label>Couleur<select class="champ" onpointerdown={rememberSelection} onchange={event => { applyStyle('couleur', event.currentTarget.value); event.currentTarget.value = ''; }}><option value="">Couleur du site</option><option value="violet">Violet</option><option value="rouge">Rouge</option><option value="turquoise">Turquoise</option><option value="vert">Vert</option><option value="rose">Rose</option><option value="jaune">Jaune sur fond sombre</option></select></label>
		</div>
	</details>
	{#if linkForm}<div class="article-element-settings"><label>Adresse du lien<input class="champ" bind:value={linkUrl} placeholder="https://…" /></label><button type="button" class="bouton" onclick={addLink}>Appliquer le lien</button></div>{/if}
	{#if imageForm}
		<div class="article-element-settings">
			<label>Adresse de l’image<input class="champ" bind:value={imageUrl} placeholder="/media/nom-du-fichier.png" /></label>
			<label>Description<input class="champ" bind:value={imageAlt} /></label>
			<a href="/admin/medias" target="_blank" rel="noopener">Ouvrir les images du site</a>
			<button type="button" class="bouton" onclick={addImage}>Insérer l’image</button>
		</div>
	{/if}
	{#if currentElement}
		<div class="article-element-settings" aria-label="Réglages de l’élément sélectionné">
			<span>{currentElement.kind === 'image' ? 'Image sélectionnée' : 'Bulle sélectionnée'}</span>
			<label>Placement<select class="champ" bind:value={currentElement.align} onchange={() => queueMicrotask(changeElement)}><option value="left">À gauche du texte</option><option value="right">À droite du texte</option><option value="center">Entre les paragraphes</option></select></label>
			<label>Largeur : {currentElement.width} %<input type="range" min="20" max="100" bind:value={currentElement.width} oninput={() => queueMicrotask(changeElement)} /></label>
			{#if currentElement.kind === 'image'}
				<label>Cadrage<input type="range" min="1" max="1.6" step="0.05" bind:value={currentElement.crop} oninput={() => queueMicrotask(changeElement)} /></label>
				<label>Description<input class="champ" bind:value={currentElement.alt} onchange={changeElement} /></label>
				{#if /cgt/i.test((currentElement.src ?? '') + currentElement.alt)}<button type="button" class="bouton-secondaire" onclick={addDialogue}>Ajouter les répliques CGT</button>{/if}
			{:else}
				<label>Couleur<select class="champ" bind:value={currentElement.color} onchange={() => queueMicrotask(changeElement)}><option value="ochre">Ocre</option><option value="blue">Bleu</option></select></label>
			{/if}
			<button type="button" class="bouton-secondaire" onclick={() => moveSelected(-1)}>Remonter</button>
			<button type="button" class="bouton-secondaire" onclick={() => moveSelected(1)}>Descendre</button>
			<button type="button" class="bouton-secondaire" onclick={removeSelected}>Retirer cet élément</button>
		</div>
	{/if}
	<p class="aide">Écrivez directement dans l’article. Pour déplacer une image ou une bulle, saisissez sa poignée et déposez-la avant un paragraphe. Les boutons Remonter et Descendre permettent aussi de la placer.</p>
	<div class="article-editor-paper contenu" class:article-carnet-apercu={layout === 'carnet-aquarelle'} bind:this={paper}>
		{#if title}<header class="article-editor-heading"><h1>{title}</h1>{#if summary}<p>{summary}</p>{/if}</header>{/if}
		{#each blocks as block (block.id)}
			{#if block.element}
				<aside class="{articleElementClass(block.element)} article-editor-object" class:article-editor-selected={selected === block.id}
					style="--element-width:{block.element.width}%" data-block-id={block.id}>
					<button type="button" class="article-editor-handle" draggable="true"
						onclick={() => { selected = block.id; imageForm = false; }}
						ondragstart={event => { dragged = block.id; selected = block.id; event.dataTransfer?.setData('text/plain', block.id); }}
						ondragend={() => { dragged = null; dropTarget = null; }}>{block.element.kind === 'image' ? 'Déplacer l’image' : 'Déplacer la bulle'}</button>
					{#if block.element.kind === 'bubble'}
						<div class="article-bubble article-bubble-{block.element.color}" contenteditable="true" role="textbox" aria-label="Texte de la bulle" aria-multiline="true" tabindex="0"
							bind:innerText={block.element.text} onfocus={() => { selected = block.id; active = block.id; }} oninput={() => queueMicrotask(commit)} onpaste={pasteText}></div>
					{:else}
						<!-- HTML generated only from validated image settings. -->
						<button type="button" class="article-editor-image" aria-label="Sélectionner l’image : {block.element.alt || 'illustration'}" onclick={() => { selected = block.id; imageForm = false; }}>{@html articleElementContent(block.element)}</button>
					{/if}
				</aside>
			{:else if block.html}
				<div class="article-editor-text" class:article-editor-drop={dropTarget === block.id} data-block-id={block.id}
					contenteditable={block.editable} role={block.editable ? 'textbox' : 'group'} aria-label={block.editable ? 'Texte de l’article' : 'Bloc conservé dans sa mise en forme'} aria-multiline={block.editable ? 'true' : undefined}
					onfocus={() => { selected = null; active = block.id; }} oninput={event => updateText(event, block)} onblur={event => { if (block.editable) finishText(event, block); }} onpaste={pasteText}
					ondragover={event => { if (dragged) { event.preventDefault(); dropTarget = block.id; } }} ondragleave={() => dropTarget = null} ondrop={event => drop(event, block)}>
					<!-- HTML uses the same safe renderer as the published article. -->
					{@html block.html}
				</div>
			{/if}
		{/each}
		{#if !blocks.length}
			<button type="button" class="bouton-secondaire" onclick={() => { blocks.push({ id: blockId(), source: '', html: '<p><br></p>', editable: true }); }}>Commencer à écrire</button>
		{/if}
		<div class="article-editor-end" class:article-editor-drop={dragged && dropTarget === 'end'} role="group" aria-label="Fin de l’article"
			ondragover={event => { if (dragged) { event.preventDefault(); dropTarget = 'end'; } }} ondrop={event => drop(event)}>
			{#if dragged}Déposer à la fin de l’article{:else}<button type="button" class="bouton-secondaire" onclick={() => { blocks.push({ id: blockId(), source: '', html: '<p><br></p>', editable: true }); }}>Ajouter un paragraphe</button>{/if}
		</div>
	</div>
	<p role="status" class="aide">{message}</p>
	{/if}
</div>

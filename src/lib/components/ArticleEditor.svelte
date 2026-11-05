<script lang="ts">
	import TurndownService from 'turndown';
	import { renderMarkdown } from '../markdown.ts';
	import { groupArticleFlow, articleFlowClass } from '../article-flow.ts';
	import { blockId, elementBlock, parseEditorDocument, serializeEditorDocument, type EditorBlock } from '../article-editor.ts';
	import { articleElementClass, articleElementContent, articleBubbleClass, articleBubbleDecoration, parseArticleElement, safeImageUrl, type ArticleElement } from '../article-layout.ts';

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
	let markdownArea = $state<HTMLTextAreaElement>();
	const flow = $derived(groupArticleFlow(blocks));
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
	function updateMarkdown(event: Event) {
		setMarkdown((event.currentTarget as HTMLTextAreaElement).value);
	}
	function setMarkdown(value: string) {
		if (value === body) return;
		undoStack = [...undoStack.slice(-79), body];
		redoStack = [];
		body = value;
	}
	function wrapMarkdown(before: string, after = before, placeholder = 'texte') {
		if (!markdownArea) return;
		const start = markdownArea.selectionStart;
		const end = markdownArea.selectionEnd;
		const text = markdownArea.value.slice(start, end) || placeholder;
		markdownArea.setRangeText(before + text + after, start, end, 'select');
		setMarkdown(markdownArea.value);
		markdownArea.focus();
		markdownArea.setSelectionRange(start + before.length, start + before.length + text.length);
	}
	function prefixMarkdown(prefix: string) {
		if (!markdownArea) return;
		const end = markdownArea.selectionEnd;
		const start = markdownArea.value.lastIndexOf('\n', markdownArea.selectionStart - 1) + 1;
		const text = markdownArea.value.slice(start, end).split('\n').map(line => prefix + line).join('\n');
		markdownArea.setRangeText(text, start, end, 'end');
		setMarkdown(markdownArea.value);
		markdownArea.focus();
	}
	function styleMarkdown(type: 'police' | 'couleur', value: string) {
		if (value) wrapMarkdown(`[[${type}:${value}|`, ']]', 'texte à mettre en forme');
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
</script>

<svelte:window onkeydown={keyboard} />

{#snippet editorBlock(block: EditorBlock)}
			{#if block.element}
				<aside class="{articleElementClass(block.element)} article-editor-object" class:article-editor-selected={selected === block.id}
					style="--element-width:{block.element.width}%" data-block-id={block.id}>
					<button type="button" class="article-editor-handle" draggable="true"
						onclick={() => { selected = block.id; imageForm = false; }}
						ondragstart={event => { dragged = block.id; selected = block.id; event.dataTransfer?.setData('text/plain', block.id); }}
						ondragend={() => { dragged = null; dropTarget = null; }}>{block.element.kind === 'image' ? 'Déplacer l’image' : 'Déplacer la bulle'}</button>
					{#if block.element.kind === 'bubble'}
						<div class={articleBubbleClass(block.element)}>
							{@html articleBubbleDecoration(block.element)}
							<div class="article-bubble-text" contenteditable="true" role="textbox" aria-label="Texte de la bulle" aria-multiline="true" tabindex="0"
								bind:innerText={block.element.text} onfocus={() => { selected = block.id; active = block.id; }} oninput={() => queueMicrotask(commit)} onpaste={pasteText}></div>
						</div>
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

{/snippet}
<div class="article-editor" role="group" aria-label="Éditeur visuel de l’article">
	<div class="article-editor-toolbar" role="group" aria-label="Mode d’édition">
		<button type="button" class="bouton-secondaire" aria-pressed={editingMode === 'markdown'} onclick={() => editingMode = 'markdown'}>Markdown</button>
		<button type="button" class="bouton-secondaire" aria-pressed={editingMode === 'visual'} onclick={() => editingMode = 'visual'}>Visuel</button>
	</div>
	{#if editingMode === 'markdown'}
		<div class="article-markdown-tools" role="group" aria-label="Mise en forme Markdown">
			<div class="article-markdown-group" role="group" aria-label="Historique">
			<button type="button" class="bouton-secondaire" disabled={!undoStack.length} onclick={undo}>Annuler</button>
			<button type="button" class="bouton-secondaire" disabled={!redoStack.length} onclick={redo}>Rétablir</button>
			</div>
			<div class="article-markdown-group" role="group" aria-label="Texte">
			<button type="button" class="bouton-secondaire" onclick={() => wrapMarkdown('**')}>Gras</button>
			<button type="button" class="bouton-secondaire" onclick={() => wrapMarkdown('*')}>Italique</button>
			<button type="button" class="bouton-secondaire" onclick={() => prefixMarkdown('## ')}>Titre</button>
			</div>
			<div class="article-markdown-group" role="group" aria-label="Insertion">
			<button type="button" class="bouton-secondaire" onclick={() => wrapMarkdown('[', '](https://)', 'texte du lien')}>Lien</button>
			<button type="button" class="bouton-secondaire" onclick={() => wrapMarkdown('![', '](/media/nom-du-fichier.jpg)', 'description de l’image')}>Image</button>
			<button type="button" class="bouton-secondaire" onclick={() => prefixMarkdown('> ')}>Citation</button>
			<button type="button" class="bouton-secondaire" onclick={() => prefixMarkdown('- ')}>Liste</button>
			</div>
		</div>
		<details class="article-editor-extra article-markdown-extra">
			<summary>Police et couleur</summary>
			<div class="article-markdown-styles">
			<label>Police<select class="champ" onchange={event => { styleMarkdown('police', event.currentTarget.value); event.currentTarget.value = ''; }}><option value="">Choisir une police</option><option value="public-sans">Public Sans</option><option value="gowun-batang">Gowun Batang</option><option value="union-gothic">Union Gothic</option><option value="stack-sans">Stack Sans Headline</option><option value="condensee">Titre condensé</option></select></label>
			<label>Couleur<select class="champ" onchange={event => { styleMarkdown('couleur', event.currentTarget.value); event.currentTarget.value = ''; }}><option value="">Choisir une couleur</option><option value="violet">Violet LFI</option><option value="rouge">Rouge LFI</option><option value="turquoise">Turquoise</option><option value="vert">Vert</option><option value="rose">Rose</option><option value="jaune">Jaune sur fond sombre</option></select></label>
			</div>
		</details>
		<textarea class="champ font-mono text-sm" rows="22" aria-label="Texte Markdown de l’article" bind:this={markdownArea} value={body} oninput={updateMarkdown}></textarea>
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
			<label><span><input type="checkbox" checked={currentElement.keepWithNext === true} onchange={event => { currentElement.keepWithNext = event.currentTarget.checked ? true : undefined; changeElement(); }} /> Garder avec le bloc suivant</span></label>
			<label>Largeur : {currentElement.width} %<input type="range" min="20" max="100" bind:value={currentElement.width} oninput={() => queueMicrotask(changeElement)} /></label>
			{#if currentElement.kind === 'image'}
				<label><span><input type="checkbox" checked={currentElement.halo === 'parchment'} onchange={event => { currentElement.halo = event.currentTarget.checked ? 'parchment' : undefined; changeElement(); }} /> Voile parchemin</span></label>
				<label>Cadrage<input type="range" min="1" max="1.6" step="0.05" bind:value={currentElement.crop} oninput={() => queueMicrotask(changeElement)} /></label>
				<label>Description<input class="champ" bind:value={currentElement.alt} onchange={changeElement} /></label>
			{:else}
				<label><span><input type="checkbox" checked={currentElement.bubbleSize === 'small'} onchange={event => { currentElement.bubbleSize = event.currentTarget.checked ? 'small' : undefined; changeElement(); }} /> Petite bulle</span></label>
				{#if currentElement.keepWithNext}<label><span><input type="checkbox" checked={currentElement.dialogueLayout === 'staggered'} onchange={event => { currentElement.dialogueLayout = event.currentTarget.checked ? 'staggered' : undefined; changeElement(); }} /> Décaler les bulles liées</span></label>{/if}
				<label>Type de bulle<select class="champ" value={currentElement.bubbleStyle ?? ''} onchange={event => { currentElement.bubbleStyle = event.currentTarget.value as ArticleElement['bubbleStyle']; changeElement(); }}><option value="">Simple</option><option value="speech-left">Parole, pointe à gauche</option><option value="speech-right">Parole, pointe à droite</option><option value="thought">Pensée</option></select></label>
				{#if currentElement.bubbleStyle?.startsWith('speech-')}<label><span><input type="checkbox" checked={currentElement.nearImage === true} onchange={event => { currentElement.nearImage = event.currentTarget.checked ? true : undefined; changeElement(); }} /> Rapprocher de l’image</span></label>{/if}
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
		{#each flow as group (group.items[0].id)}
			{#if group.grouped}
				<div class={articleFlowClass(group.items)} style="--group-width:{group.items[0].element!.width}%">
					{#if group.items.every(item => item.element)}
						{#each group.items as block (block.id)}{@render editorBlock(block)}{/each}
					{:else}
						{@render editorBlock(group.items[0])}
						<div class="article-flow-content">
							{#each group.items.slice(1) as block (block.id)}{@render editorBlock(block)}{/each}
						</div>
					{/if}
				</div>
			{:else}
				{@render editorBlock(group.items[0])}
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

<style>
 .article-markdown-tools { display:flex; flex-wrap:wrap; gap:0.45rem 0.8rem; padding:0.55rem; margin-bottom:0.5rem; border:1px solid var(--color-line); border-radius:0.5rem; background:var(--color-surface-alt); }
 .article-markdown-group { display:flex; flex-wrap:wrap; align-items:center; gap:0.25rem; }
 .article-markdown-tools button { padding:0.35rem 0.5rem; min-height:2rem; border-radius:0.3rem; font-size:0.78rem; line-height:1.2; }
 .article-markdown-extra { margin-bottom:0.75rem; }
 .article-markdown-extra summary { font-size:0.8rem; color:var(--color-ink-soft); cursor:pointer; }
 .article-markdown-styles { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.75rem; margin-top:0.6rem; }
 .article-markdown-styles label { min-width:0; font-size:0.8rem; }
 .article-markdown-styles select { margin-top:0.25rem; font-size:0.8rem; }
 @media(max-width:480px) { .article-markdown-styles { grid-template-columns:1fr; } }
</style>

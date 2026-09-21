<script lang="ts">
	import type { PublicationVue } from '$lib/types';

	type Champs = {
		kind?: string;
		title?: string;
		summary?: string;
		body?: string;
		authorName?: string;
		status?: string;
		eventAt?: string;
		eventCategory?: string;
		commentsOpen?: boolean;
		pinned?: boolean;
	};

	let {
		publication = null,
		valeurs = {},
		erreur = '',
		libelleValider = 'Enregistrer',
		apercu = ''
	}: {
		publication?: PublicationVue | null;
		valeurs?: Champs;
		erreur?: string;
		libelleValider?: string;
		/** Texte rendu en HTML par le serveur après un clic sur « Aperçu ». */
		apercu?: string;
	} = $props();

	/*
	 * Barre d'outils du texte. Chaque bouton insère la syntaxe Markdown à
	 * l'endroit du curseur, ou autour du passage sélectionné : on n'a plus à
	 * connaître la syntaxe par cœur. Elle n'apparaît que lorsque le script est
	 * chargé, puisqu'elle ne sert à rien sans lui.
	 */
	let zone = $state<HTMLTextAreaElement | null>(null);
	let scriptActif = $state(false);
	$effect(() => {
		scriptActif = true;
	});

	/** Entoure la sélection (ou un mot d'exemple) de `avant` et `apres`. */
	function entourer(avant: string, apres = avant, exemple = 'texte') {
		if (!zone) return;
		const debut = zone.selectionStart;
		const fin = zone.selectionEnd;
		const selection = zone.value.slice(debut, fin) || exemple;
		zone.setRangeText(avant + selection + apres, debut, fin, 'select');
		zone.setSelectionRange(debut + avant.length, debut + avant.length + selection.length);
		zone.focus();
	}

	/** Place `prefixe` au début de chaque ligne de la sélection. */
	function prefixerLignes(prefixe: string) {
		if (!zone) return;
		const fin = zone.selectionEnd;
		const debutLigne = zone.value.lastIndexOf('\n', zone.selectionStart - 1) + 1;
		const bloc = zone.value.slice(debutLigne, fin);
		const nouveau = bloc
			.split('\n')
			.map((ligne) => prefixe + ligne)
			.join('\n');
		zone.setRangeText(nouveau, debutLigne, fin, 'end');
		zone.focus();
	}

	const outils = [
		{ label: 'Gras', titre: 'Mettre en gras', action: () => entourer('**') },
		{ label: 'Italique', titre: 'Mettre en italique', action: () => entourer('*') },
		{ label: 'Titre', titre: 'Transformer la ligne en titre', action: () => prefixerLignes('## ') },
		{ label: 'Lien', titre: 'Insérer un lien', action: () => entourer('[', '](https://)', 'texte du lien') },
		{ label: 'Image', titre: 'Insérer une image (adresse à copier depuis la page Images)', action: () => entourer('![', '](/media/nom-du-fichier.jpg)', "description de l'image") },
		{ label: 'Citation', titre: 'Transformer en citation', action: () => prefixerLignes('> ') },
		{ label: 'Liste', titre: 'Transformer en liste', action: () => prefixerLignes('- ') }
	];

	// Les valeurs renvoyées après une erreur de validation ont la priorité,
	// pour ne pas faire perdre son texte à la personne qui rédige.
	const v = $derived({
		kind: valeurs.kind ?? publication?.kind ?? 'article',
		title: valeurs.title ?? publication?.title ?? '',
		summary: valeurs.summary ?? publication?.summary ?? '',
		body: valeurs.body ?? '',
		authorName: valeurs.authorName ?? publication?.authorName ?? '',
		status: valeurs.status ?? publication?.status ?? 'draft',
		commentsOpen: valeurs.commentsOpen ?? publication?.commentsOpen ?? true,
		pinned: valeurs.pinned ?? publication?.pinned ?? false,
		eventAt: valeurs.eventAt ?? publication?.eventAt ?? '',
		eventCategory: valeurs.eventCategory ?? publication?.eventCategory ?? 'autre'
	});
</script>

{#if erreur}
	<p role="alert" class="alerte">{erreur}</p>
{/if}

<div class="grid gap-6 lg:grid-cols-[1fr_16rem]">
	<div class="space-y-4">
		<div>
			<label class="etiquette" for="title">Titre</label>
			<input id="title" name="title" class="champ text-lg font-semibold" required maxlength="200" value={v.title} />
		</div>

		<div>
			<label class="etiquette" for="summary">Chapô</label>
			<textarea id="summary" name="summary" class="champ" rows="2" maxlength="500">{v.summary}</textarea>
			<p class="aide">Une ou deux phrases affichées dans les listes et lors d'un partage.</p>
		</div>

		<div>
			<label class="etiquette" for="body">Texte</label>
			{#if scriptActif}
				<div class="mb-1 flex flex-wrap gap-1" role="toolbar" aria-label="Mise en forme du texte" aria-controls="body">
					{#each outils as outil (outil.label)}
						<button
							type="button"
							class="rounded border border-line-forte bg-carte px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-alt"
							title={outil.titre}
							onclick={outil.action}>{outil.label}</button
						>
					{/each}
				</div>
			{/if}
			<textarea id="body" name="body" class="champ font-mono text-sm" rows="22" bind:this={zone}>{v.body}</textarea>
			<p class="aide">
				Mise en forme au format Markdown : <code>## Titre</code>, <code>**gras**</code>,
				<code>*italique*</code>, <code>[lien](https://…)</code>, <code>&gt; citation</code>, une
				liste avec des tirets. Le HTML n'est pas interprété, c'est volontaire.
			</p>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<!-- L'aperçu est rendu par le serveur, avec exactement le code qui
				     affiche les pages publiques : ce qu'on voit est ce qu'on aura.
				     formnovalidate : un titre encore vide ne doit pas l'empêcher. -->
				<button class="bouton-secondaire" type="submit" formaction="?/apercu" formnovalidate>Aperçu du texte</button>
				<p class="aide mt-0">Affiche le texte tel qu'il apparaîtra sur le site, sans rien enregistrer.</p>
			</div>
		</div>

		{#if apercu}
			<section id="apercu" class="carte" aria-labelledby="apercu-titre">
				<h2 id="apercu-titre" class="text-sm font-bold tracking-wide text-ink-faint uppercase">Aperçu du texte</h2>
				<!-- HTML produit par markdown.ts (html: false) : aucune balise brute
				     saisie dans le texte n'est interprétée. -->
				<div class="contenu mt-4">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html apercu}
				</div>
			</section>
		{/if}
	</div>

	<aside class="space-y-4">
		<div class="carte space-y-4">
			<div>
				<label class="etiquette" for="kind">Type</label>
				<select id="kind" name="kind" class="champ">
					<option value="article" selected={v.kind === 'article'}>Article</option>
					<option value="actu" selected={v.kind === 'actu'}>Actualité</option>
					<option value="apero" selected={v.kind === 'apero'}>Apéro thématique</option>
					<option value="revue" selected={v.kind === 'revue'}>Revue de presse</option>
				</select>
				<p class="aide">
					Pour un apéro : le thème en titre, la date de la soirée ci-dessous. Après la soirée,
					rouvrez la même fiche et écrivez le résumé des échanges dans le texte. Une revue de
					presse rassemble ce qu'on a lu ailleurs : les liens vont dans le texte, chacun avec
					sa source et ce qu'on en retient.
				</p>
			</div>

			<div>
				<label class="etiquette" for="status">État</label>
				<select id="status" name="status" class="champ">
					<option value="draft" selected={v.status === 'draft'}>Brouillon</option>
					<option value="published" selected={v.status === 'published'}>Publié</option>
				</select>
				<p class="aide">Un brouillon n'est visible que par les administrateurs connectés.</p>
			</div>

			<div>
				<label class="etiquette" for="authorName">Signature</label>
				<input id="authorName" name="authorName" class="champ" maxlength="120" value={v.authorName} />
				<p class="aide">Laissez vide pour ne rien afficher.</p>
			</div>

			<div>
				<label class="etiquette" for="eventAt">Date du rendez-vous</label>
				<input id="eventAt" name="eventAt" type="date" class="champ" value={v.eventAt} />
				<p class="aide">
					Obligatoire pour un apéro, facultatif sinon. Renseignée, la publication remonte en
					tête de sa rubrique jusqu'au jour dit, puis redescend automatiquement. Laissez vide
					pour une info sans rendez-vous.
				</p>
			</div>

			<div>
				<label class="etiquette" for="eventCategory">Catégorie dans l'agenda</label>
				<select id="eventCategory" name="eventCategory" class="champ">
					<option value="action" selected={v.eventCategory === 'action'}>Action</option>
					<option value="reunion" selected={v.eventCategory === 'reunion'}>Événement</option>
					<option value="apero" selected={v.eventCategory === 'apero'}>Apéro</option>
					<option value="formation" selected={v.eventCategory === 'formation'}>Formation</option>
					<option value="autre" selected={v.eventCategory === 'autre'}>Autre</option>
				</select>
				<p class="aide">
					Utilisée dans le calendrier lorsque la date du rendez-vous est renseignée.
				</p>
			</div>

			<label class="flex items-start gap-2 text-sm text-ink">
				<input type="checkbox" name="commentsOpen" value="1" checked={v.commentsOpen} class="mt-0.5" />
				<span>Autoriser les commentaires</span>
			</label>

			<label class="flex items-start gap-2 text-sm text-ink">
				<input type="checkbox" name="pinned" value="1" checked={v.pinned} class="mt-0.5" />
				<span>Épingler en haut des listes</span>
			</label>
		</div>

		<div class="carte space-y-3">
			<p class="etiquette mb-0">Image de couverture</p>

			{#if publication?.cover}
				<img src={publication.cover.url} alt={publication.cover.alt} class="w-full rounded" />
				<label class="flex items-start gap-2 text-sm text-ink">
					<input type="checkbox" name="retirerCouverture" value="1" class="mt-0.5" />
					<span>Retirer cette image</span>
				</label>
			{/if}

			<div>
				<label class="etiquette" for="cover">
					{publication?.cover ? 'Remplacer par' : 'Ajouter une image'}
				</label>
				<input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="champ" />
				<p class="aide">JPEG, PNG, WebP, GIF ou AVIF. 5 Mo maximum.</p>
			</div>

			<div>
				<label class="etiquette" for="coverAlt">Description de l'image</label>
				<input id="coverAlt" name="coverAlt" class="champ" maxlength="300" value={publication?.cover?.alt ?? ''} />
				<p class="aide">Lue par les personnes non voyantes. Décrivez ce que montre l'image.</p>
			</div>
		</div>

		<button class="bouton w-full justify-center" type="submit">{libelleValider}</button>
	</aside>
</div>

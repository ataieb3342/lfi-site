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
		commentsOpen?: boolean;
		pinned?: boolean;
	};

	let {
		publication = null,
		valeurs = {},
		erreur = '',
		libelleValider = 'Enregistrer'
	}: {
		publication?: PublicationVue | null;
		valeurs?: Champs;
		erreur?: string;
		libelleValider?: string;
	} = $props();

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
		eventAt: valeurs.eventAt ?? publication?.eventAt ?? ''
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
			<textarea id="body" name="body" class="champ font-mono text-sm" rows="22">{v.body}</textarea>
			<p class="aide">
				Mise en forme au format Markdown : <code>## Titre</code>, <code>**gras**</code>,
				<code>*italique*</code>, <code>[lien](https://…)</code>, <code>&gt; citation</code>, une
				liste avec des tirets. Le HTML n'est pas interprété, c'est volontaire.
			</p>
		</div>
	</div>

	<aside class="space-y-4">
		<div class="carte space-y-4">
			<div>
				<label class="etiquette" for="kind">Type</label>
				<select id="kind" name="kind" class="champ">
					<option value="article" selected={v.kind === 'article'}>Article</option>
					<option value="actu" selected={v.kind === 'actu'}>Actualité</option>
					<option value="apero" selected={v.kind === 'apero'}>Apéro thématique</option>
				</select>
				<p class="aide">
					Pour un apéro : le thème en titre, la date de la soirée ci-dessous. Après la soirée,
					rouvrez la même fiche et écrivez le résumé des échanges dans le texte.
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
				<label class="etiquette" for="eventAt">Date de l'action</label>
				<input id="eventAt" name="eventAt" type="date" class="champ" value={v.eventAt} />
				<p class="aide">
					Obligatoire pour un apéro, facultatif sinon. Renseignée, la publication remonte en
					tête de sa rubrique jusqu'au jour dit, puis redescend automatiquement. Laissez vide
					pour une info sans rendez-vous.
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

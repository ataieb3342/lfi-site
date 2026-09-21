<script lang="ts">
	import { formatDate } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Images — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Images</h1>
<p class="mt-1 text-sm text-ink-soft">
	Pour insérer une image dans un article, copiez son adresse et utilisez la syntaxe Markdown
	<code class="rounded bg-surface-alt px-1">![description](adresse)</code>.
</p>

<form method="POST" action="?/envoyer" enctype="multipart/form-data" class="carte mt-6 space-y-3">
	{#if form?.erreur}<p role="alert" class="alerte">{form.erreur}</p>{/if}
	<div class="grid gap-3 sm:grid-cols-2">
		<div>
			<label class="etiquette" for="fichier">Fichier</label>
			<input
				id="fichier"
				name="fichier"
				type="file"
				required
				accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
				class="champ"
			/>
			<p class="aide">JPEG, PNG, WebP, GIF, AVIF. 5 Mo maximum. Le SVG est refusé pour raisons de sécurité.</p>
		</div>
		<div>
			<label class="etiquette" for="alt">Description</label>
			<input id="alt" name="alt" class="champ" maxlength="300" />
			<p class="aide">Décrivez l'image pour les personnes non voyantes.</p>
		</div>
	</div>
	<button class="bouton" type="submit">Envoyer</button>
</form>

{#if data.medias.length}
	<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.medias as m (m.id)}
			<li class="carte">
				<img src={m.url} alt={m.alt} class="aspect-video w-full rounded object-cover" loading="lazy" />
				<p class="mt-2 text-xs break-all text-ink-faint">{m.url}</p>
				<p class="mt-1 text-xs text-ink-faint">{m.poids} Ko · {formatDate(m.creeLe)}</p>
				{#if m.alt}<p class="mt-1 text-xs text-ink-soft">{m.alt}</p>{/if}

				{#if m.utilisations > 0}
					<p class="mt-2 text-xs font-semibold text-ink-soft">
						Utilisée à {m.utilisations} endroit{m.utilisations > 1 ? 's' : ''} sur le site.
					</p>
				{:else}
					<form method="POST" action="?/supprimer" class="mt-2">
						<input type="hidden" name="id" value={m.id} />
						<button class="bouton-danger" type="submit">Supprimer</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-8 text-sm text-ink-soft">Aucune image pour le moment.</p>
{/if}

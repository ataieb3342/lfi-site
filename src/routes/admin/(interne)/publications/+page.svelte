<script lang="ts">
	import { COULEUR_KIND, formatDate, libellePublication, lienPublication } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Publications — Administration</title></svelte:head>

<header class="flex flex-wrap items-center justify-between gap-4">
	<h1 class="text-2xl font-extrabold text-ink">Publications</h1>
	<a class="bouton" href="/admin/publications/nouvelle">Nouvelle publication</a>
</header>

<form method="GET" class="mt-6 flex flex-wrap items-end gap-3">
	<div class="grow">
		<label class="etiquette" for="q">Rechercher</label>
		<input id="q" name="q" class="champ" value={data.filtres.recherche} placeholder="Titre ou contenu" />
	</div>
	<div>
		<label class="etiquette" for="type">Type</label>
		<select id="type" name="type" class="champ">
			<option value="">Tous</option>
			<option value="article" selected={data.filtres.kind === 'article'}>Articles</option>
			<option value="actu" selected={data.filtres.kind === 'actu'}>Actualités</option>
			<option value="action" selected={data.filtres.kind === 'action'}>Actions</option>
			<option value="reunion" selected={data.filtres.kind === 'reunion'}>Événements</option>
			<option value="formation" selected={data.filtres.kind === 'formation'}>Formations</option>
			<option value="apero" selected={data.filtres.kind === 'apero'}>Apéros</option>
			<option value="revue" selected={data.filtres.kind === 'revue'}>Revues de presse</option>
		</select>
	</div>
	<div>
		<label class="etiquette" for="etat">État</label>
		<select id="etat" name="etat" class="champ">
			<option value="">Tous</option>
			<option value="published" selected={data.filtres.status === 'published'}>Publiés</option>
			<option value="draft" selected={data.filtres.status === 'draft'}>Brouillons</option>
		</select>
	</div>
	<button class="bouton-secondaire" type="submit">Filtrer</button>
</form>

{#if data.publications.length}
	<ul class="mt-6 divide-y divide-line rounded-lg border border-line">
		{#each data.publications as p (p.id)}
			<li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
				<div class="min-w-0 grow">
					<a class="font-semibold text-ink hover:text-brand" href="/admin/publications/{p.id}">{p.title}</a>
					<p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
						<span class="font-semibold {COULEUR_KIND[p.kind]}">{libellePublication(p.kind, p.eventCategory)}</span>
						<span>·</span>
						{#if p.status === 'published'}
							<span>Publié le {formatDate(p.publishedAt)}</span>
						{:else}
							<span class="font-semibold text-brand">Brouillon</span>
						{/if}
						{#if p.pinned}<span>· Épinglé</span>{/if}
						<span>· {p.commentCount} commentaire{p.commentCount > 1 ? 's' : ''}</span>
					</p>
				</div>
				<a class="text-sm font-semibold text-brand hover:underline" href={lienPublication(p.kind, p.slug)}>Voir</a>
				<a class="text-sm font-semibold text-ink-soft hover:underline" href="/admin/publications/{p.id}">Modifier</a>
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-6 text-sm text-ink-soft">Aucune publication ne correspond à ces critères.</p>
{/if}

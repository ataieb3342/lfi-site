<script lang="ts">
	import { formatRelative, lienPublication } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const chiffres = $derived([
		{ label: 'Articles publiés', valeur: data.stats.articles },
		{ label: 'Actualités publiées', valeur: data.stats.actus },
		{ label: 'Apéros', valeur: data.stats.aperos },
		{ label: 'Brouillons', valeur: data.stats.brouillons },
		{ label: 'Commentaires en ligne', valeur: data.stats.commentaires }
	]);
</script>

<svelte:head><title>Tableau de bord — Administration</title></svelte:head>

<header class="flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-2xl font-extrabold text-ink">Bonjour {data.adminCourant.displayName}</h1>
		<p class="mt-1 text-sm text-ink-soft">Voici l'état du site.</p>
	</div>
	<a class="bouton" href="/admin/publications/nouvelle">Nouvelle publication</a>
</header>

{#if data.commentairesEnAttente > 0}
	<a href="/admin/commentaires" class="alerte mt-6 block hover:underline">
		{data.commentairesEnAttente}
		{data.commentairesEnAttente > 1 ? 'commentaires attendent' : 'commentaire attend'} votre relecture.
	</a>
{/if}

{#if data.sourcesEnAttente > 0}
	<a href="/admin/sources" class="alerte mt-3 block hover:underline">
		{data.sourcesEnAttente}
		{data.sourcesEnAttente > 1 ? 'sources proposées attendent' : 'source proposée attend'} votre relecture.
	</a>
{/if}

<div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
	{#each chiffres as chiffre (chiffre.label)}
		<div class="carte">
			<p class="text-3xl font-extrabold text-ink">{chiffre.valeur}</p>
			<p class="mt-1 text-xs text-ink-faint">{chiffre.label}</p>
		</div>
	{/each}
</div>

<section class="mt-10">
	<div class="mb-3 flex items-baseline justify-between">
		<h2 class="text-lg font-extrabold text-ink">Dernières publications</h2>
		<a class="text-sm font-semibold text-brand hover:underline" href="/admin/publications">Tout voir</a>
	</div>

	{#if data.recentes.length}
		<ul class="divide-y divide-line rounded-lg border border-line">
			{#each data.recentes as p (p.id)}
				<li class="flex flex-wrap items-center gap-3 px-4 py-3">
					<a class="font-semibold text-ink hover:text-brand" href="/admin/publications/{p.id}">{p.title}</a>
					{#if p.status === 'draft'}
						<span class="rounded bg-surface-alt px-1.5 py-0.5 text-xs font-semibold text-ink-soft">Brouillon</span>
					{/if}
					<span class="ml-auto text-xs text-ink-faint">{formatRelative(p.publishedAt ?? p.updatedAt)}</span>
					<a class="text-xs font-semibold text-brand hover:underline" href={lienPublication(p.kind, p.slug)}>Voir</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="carte text-sm text-ink-soft">
			Rien n'est encore publié. <a class="font-semibold text-brand hover:underline" href="/admin/publications/nouvelle"
				>Écrivez votre premier article</a
			>.
		</p>
	{/if}
</section>

<section class="mt-10">
	<h2 class="mb-3 text-lg font-extrabold text-ink">Journal d'activité</h2>
	<p class="mb-3 text-sm text-ink-soft">
		Les actions sensibles sont tracées. En cas de doute sur un compte, c'est ici qu'on regarde.
	</p>
	<ul class="divide-y divide-line rounded-lg border border-line text-sm">
		{#each data.journal as ligne (ligne.id)}
			<li class="flex flex-wrap gap-x-3 px-4 py-2">
				<span class="font-mono text-xs text-ink-faint">{formatRelative(ligne.created_at)}</span>
				<span class="font-semibold text-ink">{ligne.admin_name}</span>
				<span class="text-ink-soft">{ligne.action}</span>
				{#if ligne.target}<span class="text-ink-faint">{ligne.target}</span>{/if}
			</li>
		{:else}
			<li class="px-4 py-3 text-ink-soft">Aucune activité enregistrée.</li>
		{/each}
	</ul>
</section>

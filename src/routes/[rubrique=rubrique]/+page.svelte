<script lang="ts">
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import { CHAPO_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const titre = $derived(TITRE_RUBRIQUE[data.rubrique]);
</script>

<svelte:head>
	<title>{titre} — {data.settings.siteName}</title>
	<meta name="description" content={CHAPO_RUBRIQUE[data.rubrique]} />
</svelte:head>

<header class="border-b border-line pb-6">
	<h1 class="text-3xl font-extrabold text-ink sm:text-4xl">{titre}</h1>
	<p class="mt-2 max-w-2xl text-ink-soft">{CHAPO_RUBRIQUE[data.rubrique]}</p>
</header>

{#if data.publications.length}
	<div class="mt-8 space-y-6">
		{#each data.publications as publication (publication.id)}
			<CartePublication {publication} avecImage={data.rubrique === 'articles'} />
		{/each}
	</div>

	{#if data.pages > 1}
		<nav class="mt-10 flex items-center justify-between" aria-label="Pagination">
			{#if data.page > 1}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href="?page={data.page - 1}">← Page précédente</a
				>
			{:else}
				<span></span>
			{/if}
			<span class="text-sm text-ink-faint">Page {data.page} sur {data.pages}</span>
			{#if data.page < data.pages}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href="?page={data.page + 1}">Page suivante →</a
				>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{:else}
	<p class="mt-8 text-ink-soft">Rien à afficher pour le moment.</p>
{/if}

{#if data.rubrique === 'actualites'}
	<BandeauApplication
		actif={data.app.actif}
		android={data.app.android}
		ios={data.app.ios}
	/>
{/if}

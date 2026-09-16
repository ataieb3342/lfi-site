<script lang="ts">
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Encart from '$lib/components/Encart.svelte';
	import { COULEUR_KIND } from '$lib/format';
	import { CHAPO_RUBRIQUE, KIND_PAR_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const titre = $derived(TITRE_RUBRIQUE[data.rubrique]);
	// La couleur du type de publication, portée par le surlignage de l'en-tête.
	const couleur = $derived(COULEUR_KIND[KIND_PAR_RUBRIQUE[data.rubrique]]);
</script>

<svelte:head>
	<title>{titre} — {data.settings.siteName}</title>
	<meta name="description" content={CHAPO_RUBRIQUE[data.rubrique]} />
</svelte:head>

<header class="border-b border-line pb-6">
	<p class="text-xs font-bold tracking-[0.2em] uppercase {couleur}">{SURLIGNE_RUBRIQUE[data.rubrique]}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{titre}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{CHAPO_RUBRIQUE[data.rubrique]}</p>
</header>

<!-- L'encart de la rubrique est en tête, comme celui de la bibliothèque : c'est
     une invitation, et une invitation placée après quinze publications et une
     pagination n'est jamais vue. Tous au même gabarit (voir Encart.svelte) : le
     bandeau Action populaire en jaune sur les actualités, la revue de presse
     sur les articles, la bibliothèque sur la revue de presse. -->
{#if data.rubrique === 'actualites'}
	<BandeauApplication
		actif={data.app.actif}
		android={data.app.android}
		ios={data.app.ios}
	/>
{:else if data.rubrique === 'articles'}
	<Encart
		sureligne="Ce que nous lisons ailleurs"
		titre="La revue de presse"
		texte="Les articles de la semaine que nous avons retenus, avec ce que nous en pensons et pourquoi ils comptent pour Dijon. Une sélection commentée, pas un agrégateur."
		href="/revue-de-presse"
	/>
{:else if data.rubrique === 'revue-de-presse'}
	<Encart
		sureligne="Aller plus loin"
		titre="La bibliothèque"
		texte="Livres, vidéos et documents partagés autour de nos apéros, relus avant publication — de quoi creuser un sujet au-delà de l'actualité de la semaine."
		href="/bibliotheque"
		surface="fond-apero"
	/>
{/if}

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

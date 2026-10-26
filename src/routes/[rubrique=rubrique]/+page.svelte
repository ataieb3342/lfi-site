<script lang="ts">
	import { page } from '$app/state';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Encart from '$lib/components/Encart.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { COULEUR_KIND } from '$lib/format';
	import { CHAPO_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const titre = TITRE_RUBRIQUE.articles;
	const chapo = CHAPO_RUBRIQUE.articles;

	// Chaque page de la liste est une page à part entière : elle se désigne
	// elle-même comme canonique et porte son numéro dans le titre. Les renvoyer
	// toutes vers la page 1 ferait disparaître de l'index les publications
	// anciennes, qui ne sont listées nulle part ailleurs.
	function lienListe(numero: number): string {
		return numero > 1 ? `/articles?page=${numero}` : '/articles';
	}
	const chemin = $derived(lienListe(data.page));
	const suffixe = $derived(data.page > 1 ? ` (page ${data.page})` : '');
</script>

<Metadonnees
	titre="{titre}{suffixe} - {data.settings.siteName}"
	description={chapo}
	canonique={chemin}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: titre, chemin: '/articles' }
	])}
/>

<!-- Pas de filet sous cet en-tête : le bandeau qui suit est une surface
     colorée, il pose déjà la limite. Deux traits l'un sur l'autre font une
     rayure. Les pages qui commencent par du texte, elles, gardent leur filet. -->
<header>
	<p class="text-xs font-bold tracking-[0.2em] uppercase {COULEUR_KIND.article}">{SURLIGNE_RUBRIQUE.articles}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{titre}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{chapo}</p>
</header>

<!-- L'encart est en tête : c'est une invitation, et une invitation placée
     après quinze publications et une pagination n'est jamais vue. Le filet
     est en dessous : le bandeau est une surface colorée, il n'a pas besoin
     qu'on le sépare de l'en-tête, mais il faut le détacher de la liste. -->
<div class="border-b border-line pb-5">
	<Encart
		sureligne="Aller plus loin"
		titre="La bibliothèque"
		texte="Les lectures partagées autour de nos apéros, et des outils pour comprendre les chiffres."
		href="/bibliotheque"
		surface="fond-apero"
	/>
</div>

{#if data.publications.length}
	<div class="mt-5 space-y-5">
		{#each data.publications as publication (publication.id)}
			<CartePublication {publication} avecImage />
		{/each}
	</div>

	{#if data.pages > 1}
		<nav class="mt-6 flex items-center justify-between" aria-label="Pagination">
			{#if data.page > 1}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href={lienListe(data.page - 1)}>← Page précédente</a
				>
			{:else}
				<span></span>
			{/if}
			<span class="text-sm text-ink-faint">Page {data.page} sur {data.pages}</span>
			{#if data.page < data.pages}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href={lienListe(data.page + 1)}>Page suivante →</a
				>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{:else}
	<p class="mt-5 text-ink-soft">Rien à afficher pour le moment.</p>
{/if}

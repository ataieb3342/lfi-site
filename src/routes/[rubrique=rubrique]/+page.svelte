<script lang="ts">
	import { page } from '$app/state';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Encart from '$lib/components/Encart.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { COULEUR_KIND } from '$lib/format';
	import { CHAPO_RUBRIQUE, KIND_PAR_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const titre = $derived(TITRE_RUBRIQUE[data.rubrique]);
	// La couleur du type de publication, portée par le surlignage de l'en-tête.
	const couleur = $derived(COULEUR_KIND[KIND_PAR_RUBRIQUE[data.rubrique]]);

	// Les trois rubriques listées ici ont un bandeau, sauf les actualités quand
	// l'application est désactivée dans les réglages. Le filet qui ferme le
	// bandeau est donc conditionnel : sans cela, la page des actualités
	// afficherait un trait tout seul sous son en-tête.
	const aBandeau = $derived(
		data.rubrique === 'articles' ||
			data.rubrique === 'revue-de-presse' ||
			(data.rubrique === 'actualites' && data.app.actif)
	);

	// Chaque page de la liste est une page à part entière : elle se désigne
	// elle-même comme canonique et porte son numéro dans le titre. Les renvoyer
	// toutes vers la page 1 ferait disparaître de l'index les publications
	// anciennes, qui ne sont listées nulle part ailleurs.
	const chemin = $derived(`/${data.rubrique}${data.page > 1 ? `?page=${data.page}` : ''}`);
	const suffixe = $derived(data.page > 1 ? ` (page ${data.page})` : '');
</script>

<Metadonnees
	titre="{titre}{suffixe} — {data.settings.siteName}"
	description={CHAPO_RUBRIQUE[data.rubrique]}
	canonique={chemin}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: titre, chemin: `/${data.rubrique}` }
	])}
/>

<!-- Pas de filet sous cet en-tête : le bandeau qui suit est une surface
     colorée, il pose déjà la limite. Deux traits l'un sur l'autre font une
     rayure. Les pages qui commencent par du texte, elles, gardent leur filet. -->
<header>
	<p class="text-xs font-bold tracking-[0.2em] uppercase {couleur}">{SURLIGNE_RUBRIQUE[data.rubrique]}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{titre}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{CHAPO_RUBRIQUE[data.rubrique]}</p>
</header>

<!-- L'encart de la rubrique est en tête : c'est une invitation, et une
     invitation placée après quinze publications et une pagination n'est jamais
     vue. Tous au même gabarit (voir Encart.svelte) : le bandeau Action
     populaire en jaune sur les actualités, la revue de presse sur les articles,
     la bibliothèque sur la revue de presse.

     Le filet est en dessous et non au-dessus : le bandeau est une surface
     colorée, il n'a pas besoin qu'on le sépare de l'en-tête, mais il faut le
     détacher de la liste qui suit. -->
<div class={aBandeau ? 'border-b border-line pb-5' : ''}>
	{#if data.rubrique === 'actualites'}
		<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} />
	{:else if data.rubrique === 'articles'}
		<Encart
			sureligne="Ce que nous lisons ailleurs"
			titre="La revue de presse"
			texte="Ce que nous avons lu ailleurs cette semaine, et ce que nous en retenons."
			href="/revue-de-presse"
		/>
	{:else if data.rubrique === 'revue-de-presse'}
		<Encart
			sureligne="Aller plus loin"
			titre="La bibliothèque"
			texte="Des outils pour comprendre les chiffres, et les lectures partagées autour de nos apéros."
			href="/bibliotheque"
			surface="fond-apero"
		/>
	{/if}
</div>

{#if data.publications.length}
	<div class="mt-5 space-y-5">
		{#each data.publications as publication (publication.id)}
			<CartePublication {publication} avecImage={data.rubrique === 'articles'} />
		{/each}
	</div>

	{#if data.pages > 1}
		<nav class="mt-6 flex items-center justify-between" aria-label="Pagination">
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
	<p class="mt-5 text-ink-soft">Rien à afficher pour le moment.</p>
{/if}

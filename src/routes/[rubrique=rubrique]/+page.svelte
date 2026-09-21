<script lang="ts">
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Encart from '$lib/components/Encart.svelte';
	import { COULEUR_KIND } from '$lib/format';
	import { CHAPO_RUBRIQUE, KIND_PAR_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const titre = $derived(TITRE_RUBRIQUE[data.rubrique]);
	const filtresActualites = {
		action: { titre: 'Actions', chapo: 'Les tractages, distributions, porte-à-porte et mobilisations du groupe.' },
		reunion: { titre: 'Événements', chapo: 'Les réunions publiques et rendez-vous ouverts à toutes et tous.' },
		formation: { titre: 'Formations', chapo: 'Les ateliers pour apprendre, partager des pratiques et gagner en confiance.' }
	} as const;
	const filtre = $derived(
		data.rubrique === 'actualites' && data.categorie && data.categorie in filtresActualites
			? filtresActualites[data.categorie as keyof typeof filtresActualites]
			: null
	);
	const titreAffiche = $derived(filtre?.titre ?? titre);
	const chapoAffiche = $derived(filtre?.chapo ?? CHAPO_RUBRIQUE[data.rubrique]);
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
</script>

<svelte:head>
	<title>{titreAffiche} — {data.settings.siteName}</title>
	<meta name="description" content={chapoAffiche} />
</svelte:head>

<!-- Pas de filet sous cet en-tête : le bandeau qui suit est une surface
     colorée, il pose déjà la limite. Deux traits l'un sur l'autre font une
     rayure. Les pages qui commencent par du texte, elles, gardent leur filet. -->
<header>
	<p class="text-xs font-bold tracking-[0.2em] uppercase {couleur}">{SURLIGNE_RUBRIQUE[data.rubrique]}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{titreAffiche}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{chapoAffiche}</p>
</header>

{#if data.rubrique === 'actualites' && !filtre}
	<section class="mt-5 rounded-2xl border border-line bg-carte p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
		<div>
			<p class="text-xs font-bold tracking-[0.18em] text-brand uppercase">Prochains rendez-vous</p>
			<h2 class="mt-2 text-2xl font-extrabold tracking-tight text-ink">L’agenda du groupe</h2>
			<p class="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
				Actions, événements, apéros et formations : toutes les dates sont réunies dans un calendrier.
			</p>
		</div>
		<a class="bouton mt-4 shrink-0 sm:mt-0" href="/agenda">Voir l’agenda →</a>
	</section>

	<nav class="mt-3 flex flex-wrap gap-2" aria-label="Catégories de l’agenda">
		<a class="pastille" href="/actualites?categorie=action">Actions</a>
		<a class="pastille" href="/actualites?categorie=reunion">Événements</a>
		<a class="pastille" href="/aperos">Apéros</a>
		<a class="pastille" href="/actualites?categorie=formation">Formations</a>
	</nav>
{/if}

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
				href="?page={data.page - 1}{data.categorie ? `&categorie=${data.categorie}` : ''}">← Page précédente</a
				>
			{:else}
				<span></span>
			{/if}
			<span class="text-sm text-ink-faint">Page {data.page} sur {data.pages}</span>
			{#if data.page < data.pages}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href="?page={data.page + 1}{data.categorie ? `&categorie=${data.categorie}` : ''}">Page suivante →</a
				>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{:else}
	<p class="mt-5 text-ink-soft">Rien à afficher pour le moment.</p>
{/if}

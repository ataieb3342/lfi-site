<script lang="ts">
	import { page } from '$app/state';
	import BandeauApero from '$lib/components/BandeauApero.svelte';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { organisation } from '$lib/donnees-structurees';
	import { formatDate, formatDateCourte, lienPublication } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const une = $derived(data.articles[0] ?? null);
	const suite = $derived(data.articles.slice(1));
	const prochainRendezVous = $derived(data.actus.find((actu) => actu.aVenir) ?? null);
</script>

<!-- Le titre de l'accueil porte la devise en plus du nom : c'est la ligne que
     Google affiche, et « LFI Dijon Centre » seul ne dit pas ce qu'on y trouve. -->
<Metadonnees
	titre="{data.settings.siteName} — {data.settings.tagline}"
	description={data.settings.description}
	image={une?.cover?.url ?? null}
	donnees={organisation(page.url.origin, data.settings, data.apero)}
/>

<!--
	Le bandeau d'ouverture. Il occupait 475 pixels — soit davantage que le
	carrousel de 425 qu'on avait retiré précisément pour cela : l'accueil
	s'ouvrait sur un écran entier de surface colorée et le premier article
	passait sous la ligne de flottaison.

	Il dit la même chose sur deux cents pixels, au gabarit des autres bandeaux
	du site (voir BandeauApero.svelte) : même rembourrage, même échelle de
	titre, mêmes boutons. La surface est `.fond-degrade` et non un aplat de
	violet, comme partout ailleurs sur le site.
-->
<section class="fond-degrade overflow-hidden rounded-2xl px-4 py-5 sm:px-6 sm:py-6">
	<div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
		<div>
			<p class="text-[0.6875rem] font-bold tracking-[0.18em] text-white/75 uppercase">
				Groupe d’action · Dijon Centre
			</p>
			<h1 class="titre-affiche mt-1 max-w-2xl text-2xl text-white sm:text-3xl">
				Agir ici, discuter ensemble, changer les choses.
			</h1>
			<p class="mt-2 max-w-2xl leading-snug text-white/85">{data.settings.description}</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<a class="bouton-sur-fond" href="/agenda">Voir l’agenda</a>
				<a class="bouton-sur-fond bouton-sur-fond-creux" href="/nous-rejoindre">Nous rejoindre</a>
			</div>
		</div>

		<!-- Le prochain rendez-vous, en vignette et non en colonne pleine hauteur :
		     c'est un raccourci, pas une seconde moitié de page. -->
		{#if prochainRendezVous}
			<a
				href={lienPublication(prochainRendezVous.kind, prochainRendezVous.slug)}
				class="group block rounded-xl bg-black/15 px-4 py-3 hover:bg-black/25 lg:w-64"
			>
				<p class="text-[0.6875rem] font-bold tracking-[0.18em] text-white/75 uppercase">
					Prochain rendez-vous{' · '}{formatDateCourte(prochainRendezVous.eventAt)}
				</p>
				<h2 class="mt-1 leading-snug font-bold text-white group-hover:underline">
					{prochainRendezVous.title}
				</h2>
			</a>
		{/if}
	</div>
</section>

<nav class="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Découvrir le site">
	<a class="carte group block p-5 hover:border-brand" href="/agenda">
		<span class="text-xs font-bold tracking-wide text-brand uppercase">Quand ?</span>
		<strong class="mt-1 block text-lg text-ink group-hover:text-brand">L’agenda</strong>
		<span class="mt-1 block text-sm text-ink-soft">Actions, événements, apéros et formations.</span>
	</a>
	<a class="carte group block p-5 hover:border-brand" href="/actualites?categorie=action">
		<span class="text-xs font-bold tracking-wide text-brand uppercase">Sur le terrain</span>
		<strong class="mt-1 block text-lg text-ink group-hover:text-brand">Nos actions</strong>
		<span class="mt-1 block text-sm text-ink-soft">Ce que le groupe organise près de chez vous.</span>
	</a>
	<a class="carte group block p-5 hover:border-brand" href="/le-groupe">
		<span class="text-xs font-bold tracking-wide text-brand uppercase">Avec qui ?</span>
		<strong class="mt-1 block text-lg text-ink group-hover:text-brand">Qui sommes-nous ?</strong>
		<span class="mt-1 block text-sm text-ink-soft">Le groupe, son fonctionnement et ses membres.</span>
	</a>
</nav>

{#if data.prochainApero}
	<BandeauApero apero={data.prochainApero} cadre={data.apero} />
{/if}

{#if une}
	<section class="border-b border-line py-6">
		<h2 class="sr-only">À la une</h2>
		<a href="/articles/{une.slug}" class="group grid gap-6 sm:grid-cols-2 sm:items-center">
			<!-- Format plus large sur téléphone : là, la grille passe en une seule
			     colonne et l'image occupe toute la largeur. En 16/10 elle mangeait
			     un quart de l'écran avant même le titre ; en 21/9 elle fait une
			     bande, qui illustre sans repousser le texte hors de vue. -->
			{#if une.cover}
				<img
					src={une.cover.url}
					alt={une.cover.alt}
					class="aspect-[21/9] w-full rounded-lg object-cover sm:aspect-[16/10]"
				/>
			{/if}
			<!-- Sans image de couverture, le titre monte de deux crans et prend le
			     style d'affiche : c'est la seule chose qui distingue « à la une »
			     des titres de la liste juste en dessous, et sans elle l'accueil
			     n'a plus de point d'entrée. Avec une image, celle-ci porte déjà
			     le poids. -->
			<div class={une.cover ? '' : 'sm:col-span-2'}>
				<p class="text-xs font-semibold tracking-wide text-brand uppercase">À la une</p>
				<h3
					class="titre-affiche mt-2 text-ink group-hover:text-brand
						{une.cover ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}"
				>
					{une.title}
				</h3>
				{#if une.summary}
					<!-- Le résumé ne grossit qu'à partir de `sm` : sur téléphone, le
					     titre occupe déjà quatre lignes, un chapeau en 18 px par-dessus
					     alourdit au lieu de hiérarchiser. -->
					<p class="mt-3 text-ink-soft {une.cover ? '' : 'max-w-2xl sm:text-lg'}">{une.summary}</p>
				{/if}
				<p class="mt-3 text-xs text-ink-faint">
					{formatDate(une.publishedAt)}{une.authorName ? ` · ${une.authorName}` : ''}
				</p>
			</div>
		</a>
	</section>
{/if}

<!-- `pt-6` et non `py-6` : le bandeau qui suit apporte sa propre marge haute,
     les deux s'ajoutaient. -->
<div class="grid gap-8 pt-6 lg:grid-cols-[1fr_20rem]">
	<!-- Masquée quand le seul article existant est déjà « à la une » :
	     un titre de section suivi du vide fait plus négligé qu'utile. -->
	{#if suite.length || !une}
		<section>
			<div class="mb-6 flex items-baseline justify-between border-b border-line pb-2">
				<h2 class="text-xl font-extrabold text-ink">Articles récents</h2>
				<a class="text-sm font-semibold text-brand hover:underline" href="/articles">Tout voir</a>
			</div>

			{#if suite.length}
				<div class="space-y-6">
					{#each suite as article (article.id)}
						<CartePublication publication={article} />
					{/each}
				</div>
			{:else}
				<p class="text-ink-soft">Aucun article publié pour le moment.</p>
			{/if}
		</section>
	{:else}
		<div></div>
	{/if}

	<aside>
		<div class="mb-6 flex items-baseline justify-between border-b border-line pb-2">
			<h2 class="text-xl font-extrabold text-ink">Actualités</h2>
			<a class="text-sm font-semibold text-brand hover:underline" href="/actualites">Tout voir</a>
		</div>

		{#if data.actus.length}
			<ul class="space-y-4">
				{#each data.actus as actu (actu.id)}
					<li class="border-b border-line pb-4 last:border-0">
						<a href="/actualites/{actu.slug}" class="block hover:text-brand">
							{#if actu.aVenir}
								<!-- Rendez-vous à venir : la date de l'action prime sur celle de
								     publication, c'est l'information utile au lecteur. -->
								<span
									class="inline-block rounded bg-accent-soft px-1.5 py-0.5 text-xs font-bold text-accent-dark"
								>
									{formatDateCourte(actu.eventAt)}
								</span>
							{:else}
								<time class="block text-xs text-ink-faint" datetime={actu.publishedAt ?? undefined}
									>{formatDate(actu.publishedAt)}</time
								>
							{/if}
							<span class="mt-1 block font-semibold">{actu.title}</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-ink-soft">Aucune actualité pour le moment.</p>
		{/if}
	</aside>
</div>

<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} />

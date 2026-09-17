<script lang="ts">
	import type { PageData } from './$types';
	import { formatTailleFichier } from '$lib/format';

	let { data }: { data: PageData } = $props();

	/** Le lien d'une page de résultats, en gardant la recherche en cours. */
	function lienPage(page: number): string {
		const params = new URLSearchParams();
		if (data.recherche) params.set('q', data.recherche);
		if (page > 1) params.set('page', String(page));
		const suite = params.toString();
		return suite ? `?${suite}` : '/bibliotheque';
	}
</script>

<svelte:head>
	<title>Bibliothèque — {data.settings.siteName}</title>
	<meta
		name="description"
		content="Les liens et documents PDF partagés autour des apéros thématiques."
	/>
</svelte:head>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Bibliothèque</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Ce que nous lisons, regardons et écoutons — proposé autour de nos apéros et relu par le groupe.
		Chacun peut en proposer depuis la fiche d’un apéro.
	</p>
</header>

<!-- La recherche est un formulaire ordinaire vers cette même page : elle passe
     par l'adresse (`?q=`), tourne en SQL, et porte donc sur toute la
     bibliothèque et non sur la seule page affichée. Elle fonctionne sans
     JavaScript, et un résultat se partage ou se met en favori. -->
<form method="GET" class="mt-5 flex max-w-lg flex-wrap items-end gap-2">
	<div class="min-w-0 flex-1">
		<label class="etiquette" for="q">Rechercher une ressource</label>
		<input
			id="q"
			name="q"
			class="champ"
			type="search"
			value={data.recherche}
			placeholder="Un titre, un thème, un site, un apéro…"
			autocomplete="off"
		/>
	</div>
	<button class="bouton py-2.5" type="submit">Rechercher</button>
	{#if data.recherche}
		<a class="bouton-secondaire py-2.5" href="/bibliotheque">Tout afficher</a>
	{/if}
</form>

{#if data.sources.length}
	<p class="aide mt-3">
		{#if data.recherche}
			{data.total} ressource{data.total > 1 ? 's' : ''} pour « {data.recherche} »
		{:else}
			{data.total} ressource{data.total > 1 ? 's' : ''} disponible{data.total > 1 ? 's' : ''}
		{/if}
	</p>

	<!-- En liste et non en cartes : une ressource est un lien, pas un produit à
	     mettre en vitrine. La liste en tient quinze là où la grille en montrait
	     quatre. -->
	<ul class="mt-3 divide-y divide-line border-y border-line">
		{#each data.sources as source (source.id)}
			<li class="py-4">
				<h2 class="font-bold text-ink">
					{#if source.pdf}
						<a class="hover:underline" href={source.pdf.url}>{source.title}</a>
					{:else if source.url}
						<a class="hover:underline" href={source.url} target="_blank" rel="noopener noreferrer nofollow">
							{source.title}
						</a>
					{:else}
						{source.title}
					{/if}
				</h2>

				{#if source.note}<p class="mt-1 text-sm text-ink-soft">{source.note}</p>{/if}

				<p class="mt-1 text-xs text-ink-faint">
					{#if source.pdf}
						PDF · {formatTailleFichier(source.pdf.octets)}
					{:else if source.site}
						{source.site}
					{/if}
					· <a class="hover:underline" href={source.apero.url}>{source.apero.titre}</a>
					{#if source.authorName} · proposé par {source.authorName}{/if}
				</p>

				{#if source.pdf && source.droitsDiffusion}
					<p class="mt-1 text-xs text-ink-faint">
						<strong>Droits de diffusion :</strong> {source.droitsDiffusion}
					</p>
				{/if}
			</li>
		{/each}
	</ul>

	{#if data.pages > 1}
		<nav class="mt-6 flex items-center justify-between" aria-label="Pagination">
			{#if data.page > 1}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href={lienPage(data.page - 1)}>← Page précédente</a
				>
			{:else}
				<span></span>
			{/if}
			<span class="text-sm text-ink-faint">Page {data.page} sur {data.pages}</span>
			{#if data.page < data.pages}
				<a
					class="rounded-full border border-line-forte px-4 py-2 text-sm font-semibold hover:bg-surface-alt"
					href={lienPage(data.page + 1)}>Page suivante →</a
				>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{:else if data.recherche}
	<p class="mt-5 text-ink-soft">
		Aucune ressource ne correspond à « {data.recherche} ».
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">Tout afficher</a>
	</p>
{:else}
	<p class="mt-5 text-ink-soft">
		Aucune ressource pour le moment. Les premières peuvent être proposées depuis la fiche d’un
		apéro.
	</p>
{/if}

<!-- Les outils et les jeux ont chacun leur page : ils sont appelés à se
     multiplier, et faire tourner un simulateur n'est pas la même chose que
     consulter un lien. Ces deux cartes sont leur porte d'entrée, en bas parce
     qu'on y arrive après avoir parcouru les ressources — d'où la pagination
     courte au-dessus, qui les garde à portée de vue.

     Pas de `border-t` ici : la liste des ressources se ferme déjà par le filet
     bas de son `border-y`, et les deux se touchaient. -->
<section class="mt-8" aria-labelledby="ailleurs">
	<h2 id="ailleurs" class="text-xs font-bold tracking-[0.15em] text-ink-faint uppercase">
		Aussi dans la bibliothèque
	</h2>
	<ul class="mt-4 grid gap-4 sm:grid-cols-2">
		<li class="carte relative transition hover:border-brand">
			<h3 class="text-lg font-extrabold text-ink">
				<a class="after:absolute after:inset-0" href="/boite-a-outils">Boîte à outils</a>
			</h3>
			<p class="mt-1 text-sm text-ink-soft">
				Entrez votre salaire ou votre loyer : onze outils vous montrent ce que les chiffres
				officiels disent de votre situation.
			</p>
		</li>
		<li class="carte relative transition hover:border-brand">
			<h3 class="text-lg font-extrabold text-ink">
				<a class="after:absolute after:inset-0" href="/jeux">Jeux</a>
			</h3>
			<p class="mt-1 text-sm text-ink-soft">
				Faits par des militants, sans publicité et sans traçage.
			</p>
		</li>
	</ul>
</section>

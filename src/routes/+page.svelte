<script lang="ts">
	import CarrouselAccueil from '$lib/components/CarrouselAccueil.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import { formatDate, formatDateCourte } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const une = $derived(data.articles[0] ?? null);
	const suite = $derived(data.articles.slice(1));
</script>

<svelte:head>
	<title>{data.settings.siteName}</title>
	<meta name="description" content={data.settings.description} />
</svelte:head>

<CarrouselAccueil
	siteName={data.settings.siteName}
	tagline={data.settings.tagline}
	description={data.settings.description}
	actions={data.actus.filter((a) => a.aVenir)}
	app={data.app}
/>

{#if une}
	<section class="border-b border-line py-10">
		<h2 class="sr-only">À la une</h2>
		<a href="/articles/{une.slug}" class="group grid gap-6 sm:grid-cols-2 sm:items-center">
			{#if une.cover}
				<img src={une.cover.url} alt={une.cover.alt} class="aspect-[16/10] w-full rounded-lg object-cover" />
			{/if}
			<div class={une.cover ? '' : 'sm:col-span-2'}>
				<p class="text-xs font-semibold tracking-wide text-brand uppercase">À la une</p>
				<h3 class="mt-2 text-2xl font-extrabold text-ink group-hover:text-brand sm:text-3xl">
					{une.title}
				</h3>
				{#if une.summary}<p class="mt-3 text-ink-soft">{une.summary}</p>{/if}
				<p class="mt-3 text-xs text-ink-faint">
					{formatDate(une.publishedAt)}{une.authorName ? ` · ${une.authorName}` : ''}
				</p>
			</div>
		</a>
	</section>
{/if}

<div class="grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
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

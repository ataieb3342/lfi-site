<script lang="ts">
	import { page } from '$app/state';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { formatDateCourte, formatDateLongue } from '$lib/format';
	import { CHAPO_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const prochain = $derived(data.aVenir[0] ?? null);
	const suivants = $derived(data.aVenir.slice(1));
	const cadre = $derived(data.apero);

	// « Café Chez Nous, 12 rue X » ou simplement « Café Chez Nous ».
	const lieuComplet = $derived([cadre.lieu, cadre.adresse].filter(Boolean).join(', '));
</script>

<!-- « à Dijon » dans le titre : c'est ce que les gens tapent, et « Les apéros »
     seul ne rattache la page à aucun lieu. -->
<Metadonnees
	titre="Les apéros thématiques à Dijon — {data.settings.siteName}"
	description={CHAPO_RUBRIQUE.aperos}
	image={prochain?.cover?.url ?? null}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: TITRE_RUBRIQUE.aperos, chemin: '/aperos' }
	])}
/>

<!-- Pas de filet : le bandeau du prochain apéro pose déjà la limite. -->
<header>
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">
		{cadre.rythme}{cadre.heure ? ` · ${cadre.heure}` : ''}{cadre.lieu ? ` · ${cadre.lieu}` : ''}
	</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{TITRE_RUBRIQUE.aperos}</h1>
	{#if cadre.presentation}
		<p class="mt-3 max-w-2xl text-lg text-ink-soft">{cadre.presentation}</p>
	{/if}
</header>

<!-- Le prochain apéro : la date et le thème avant tout le reste.

     Le filet est sous le bandeau et non sous l'en-tête : la surface pourpre
     pose déjà la limite en haut, c'est en bas qu'il faut la détacher de
     l'archive. Il est porté par un conteneur et non par la section elle-même,
     qui est arrondie : une bordure s'y dessinerait par-dessus le pourpre au
     lieu de faire un trait gris en dessous. -->
<div class="border-b border-line pb-5">
	<section class="fond-apero mt-5 overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-8" aria-labelledby="prochain">
		<div class="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
			<div class="max-w-2xl">
				<p id="prochain" class="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">Prochain apéro</p>
				{#if prochain}
					<p class="mt-3 text-lg font-extrabold text-white sm:text-2xl">
						<time datetime={prochain.eventAt}>{formatDateLongue(prochain.eventAt)}</time>
						{#if cadre.heure}<span class="whitespace-nowrap text-white/80"> · {cadre.heure}</span>{/if}
					</p>
					<h2 class="titre-affiche mt-2 text-3xl text-white sm:text-5xl">{prochain.title}</h2>
					{#if prochain.summary}
						<p class="mt-4 max-w-xl leading-relaxed text-white/90">{prochain.summary}</p>
					{/if}
					<div class="mt-8 flex flex-wrap items-center gap-4">
						<a
							href="/aperos/{prochain.slug}"
							class="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-pourpre transition-colors hover:bg-white/90"
							>En savoir plus</a
						>
						<a href="/aperos/{prochain.slug}#sources" class="text-sm font-semibold text-white/90 underline-offset-4 hover:underline">
							{#if prochain.nombreSources}
								Pour préparer la soirée : {prochain.nombreSources} source{prochain.nombreSources > 1 ? 's' : ''} partagée{prochain.nombreSources > 1 ? 's' : ''}
							{:else}
								Partager une source pour préparer la soirée
							{/if}
						</a>
					</div>
				{:else}
					<h2 class="titre-affiche mt-3 text-2xl text-white sm:text-4xl">Le prochain thème arrive bientôt</h2>
					<p class="mt-4 max-w-xl leading-relaxed text-white/90">
						La date et le sujet du prochain apéro seront annoncés ici. En attendant, les résumés
						des précédents sont à lire ci-dessous.
					</p>
				{/if}
			</div>

			{#if lieuComplet}
				<address class="text-sm not-italic leading-relaxed text-white/85 sm:text-right">
					<span class="block font-bold text-white">{cadre.lieu}</span>
					{#if cadre.adresse}<span class="block">{cadre.adresse}</span>{/if}
					<span class="block">{cadre.rythme}{cadre.heure ? `, ${cadre.heure}` : ''}</span>
				</address>
			{/if}
		</div>
	</section>
</div>

{#if suivants.length}
	<section class="mt-8" aria-labelledby="suivants">
		<h2 id="suivants" class="text-sm font-bold tracking-wide text-ink-faint uppercase">Et ensuite</h2>
		<ul class="mt-3 divide-y divide-line rounded-lg border border-line">
			{#each suivants as apero (apero.id)}
				<li>
					<a href="/aperos/{apero.slug}" class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-alt">
						<time class="w-28 shrink-0 text-sm font-bold text-accent-dark" datetime={apero.eventAt}
							>{formatDateCourte(apero.eventAt)}</time
						>
						<span class="font-semibold text-ink">{apero.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-8" aria-labelledby="precedents">
	<div class="mb-6 flex items-baseline justify-between border-b border-line pb-2">
		<h2 id="precedents" class="text-xl font-extrabold text-ink">Les précédents</h2>
		<p class="text-sm text-ink-faint">{data.passes.length} thème{data.passes.length > 1 ? 's' : ''} déjà abordé{data.passes.length > 1 ? 's' : ''}</p>
	</div>

	{#if data.passes.length}
		<ol class="space-y-6">
			{#each data.passes as apero (apero.id)}
				<li class="group border-b border-line pb-5">
					<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
						<time class="font-semibold text-ink-soft" datetime={apero.eventAt}>{formatDateLongue(apero.eventAt)}</time>
						{#if !apero.resumeDisponible}
							<span class="rounded bg-surface-alt px-1.5 py-0.5 font-semibold">Résumé à venir</span>
						{/if}
					</p>
					<h3 class="mt-1 text-lg font-bold text-ink sm:text-xl">
						<a href="/aperos/{apero.slug}" class="hover:text-brand hover:underline underline-offset-4">{apero.title}</a>
					</h3>
					{#if apero.summary}
						<p class="mt-1.5 line-clamp-3 text-sm text-ink-soft">{apero.summary}</p>
					{/if}
					{#if apero.resumeDisponible}
						<p class="mt-2 text-sm">
							<a href="/aperos/{apero.slug}" class="font-semibold text-brand hover:underline">Lire le résumé des échanges</a>
							{#if apero.commentCount}
								<span class="text-ink-faint"> · {apero.commentCount} commentaire{apero.commentCount > 1 ? 's' : ''}</span>
							{/if}
							{#if apero.nombreSources}
								<span class="text-ink-faint"> · {apero.nombreSources} source{apero.nombreSources > 1 ? 's' : ''} partagée{apero.nombreSources > 1 ? 's' : ''}</span>
							{/if}
						</p>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p class="text-ink-soft">Aucun apéro passé pour le moment : le premier résumé apparaîtra ici.</p>
	{/if}
</section>

<!-- Un simple lien, pas un encart : la page des apéros en compte déjà un gros
     en tête (le prochain apéro), et un second pavé coloré juste après l'archive
     ferait doublon. -->
<section class="mt-8 border-t border-line pt-5">
	<p class="text-sm text-ink-soft">
		Tout ce qui est proposé pour préparer les soirées est rassemblé dans la
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">bibliothèque</a> : on
		peut y piocher sans être venu à l'apéro.
	</p>
</section>

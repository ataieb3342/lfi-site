<script lang="ts">
	import { page } from '$app/state';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { organisation } from '$lib/donnees-structurees';
	import { COULEUR_KIND, formatDate, formatDateCourte, formatHeure, libellePublication, lienPublication, LIBELLE_EVENEMENT } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const premiereUne = $derived(data.aLaUne[0] ?? null);
</script>

<!-- Le titre de l'accueil porte la devise en plus du nom : c'est la ligne que
     Google affiche, et « LFI Dijon Centre » seul ne dit pas ce qu'on y trouve. -->
<Metadonnees
	titre="{data.settings.siteName} — {data.settings.tagline}"
	description={data.settings.description}
	image={premiereUne?.cover?.url ?? null}
	donnees={organisation(page.url.origin, data.settings, data.apero)}
/>

<!--
	L'accueil s'ouvre sur ce qui se passe, pas sur un slogan : un titre d'une
	ligne, puis le fil des quinze prochains jours. Une fiche par rendez-vous,
	événements, formations et apéros confondus, dans la couleur de sa
	catégorie (celle de l'agenda). Le fil défile au doigt sur téléphone
	(`scroll-snap`, aucun script, aucun défilement automatique) et tient sur
	une seule bande : les articles restent dans le premier écran.

	Le tout est posé sur la surface violette du site : c'est le seul pavé
	coloré de la page, et les fiches claires y ressortent comme des cartes
	posées dessus. Elles gardent `bg-carte` et les couleurs de l'agenda,
	lisibles dans les deux thèmes ; seul le texte hors des fiches est blanc.

	Il remplace le grand bandeau d'ouverture, les trois cartes de navigation
	et le bandeau du prochain apéro, qui repoussaient ensemble l'article à la
	une à près de neuf cents pixels sur téléphone.
-->
<section aria-labelledby="titre-accueil" class="fond-degrade overflow-hidden rounded-2xl px-4 py-5 sm:px-6">
	<p class="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">Groupe d’action · Dijon Centre</p>
	<h1 id="titre-accueil" class="titre-affiche mt-1 text-2xl text-white sm:text-3xl">
		Agir ici, discuter ensemble, changer les choses.
	</h1>

	{#if data.prochainsJours.length}
		<div class="mt-5 flex items-baseline justify-between gap-4">
			<h2 class="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">Les prochains jours</h2>
			<a class="text-sm font-semibold text-white underline-offset-2 hover:underline" href="/agenda">Tout l’agenda →</a>
		</div>
		<ol class="fil-jours mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
			{#each data.prochainsJours as rdv (rdv.id)}
				{@const lieu = rdv.eventLocation || (rdv.kind === 'apero' ? data.apero.lieu : '')}
				{@const heure = rdv.eventStartTime || (rdv.kind === 'apero' ? data.apero.heure : '')}
				<li class="agenda-{rdv.eventCategory} w-60 shrink-0 snap-start">
					<a
						href={lienPublication(rdv.kind, rdv.slug)}
						class="group flex h-full flex-col rounded-xl border-t-4 border-current bg-carte px-3.5 py-3 transition hover:-translate-y-0.5"
					>
						<span class="text-xs font-bold">
							{rdv.jour ?? formatDateCourte(rdv.eventAt)}{heure ? ` · ${formatHeure(heure)}` : ''}
						</span>
						<span class="mt-1 line-clamp-2 leading-snug font-bold text-ink group-hover:underline">{rdv.title}</span>
						<span class="mt-auto pt-1.5 text-xs text-ink-faint">
							<span class="font-semibold">{LIBELLE_EVENEMENT[rdv.eventCategory]}</span>{lieu ? ` · ${lieu}` : ''}
						</span>
						{#if rdv.rythme}
							<span class="text-xs text-ink-faint">{rdv.rythme}</span>
						{:else if rdv.autresDates}
							<span class="text-xs text-ink-faint">Et {rdv.autresDates} autre{rdv.autresDates > 1 ? 's' : ''} date{rdv.autresDates > 1 ? 's' : ''}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="mt-3 text-white/85">
			Pas de rendez-vous annoncé dans les quinze prochains jours. <a class="font-semibold text-white underline" href="/agenda">Voir l’agenda</a>
		</p>
	{/if}
</section>

{#if data.aLaUne.length}
	<section class="border-b border-line py-6">
		<h2 class="mb-4 text-xs font-bold tracking-[0.14em] text-brand uppercase">À la une</h2>
		<div class="grid gap-5 {data.aLaUne.length > 1 ? 'md:grid-cols-2' : ''}">
			{#each data.aLaUne as publication (publication.id)}
				<a
					href={lienPublication(publication.kind, publication.slug)}
					class="group min-w-0 overflow-hidden rounded-xl border border-line bg-carte transition hover:-translate-y-0.5 hover:border-brand"
				>
					{#if publication.cover}
						<div class="grid aspect-video w-full min-w-0 place-items-center overflow-hidden bg-surface-alt">
							<img
								src={publication.cover.url}
								alt={publication.cover.alt}
								class="block h-full max-h-full w-full max-w-full object-contain"
							/>
						</div>
					{/if}
					<div class="p-4 sm:p-5">
						<p class="text-xs font-bold tracking-wide uppercase {COULEUR_KIND[publication.kind]}">
							{libellePublication(publication.kind, publication.eventCategory)}
							{#if publication.eventAt}
								<span class="text-ink-faint"> · {formatDateCourte(publication.eventAt)}</span>
							{/if}
						</p>
						<h3 class="titre-affiche mt-2 text-2xl text-ink group-hover:text-brand sm:text-3xl">
							{publication.title}
						</h3>
						{#if publication.summary}
							<p class="mt-3 line-clamp-3 text-ink-soft">{publication.summary}</p>
						{/if}
						{#if !publication.eventAt}
							<p class="mt-3 text-xs text-ink-faint">
								{formatDate(publication.publishedAt)}{publication.authorName ? ` · ${publication.authorName}` : ''}
							</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<!-- `pt-6` et non `py-6` : le bandeau qui suit apporte sa propre marge haute,
     les deux s'ajoutaient. -->
<div class="grid gap-8 pt-6 lg:grid-cols-[1fr_20rem]">
	<!-- Masquée quand le seul article existant est déjà « à la une » :
	     un titre de section suivi du vide fait plus négligé qu'utile. -->
	{#if data.articles.length || !data.aLaUne.length}
		<section>
			<div class="mb-6 flex items-baseline justify-between border-b border-line pb-2">
				<h2 class="text-xl font-extrabold text-ink">Articles récents</h2>
				<a class="text-sm font-semibold text-brand hover:underline" href="/articles">Tout voir</a>
			</div>

			{#if data.articles.length}
				<div class="space-y-6">
					{#each data.articles as article (article.id)}
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
			<!-- Une ligne par rendez-vous, la date en colonne à gauche : la liste
			     se parcourt d'un coup d'œil, comme un agenda de poche. Le titre est
			     coupé à deux lignes, la fiche complète est à un clic. -->
			<ul>
				{#each data.actus as actu (actu.id)}
					<li class="border-b border-line py-2.5 first:pt-0 last:border-0">
						<a href="/actualites/{actu.slug}" class="flex gap-3 hover:text-brand">
							{#if actu.aVenir}
								<!-- Rendez-vous à venir : la date de l'action prime sur celle de
								     publication, c'est l'information utile au lecteur. -->
								<span
									class="w-24 shrink-0 self-start rounded whitespace-nowrap bg-accent-soft px-1.5 py-0.5 text-center text-xs font-bold text-accent-dark"
								>
									{formatDateCourte(actu.eventAt)}
								</span>
							{:else}
								<span class="w-24 shrink-0 whitespace-nowrap pt-0.5 text-center text-xs text-ink-faint">
									{formatDateCourte(actu.eventAt ?? actu.publishedAt?.slice(0, 10))}
								</span>
							{/if}
							<span class="min-w-0">
								<span class="line-clamp-2 text-sm leading-snug font-semibold">{actu.title}</span>
								{#if actu.autresDates}
									<span class="block text-xs text-ink-faint">
										+ {actu.autresDates} autre{actu.autresDates > 1 ? 's' : ''} date{actu.autresDates > 1 ? 's' : ''}
									</span>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
			<a class="mt-3 inline-block text-sm font-semibold text-brand hover:underline" href="/agenda">Tout l’agenda</a>
		{:else}
			<p class="text-sm text-ink-soft">Aucune actualité pour le moment.</p>
		{/if}
	</aside>
</div>

<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} />

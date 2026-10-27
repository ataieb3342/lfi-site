<script lang="ts">
	import { page } from '$app/state';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CarteArticle from '$lib/components/CarteArticle.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { organisation } from '$lib/donnees-structurees';
	import { mediasParFormat } from '$lib/medias';
	import { COULEUR_KIND, formatDate, formatDateCourte, formatHeure, libellePublication, lienPublication, LIBELLE_EVENEMENT } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const premiereUne = $derived(data.aLaUne[0] ?? null);
</script>

<!-- Le titre de l'accueil porte la devise en plus du nom : c'est la ligne que
     Google affiche, et « LFI Dijon Centre » seul ne dit pas ce qu'on y trouve. -->
<Metadonnees
	titre="{data.settings.siteName} - {data.settings.tagline}"
	description={data.settings.description}
	image={premiereUne?.cover?.url ?? null}
	donnees={organisation(page.url.origin, data.settings, data.apero)}
/>

<!--
	L'accueil s'ouvre sur ce qui se passe, pas sur un slogan : un titre d'une
	ligne, puis le fil des prochains rendez-vous (un nombre fixe, pour qu'il
	ne soit jamais presque vide). Une fiche par rendez-vous,
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

	{#if data.prochainsRendezVous.length}
		<div class="mt-5 flex items-baseline justify-between gap-4">
			<h2 class="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">Les prochains rendez-vous</h2>
			<a class="text-sm font-semibold text-white underline-offset-2 hover:underline" href="/agenda">Tout l’agenda →</a>
		</div>
		<ol class="fil-jours mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
			{#each data.prochainsRendezVous as rdv (rdv.id)}
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
			Pas de rendez-vous annoncé pour le moment. <a class="font-semibold text-white underline" href="/agenda">Voir l’agenda</a>
		</p>
	{/if}
</section>

{#if data.aLaUne.length}
	<section class="border-b border-line py-6">
		<h2 class="mb-4 text-xs font-bold tracking-[0.14em] text-brand uppercase">À la une</h2>
		<!-- La première fiche en grand ; les suivantes en cartes compactes, deux
		     par ligne, avec une petite vignette. Avec de grandes images partout,
		     une fiche sans image posée à côté d'une fiche illustrée était étirée
		     à sa hauteur et restait vide, et une fiche seule sur la dernière
		     ligne laissait un trou à côté. La grande fiche prend toute la
		     largeur quand le reste est pair, sinon elle se range comme les autres
		     pour que la grille tombe juste. -->
		<div class="grid gap-4 md:grid-cols-2">
			{#each data.aLaUne as publication, i (publication.id)}
				{@const large = i === 0 && (data.aLaUne.length === 1 || data.aLaUne.length % 2 === 1)}
				{@const illustree = large && publication.cover}
				<a
					href={lienPublication(publication.kind, publication.slug)}
					class="group flex min-w-0 overflow-hidden rounded-xl border border-line bg-carte transition hover:-translate-y-0.5 hover:border-brand {large
						? 'flex-col md:col-span-2' + (illustree ? ' md:grid md:grid-cols-2' : '')
						: 'gap-4 p-4'}"
				>
					{#if illustree && publication.cover}
						<div class="grid aspect-video w-full min-w-0 place-items-center overflow-hidden bg-surface-alt">
							<img
								src={publication.cover.url}
								alt={publication.cover.alt}
								class="block h-full max-h-full w-full max-w-full object-contain"
							/>
						</div>
					{/if}
					<div class="min-w-0 flex-1 {large ? 'p-4 sm:p-6 md:self-center' : ''}">
						<p class="text-xs font-bold tracking-wide uppercase {COULEUR_KIND[publication.kind]}">
							{libellePublication(publication.kind, publication.eventCategory)}
							{#if publication.eventAt}
								<span class="text-ink-faint"> · {formatDateCourte(publication.eventAt)}</span>
							{/if}
						</p>
						<h3
							class="titre-affiche mt-2 text-ink group-hover:text-brand {large
								? 'text-2xl sm:text-3xl'
								: 'line-clamp-3 text-xl'}"
						>
							{publication.title}
						</h3>
						{#if publication.summary}
							<p class="mt-2 text-ink-soft {large ? 'line-clamp-3' : 'line-clamp-2 text-sm'}">{publication.summary}</p>
						{/if}
						{#if !publication.eventAt}
							<p class="mt-2 text-xs text-ink-faint">
								{formatDate(publication.publishedAt)}{publication.authorName ? ` · ${publication.authorName}` : ''}
							</p>
						{/if}
					</div>
					{#if !large && publication.cover}
						<!-- `alt` vide : la vignette illustre le titre qui la précède. -->
						<img
							src={publication.cover.url}
							alt=""
							class="size-24 shrink-0 self-start rounded-lg bg-surface-alt object-cover sm:size-28"
						/>
					{/if}
				</a>
			{/each}
		</div>
	</section>
{/if}

<!-- Les derniers articles, sur toute la largeur et dans la grille de la page
     Articles. La moitié droite portait « Plus tard dans l'agenda », la suite
     du fil du haut : on coupait la page entre deux sujets, et une liste de
     rendez-vous lointains n'apprenait rien que « Tout l'agenda » ne donne
     déjà. `pt-6` et non `py-6` : ce qui suit apporte sa propre marge haute.
     Masquée quand le seul article existant est déjà « à la une » : un titre
     de section suivi du vide fait plus négligé qu'utile. -->
{#if data.articles.length || !data.aLaUne.length}
	<section class="pt-6">
		<div class="mb-6 flex items-baseline justify-between border-b border-line pb-2">
			<h2 class="text-xl font-extrabold text-ink">Derniers articles</h2>
			<a class="text-sm font-semibold text-brand hover:underline" href="/articles">Tout voir</a>
		</div>

		{#if data.articles.length}
			<div class="grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3">
				{#each data.articles as article (article.id)}
					<CarteArticle publication={article} />
				{/each}
			</div>
		{:else}
			<p class="text-ink-soft">Aucun article publié pour le moment.</p>
		{/if}
	</section>
{/if}

<!-- Les médias qu'on recommande, sous les articles. Quatre cartes en
     grille, avec « On recommande » pour seul titre, ne disaient ni ce qu'on
     recommandait ni pourquoi, et le format (« À regarder ») se perdait sous
     chaque nom. La section s'ouvre donc sur une phrase qui dit pourquoi,
     range les médias par format en deux colonnes - comme la page /medias -
     et se ferme sur le lien vers la liste complète. Les liens sortent du
     site : la flèche ↗ l'annonce, nouvel onglet, `noopener noreferrer`.
     Pas en tête de page : l'accueil montre d'abord ce que fait le groupe. -->
{#if data.medias.length}
	{@const formats = mediasParFormat(data.medias)}
	<section class="mt-8 border-t border-line pt-6" aria-labelledby="titre-medias">
		<p class="text-xs font-bold tracking-[0.14em] text-pourpre uppercase">On recommande</p>
		<h2 id="titre-medias" class="titre-affiche mt-1 text-2xl text-ink">S’informer ailleurs</h2>
		<p class="mt-2 max-w-2xl text-ink-soft">
			Des médias indépendants, hors des groupes de milliardaires, que nous regardons et lisons nous-mêmes.
		</p>

		<div class="mt-5 grid gap-6 {formats.length > 1 ? 'md:grid-cols-2' : ''}">
			{#each formats as format (format.id)}
				<div>
					<h3 class="text-xs font-bold tracking-[0.15em] text-ink-faint uppercase">{format.titre}</h3>
					<ul class="mt-3 space-y-3">
						{#each format.medias as media (media.id)}
							<li class="carte group relative flex items-start gap-3 transition hover:border-brand">
								<!-- Logo décoratif : le nom du média suit, `alt` vide pour ne pas le lire deux fois. -->
								<img class="size-10 shrink-0 rounded-lg object-cover" src={media.logo} alt="" width="40" height="40" loading="lazy" />
								<div class="min-w-0">
									<p class="font-bold text-ink">
										<a
											class="after:absolute after:inset-0 group-hover:text-brand"
											href={media.lien}
											target="_blank"
											rel="noopener noreferrer"
										>
											{media.nom}<span class="ml-1 text-ink-faint" aria-hidden="true">↗</span>
										</a>
									</p>
									<p class="mt-0.5 text-sm leading-snug text-ink-soft">{media.description}</p>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<a class="mt-5 inline-block text-sm font-semibold text-brand hover:underline" href="/medias">
			Tous les médias qu’on recommande →
		</a>
	</section>
{/if}

<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} />

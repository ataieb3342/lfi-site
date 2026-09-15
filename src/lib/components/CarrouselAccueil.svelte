<script lang="ts">
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import { formatDate, formatDateLongue } from '$lib/format';
	import type { PublicationVue } from '$lib/types';

	/**
	 * Carrousel d'accueil.
	 *
	 * Le défilement repose sur `scroll-snap` du navigateur, pas sur du
	 * JavaScript : sans script, on fait glisser au doigt ou à la molette et tout
	 * fonctionne. Le JavaScript n'ajoute que le confort — les flèches, les
	 * pastilles, et la synchronisation de la pastille active.
	 *
	 * Pas de défilement automatique, volontairement : une diapositive qui bouge
	 * seule fait perdre sa place à qui lit lentement, gêne les personnes
	 * utilisant un lecteur d'écran, et déclenche des clics involontaires sur
	 * mobile. Le visiteur avance quand il le décide.
	 */
	let {
		siteName,
		tagline,
		description,
		actions = [],
		apero = null,
		cadreApero,
		app
	}: {
		siteName: string;
		tagline: string;
		description: string;
		actions?: PublicationVue[];
		/** Le prochain apéro thématique, s'il est annoncé. */
		apero?: PublicationVue | null;
		/** Heure et lieu habituels des apéros (réglages). */
		cadreApero: { heure: string; lieu: string };
		app: { actif: boolean; android: string; ios: string };
	} = $props();

	type Diapositive =
		| { id: string; type: 'apero'; action: PublicationVue }
		| { id: string; type: 'identite' }
		| { id: string; type: 'action'; action: PublicationVue }
		| { id: string; type: 'application' };

	// Le prochain apéro ouvre le carrousel : c'est le rendez-vous récurrent, le
	// plus concret pour un visiteur, et il change toutes les deux semaines.
	// Puis l'identité du groupe, les actions à venir (trois au plus), et la
	// bulle de l'application si elle est activée.
	const diapositives = $derived<Diapositive[]>([
		...(apero ? [{ id: `apero-${apero.id}`, type: 'apero' as const, action: apero }] : []),
		{ id: 'identite', type: 'identite' },
		...actions.slice(0, 3).map((a) => ({ id: `action-${a.id}`, type: 'action' as const, action: a })),
		...(app.actif ? [{ id: 'application', type: 'application' as const }] : [])
	]);

	let piste = $state<HTMLDivElement | null>(null);
	let courante = $state(0);
	// Vrai une fois le script chargé. Les diapositives hors champ ne sont
	// rendues inertes qu'à partir de là : sans script, `courante` resterait à
	// zéro et les liens des autres diapositives seraient inutilisables.
	let scriptActif = $state(false);

	function allerA(i: number) {
		if (!piste) return;
		// Le glissement animé est désactivé pour qui a demandé à son système de
		// limiter les animations : ce réglage existe notamment pour les personnes
		// sujettes au mal des transports visuel.
		const anime = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		piste.scrollTo({ left: piste.clientWidth * i, behavior: anime ? 'smooth' : 'instant' });
	}

	$effect(() => {
		if (piste) piste.scrollLeft = 0;
		scriptActif = true;
	});

	function surDefilement() {
		if (!piste) return;
		courante = Math.round(piste.scrollLeft / piste.clientWidth);
	}
</script>

<!-- Le titre principal de la page est ici, hors du carrousel : dans une
     diapositive, il pouvait arriver après d'autres titres et perturbait
     l'ordre de lecture des lecteurs d'écran. -->
<h1 class="sr-only">{siteName}</h1>

<section
	class="relative"
	aria-roledescription="carrousel"
	aria-label="À la une"
>
	<div
		bind:this={piste}
		onscroll={surDefilement}
		class="flex snap-x snap-mandatory overflow-x-auto
			[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		{#each diapositives as diapo, i (diapo.id)}
			<!-- Une diapositive hors champ est inerte : la touche Tab ne peut plus
			     atteindre ses boutons, ce qui faisait sauter le carrousel. -->
			<div
				class="w-full shrink-0 snap-start"
				aria-roledescription="diapositive"
				aria-label="{i + 1} sur {diapositives.length}"
				inert={scriptActif && i !== courante}
			>
				{#if diapo.type === 'apero'}
					<!-- Prochain apéro : surface bordeaux, la seule du site, pour qu'on
					     le reconnaisse d'un coup d'œil. -->
					<div
						class="fond-apero relative flex h-full flex-col justify-center overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-14"
					>
						{#if diapo.action.cover}
							<!-- L'image de couverture en fond, teintée par la surface : elle
							     habille sans gêner la lecture. -->
							<img src={diapo.action.cover.url} alt="" class="absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden="true" />
						{/if}
						<div class="relative max-w-2xl">
							<p class="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">Prochain apéro</p>
							<p class="mt-3 text-lg font-extrabold text-white sm:text-2xl">
								<time datetime={diapo.action.eventAt}>{formatDateLongue(diapo.action.eventAt)}</time>
								{#if cadreApero.heure}<span class="whitespace-nowrap text-white/80"> · {cadreApero.heure}</span>{/if}
							</p>
							<h2 class="titre-affiche mt-2 text-3xl text-white sm:text-5xl">
								{diapo.action.title}
							</h2>
							{#if diapo.action.summary}
								<p class="mt-4 max-w-xl leading-relaxed text-white/90">{diapo.action.summary}</p>
							{/if}
							<div class="mt-8 flex flex-wrap items-center gap-4">
								<a
									href="/aperos/{diapo.action.slug}"
									class="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-pourpre transition-colors hover:bg-white/90"
									>En savoir plus</a
								>
								{#if cadreApero.lieu}
									<span class="text-sm font-semibold text-white/85">{cadreApero.lieu}</span>
								{/if}
							</div>
						</div>
					</div>
				{:else if diapo.type === 'identite'}
					<div class="fond-degrade relative h-full overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-14">
						<div class="relative max-w-2xl">
							<p class="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">{siteName}</p>
							<h2 class="titre-affiche mt-3 text-3xl text-white sm:text-6xl">{tagline}</h2>
							<p class="mt-5 max-w-xl text-lg leading-relaxed text-white/90">{description}</p>
							<div class="mt-8 flex flex-wrap gap-3">
								<a
									href="/nous-rejoindre"
									class="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-white/90"
									>Rejoindre le groupe</a
								>
								<a
									href="/articles"
									class="rounded-full border border-white/50 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
									>Lire nos articles</a
								>
							</div>
						</div>
					</div>
				{:else if diapo.type === 'action'}
					<!-- Prochaine action : la date passe avant tout le reste, c'est ce
					     que le visiteur doit retenir. -->
					<div
						class="fond-actu relative flex h-full flex-col justify-center overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-14"
					>
						{#if diapo.action.cover}
							<img src={diapo.action.cover.url} alt="" class="absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden="true" />
						{/if}
						<div class="relative max-w-2xl">
							<p class="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
								Prochaine action
							</p>
							<p class="mt-3 text-lg font-extrabold text-white sm:text-2xl">
								<time datetime={diapo.action.eventAt}>{formatDate(diapo.action.eventAt)}</time>
							</p>
							<h2 class="titre-affiche mt-2 text-3xl text-white sm:text-5xl">
								{diapo.action.title}
							</h2>
							{#if diapo.action.summary}
								<p class="mt-4 max-w-xl leading-relaxed text-white/90">{diapo.action.summary}</p>
							{/if}
							<div class="mt-8">
								<a
									href="/actualites/{diapo.action.slug}"
									class="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-dark transition-colors hover:bg-white/90"
									>En savoir plus</a
								>
							</div>
						</div>
					</div>
				{:else}
					<BandeauApplication
						actif={app.actif}
						android={app.android}
						ios={app.ios}
						autonome={false}
					/>
				{/if}
			</div>
		{/each}
	</div>

	{#if diapositives.length > 1}
		<div class="mt-4 flex items-center justify-center gap-3">
			<button
				type="button"
				class="rounded-full border border-line-forte p-2 text-ink-soft transition-colors hover:bg-surface-alt"
				aria-label="Diapositive précédente"
				onclick={() => allerA(Math.max(0, courante - 1))}
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
					stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="m15 18-6-6 6-6" />
				</svg>
			</button>

			<div class="flex gap-2">
				{#each diapositives as diapo, i (diapo.id)}
					<button
						type="button"
						class="h-2.5 rounded-full transition-all
							{i === courante ? 'w-6 bg-brand' : 'w-2.5 bg-line-forte hover:bg-ink-faint'}"
						aria-label="Aller à la diapositive {i + 1}"
						aria-current={i === courante ? 'true' : undefined}
						onclick={() => allerA(i)}
					></button>
				{/each}
			</div>

			<button
				type="button"
				class="rounded-full border border-line-forte p-2 text-ink-soft transition-colors hover:bg-surface-alt"
				aria-label="Diapositive suivante"
				onclick={() => allerA(Math.min(diapositives.length - 1, courante + 1))}
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
					stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="m9 18 6-6-6-6" />
				</svg>
			</button>
		</div>
	{/if}
</section>

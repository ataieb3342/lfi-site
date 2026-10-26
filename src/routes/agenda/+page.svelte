<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { PublicationVue } from '$lib/types';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { COULEUR_KIND, formatHeure, LIBELLE_EVENEMENT, lienPublication } from '$lib/format';
	import { CHAPO_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';

	let { data }: { data: PageData } = $props();

	const filtres = [
		{ valeur: null, libelle: 'Tout' },
		{ valeur: 'reunion', libelle: 'Événements' },
		{ valeur: 'formation', libelle: 'Formations' },
		{ valeur: 'apero', libelle: 'Apéros' }
	] as const;

	/** L'adresse d'une vue : on garde le filtre en changeant de vue, et inversement. */
	function lien(options: { type?: string | null; vue?: 'liste' | 'calendrier'; mois?: string }): string {
		const params = new URLSearchParams();
		const vue = options.vue ?? data.vue;
		const type = options.type === undefined ? data.type : options.type;
		if (vue === 'calendrier') {
			params.set('vue', 'calendrier');
			const mois = options.mois ?? data.mois;
			if (mois !== data.aujourdhui.slice(0, 7)) params.set('mois', mois);
		}
		if (type) params.set('type', type);
		const suite = params.toString();
		return `/agenda${suite ? `?${suite}` : ''}`;
	}

	function dateDe(iso: string): Date {
		// Midi : une date seule ne doit jamais basculer sur la veille.
		return new Date(`${iso}T12:00:00`);
	}

	const demain = $derived.by(() => {
		const d = dateDe(data.aujourdhui);
		d.setDate(d.getDate() + 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});

	function titreMois(mois: string): string {
		return dateDe(`${mois}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
	}

	/** La liste, regroupée par mois : on lit « en novembre » avant de lire les dates. */
	const parMois = $derived.by(() => {
		const groupes: { mois: string; rendezVous: PublicationVue[] }[] = [];
		for (const rdv of data.rendezVous) {
			const mois = rdv.eventAt!.slice(0, 7);
			const dernier = groupes.at(-1);
			if (dernier?.mois === mois) dernier.rendezVous.push(rdv);
			else groupes.push({ mois, rendezVous: [rdv] });
		}
		return groupes;
	});

	// L'heure et le lieu d'un apéro sont souvent ceux des réglages (le bar
	// habituel) : la fiche ne les répète pas.
	function heure(rdv: PublicationVue): string {
		return rdv.eventStartTime ? formatHeure(rdv.eventStartTime) : rdv.kind === 'apero' ? data.apero.heure : '';
	}
	function lieu(rdv: PublicationVue): string {
		return rdv.eventLocation || (rdv.kind === 'apero' ? data.apero.lieu : '');
	}

	// Le calendrier commence le lundi. Les cases nulles complètent la première
	// et la dernière semaine afin de toujours conserver une grille de sept jours.
	const grille = $derived.by(() => {
		const [annee, numeroMois] = data.mois.split('-').map(Number);
		const premierJour = new Date(annee, numeroMois - 1, 1);
		const joursDansMois = new Date(annee, numeroMois, 0).getDate();
		const casesAvant = (premierJour.getDay() + 6) % 7;
		const cases: (number | null)[] = Array.from({ length: casesAvant + joursDansMois }, (_, index) =>
			index < casesAvant ? null : index - casesAvant + 1
		);
		while (cases.length % 7 !== 0) cases.push(null);
		return cases;
	});

	function dateIso(jour: number): string {
		return `${data.mois}-${String(jour).padStart(2, '0')}`;
	}

	// Seule la liste complète entre dans l'index, à l'adresse nue. Les vues
	// filtrées et les mois du calendrier portent `noindex, follow` : il y en a
	// autant que de combinaisons, et ils ne contiennent rien qui ne soit déjà
	// sur les fiches. Le `follow` garde les rendez-vous atteignables.
	const indexable = $derived(data.vue === 'liste' && !data.type);
	const suffixe = $derived(data.vue === 'calendrier' ? ` - ${titreMois(data.mois)}` : '');
</script>

<Metadonnees
	titre="Agenda{suffixe} - {data.settings.siteName}"
	description={CHAPO_RUBRIQUE.actualites}
	canonique={lien({})}
	{indexable}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Agenda', chemin: '/agenda' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] uppercase {COULEUR_KIND.actu}">{SURLIGNE_RUBRIQUE.actualites}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{TITRE_RUBRIQUE.actualites}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{CHAPO_RUBRIQUE.actualites}</p>
</header>

<!-- Les commandes tiennent sur une ligne : le filtre par type à gauche, le
     choix de la vue à droite. Ce sont des liens, pas des boutons : sans
     JavaScript tout fonctionne, et une vue filtrée se partage. -->
<nav class="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Affichage de l’agenda">
	<ul class="flex flex-wrap gap-2">
		{#each filtres as filtre (filtre.libelle)}
			{@const actif = data.type === filtre.valeur}
			<li>
				<a
					href={lien({ type: filtre.valeur })}
					aria-current={actif ? 'page' : undefined}
					class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors
						{actif ? 'border-brand bg-brand text-sur-brand' : 'border-line-forte bg-carte text-ink-soft hover:text-ink'}"
				>
					{#if filtre.valeur && !actif}<span class="agenda-{filtre.valeur} size-2 rounded-full bg-current" aria-hidden="true"></span>{/if}
					{filtre.libelle}
				</a>
			</li>
		{/each}
	</ul>
	<div class="inline-flex rounded-full border border-line-forte bg-carte p-0.5 text-sm font-semibold">
		{#each [{ vue: 'liste', libelle: 'Liste' }, { vue: 'calendrier', libelle: 'Calendrier' }] as const as choix (choix.vue)}
			<a
				href={lien({ vue: choix.vue })}
				aria-current={data.vue === choix.vue ? 'page' : undefined}
				class="rounded-full px-3 py-1 {data.vue === choix.vue ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:text-ink'}"
				>{choix.libelle}</a
			>
		{/each}
	</div>
</nav>

{#if data.vue === 'liste'}
	{#if parMois.length}
		{#each parMois as groupe (groupe.mois)}
			<section class="mt-8" aria-labelledby="mois-{groupe.mois}">
				<h2 id="mois-{groupe.mois}" class="text-sm font-bold tracking-wide text-ink-faint uppercase">
					{titreMois(groupe.mois)}
				</h2>
				<ol class="mt-3 space-y-3">
					{#each groupe.rendezVous as rdv (rdv.id)}
						{@const date = dateDe(rdv.eventAt!)}
						{@const h = heure(rdv)}
						{@const l = lieu(rdv)}
						<li>
							<!-- La date en grand à gauche, comme sur un agenda papier : c'est
							     elle qu'on cherche en premier. Le liseré porte la couleur du
							     type, la même que dans le calendrier et sur l'accueil. -->
							<a
								href={lienPublication(rdv.kind, rdv.slug)}
								class="agenda-{rdv.eventCategory} group flex items-stretch gap-4 rounded-xl border border-line border-l-4 border-l-current bg-carte p-3 transition hover:border-current sm:p-4"
							>
								<span class="flex w-12 shrink-0 flex-col items-center justify-center text-center sm:w-14">
									<span class="text-xs font-bold uppercase">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
									<span class="text-2xl leading-none font-extrabold text-ink sm:text-3xl">{date.getDate()}</span>
									<span class="text-xs text-ink-faint">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
								</span>
								<span class="min-w-0 flex-1 self-center">
									<span class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
										{#if rdv.eventAt === data.aujourdhui || rdv.eventAt === demain}
											<span class="rounded bg-accent-soft px-1.5 py-0.5 font-bold text-accent-dark">
												{rdv.eventAt === data.aujourdhui ? 'Aujourd’hui' : 'Demain'}
											</span>
										{/if}
										<span class="font-bold">{LIBELLE_EVENEMENT[rdv.eventCategory]}</span>
										{#if h}<span class="text-ink-soft">{h}</span>{/if}
										{#if l}<span class="truncate text-ink-soft">· {l}</span>{/if}
									</span>
									<span class="mt-1 block leading-snug font-bold text-ink group-hover:underline sm:text-lg">{rdv.title}</span>
									{#if rdv.summary}
										<span class="mt-0.5 line-clamp-1 hidden text-sm text-ink-soft sm:block">{rdv.summary}</span>
									{/if}
								</span>
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/each}
		{#if data.reste}
			<p class="mt-5 text-sm text-ink-soft">
				Et {data.reste} autre{data.reste > 1 ? 's' : ''} plus tard :
				<a class="font-semibold text-brand hover:underline" href={lien({ vue: 'calendrier' })}>voir le calendrier</a>.
			</p>
		{/if}
	{:else}
		<p class="carte mt-8 text-ink-soft">
			Aucun rendez-vous {data.type ? 'de ce type ' : ''}annoncé pour le moment.
			{#if data.type}<a class="font-semibold text-brand hover:underline" href={lien({ type: null })}>Voir tout l’agenda</a>{/if}
		</p>
	{/if}
	{#if data.type === 'apero'}
		<!-- Les apéros ont leur page : le prochain thème, et l'archive des
		     précédents avec leur résumé. -->
		<p class="mt-5 text-sm">
			<a class="font-semibold text-pourpre hover:underline" href="/aperos">Les thèmes passés et leurs résumés sont sur la page des apéros →</a>
		</p>
	{/if}
	<p class="mt-5 text-sm">
		<a class="font-semibold text-brand hover:underline" href={lien({ vue: 'calendrier', mois: data.aujourdhui.slice(0, 7) })}
			>Retrouver un rendez-vous passé dans le calendrier →</a
		>
	</p>
{:else}
	<section class="mt-8" aria-labelledby="mois-courant">
		<div class="flex items-center justify-between gap-3">
			<a class="bouton-secondaire" href={lien({ mois: data.moisPrecedent })} aria-label="Mois précédent">←</a>
			<h2 id="mois-courant" class="text-center text-xl font-extrabold text-ink capitalize sm:text-2xl">
				{titreMois(data.mois)}
			</h2>
			<a class="bouton-secondaire" href={lien({ mois: data.moisSuivant })} aria-label="Mois suivant">→</a>
		</div>

		<div class="agenda-calendrier mt-5" role="grid" aria-labelledby="mois-courant">
			{#each ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as nom (nom)}
				<div class="agenda-entete" role="columnheader">{nom}</div>
			{/each}
			{#each grille as jour, index (index)}
				{#if jour === null}
					<div class="agenda-jour agenda-jour-vide" aria-hidden="true"></div>
				{:else}
					{@const date = dateIso(jour)}
					<div
						class="agenda-jour"
						class:agenda-aujourdhui={date === data.aujourdhui}
						class:agenda-passe={date < data.aujourdhui}
						role="gridcell"
					>
						<span class="agenda-numero">{jour}</span>
						{#each data.rendezVous.filter((e) => e.eventAt === date) as rdv (rdv.id)}
							<a href={lienPublication(rdv.kind, rdv.slug)} class="agenda-evenement agenda-{rdv.eventCategory}" title={rdv.title}
								>{rdv.title}</a
							>
						{/each}
					</div>
				{/if}
			{/each}
		</div>

		{#if data.rendezVous.length === 0}
			<p class="carte mt-5 text-center text-ink-soft">Aucun rendez-vous {data.type ? 'de ce type ' : ''}ce mois-ci.</p>
		{/if}
	</section>
{/if}

<!-- En bas, comme sur l'accueil : on propose l'application à quelqu'un qui a
     vu les rendez-vous, pas à quelqu'un qui arrive et les cherche encore. -->
{#if data.app.actif}
	<div class="mt-8">
		<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} compact />
	</div>
{/if}

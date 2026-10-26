<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { PublicationVue } from '$lib/types';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import CartePublication from '$lib/components/CartePublication.svelte';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { COULEUR_KIND, lienPublication } from '$lib/format';
	import { CHAPO_RUBRIQUE, SURLIGNE_RUBRIQUE, TITRE_RUBRIQUE } from '$lib/rubriques';

	let { data }: { data: PageData } = $props();

	type Categorie = PublicationVue['eventCategory'];
	const categories: { valeur: Categorie; libelle: string; classe: string }[] = [
		{ valeur: 'reunion', libelle: 'Événements', classe: 'agenda-reunion' },
		{ valeur: 'apero', libelle: 'Apéros', classe: 'agenda-apero' },
		{ valeur: 'formation', libelle: 'Formations', classe: 'agenda-formation' }
	];

	let visibles = $state(new Set<Categorie>(categories.map((c) => c.valeur)));
	const evenementsVisibles = $derived(data.evenements.filter((e) => visibles.has(e.eventCategory)));

	// Le calendrier commence le lundi. Les cases nulles complètent la première
	// et la dernière semaine afin de toujours conserver une grille de sept jours.
	const calendrier = $derived.by(() => {
		const [annee, numeroMois] = data.mois.split('-').map(Number);
		const premierJour = new Date(annee, numeroMois - 1, 1);
		const joursDansMois = new Date(annee, numeroMois, 0).getDate();
		const casesAvant = (premierJour.getDay() + 6) % 7;
		const cases: (number | null)[] = Array.from(
			{ length: casesAvant + joursDansMois },
			(_, index) => (index < casesAvant ? null : index - casesAvant + 1)
		);
		while (cases.length % 7 !== 0) cases.push(null);
		return {
			cases,
			titre: premierJour.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
		};
	});
	const aujourdHui = new Date();
	// Construction locale volontaire : une date seule ne doit jamais basculer
	// sur la veille à cause d'une conversion en UTC.
	const aujourdHuiIso = `${aujourdHui.getFullYear()}-${String(aujourdHui.getMonth() + 1).padStart(2, '0')}-${String(aujourdHui.getDate()).padStart(2, '0')}`;

	function dateIso(jour: number): string {
		return `${data.mois}-${String(jour).padStart(2, '0')}`;
	}

	function evenementsDuJour(jour: number) {
		const date = dateIso(jour);
		return data.evenements.filter((e) => e.eventAt === date && visibles.has(e.eventCategory));
	}

	function basculer(categorie: Categorie) {
		// Une nouvelle instance est nécessaire pour que Svelte détecte le changement.
		const suivants = new Set(visibles);
		if (suivants.has(categorie)) suivants.delete(categorie);
		else suivants.add(categorie);
		visibles = suivants;
	}

	function toutAfficher() {
		visibles = new Set(categories.map((c) => c.valeur));
	}

	function nombreEvenements(categorie: Categorie): number {
		return data.evenements.filter((e) => e.eventCategory === categorie).length;
	}

	function classeCategorie(categorie: Categorie): string {
		return categories.find((c) => c.valeur === categorie)?.classe ?? 'agenda-autre';
	}

	// Le mois courant est l'agenda : c'est lui qui entre dans l'index, à
	// l'adresse nue. Les autres mois portent `noindex, follow` - il y en a une
	// infinité, le bouton « Suivant » menant toujours au suivant, et ils ne
	// contiennent rien qui ne soit déjà sur les fiches des rendez-vous. Le
	// `follow` reste indispensable : sans lui, les rendez-vous eux-mêmes
	// cesseraient d'être atteints depuis cette page.
	const moisCourant = $derived(data.mois === aujourdHuiIso.slice(0, 7));
	const chemin = $derived(moisCourant ? '/agenda' : `/agenda?mois=${data.mois}`);
	const suffixe = $derived(moisCourant ? '' : ` - ${calendrier.titre}`);
</script>

<Metadonnees
	titre="Agenda{suffixe} - {data.settings.siteName}"
	description={CHAPO_RUBRIQUE.actualites}
	canonique={chemin}
	indexable={moisCourant}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Agenda', chemin: '/agenda' }
	])}
/>

<!-- Le filet passe sous le bandeau Action populaire quand il est affiché, et
     sous l'en-tête sinon : jamais un trait au-dessus d'une surface colorée. -->
<header class={data.app.actif ? '' : 'border-b border-line pb-4'}>
	<p class="text-xs font-bold tracking-[0.2em] uppercase {COULEUR_KIND.actu}">{SURLIGNE_RUBRIQUE.actualites}</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">{TITRE_RUBRIQUE.actualites}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{CHAPO_RUBRIQUE.actualites}</p>
	<!-- Les apéros n'ont plus d'entrée dans l'en-tête : leur page (le prochain
	     thème, l'archive des précédents) s'atteint d'ici et du pied de page. -->
	<p class="mt-3 text-sm">
		<a class="font-semibold text-pourpre hover:underline" href="/aperos">Les apéros thématiques, un lundi sur deux →</a>
	</p>
</header>

{#if data.app.actif}
	<!-- C'est ici que le visiteur cherche où venir : le bon moment pour lui
	     proposer l'application qui le prévient des prochains rendez-vous. -->
	<div class="border-b border-line pb-5">
		<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} compact />
	</div>
{/if}

{#if moisCourant}
	<section class="mt-8" aria-labelledby="titre-a-venir">
		<h2 id="titre-a-venir" class="text-xl font-extrabold text-ink">À venir</h2>
		{#if data.aVenir.length}
			<div class="mt-5 space-y-5">
				{#each data.aVenir as rdv (rdv.id)}
					<CartePublication publication={rdv} />
				{/each}
			</div>
		{:else}
			<p class="mt-5 text-ink-soft">Aucun rendez-vous annoncé pour le moment.</p>
		{/if}
	</section>
{/if}

<section class="mt-8" aria-labelledby="mois-courant">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
		<a class="bouton-secondaire" href="?mois={data.moisPrecedent}" aria-label="Mois précédent">← Précédent</a>
		<!-- Sur téléphone, le mois passe au-dessus et les deux boutons dessous : sinon
		     « Suivant » tombait seul sur une seconde ligne. -->
		<h2
			id="mois-courant"
			class="order-first basis-full text-center text-2xl font-extrabold text-ink capitalize sm:order-none sm:basis-auto"
		>
			{calendrier.titre}
		</h2>
		<a class="bouton-secondaire" href="?mois={data.moisSuivant}" aria-label="Mois suivant">Suivant →</a>
	</div>

	<div class="mt-4 rounded-xl border border-line bg-surface-alt p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h3 class="text-sm font-extrabold text-ink">Filtrer ce mois</h3>
				<p class="mt-0.5 text-xs text-ink-soft">
					{evenementsVisibles.length} rendez-vous affiché{evenementsVisibles.length > 1 ? 's' : ''}
				</p>
			</div>
			{#if visibles.size < categories.length}
				<button type="button" class="text-sm font-semibold text-brand hover:underline" onclick={toutAfficher}>
					Tout afficher
				</button>
			{/if}
		</div>

		<div class="mt-3 flex flex-wrap gap-2" aria-label="Filtrer les événements">
			{#each categories as categorie (categorie.valeur)}
				<button
					type="button"
					aria-pressed={visibles.has(categorie.valeur)}
					onclick={() => basculer(categorie.valeur)}
					class="agenda-filtre {categorie.classe} {visibles.has(categorie.valeur) ? '' : 'agenda-filtre-inactif'}"
				>
					<span aria-hidden="true"></span>{categorie.libelle}
					<strong aria-label="{nombreEvenements(categorie.valeur)} rendez-vous">{nombreEvenements(categorie.valeur)}</strong>
				</button>
			{/each}
		</div>
	</div>

	<div class="agenda-calendrier mt-5" role="grid" aria-labelledby="mois-courant">
		{#each ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as nom}
			<div class="agenda-entete" role="columnheader">{nom}</div>
		{/each}
		{#each calendrier.cases as jour, index (index)}
			{#if jour === null}
				<div class="agenda-jour agenda-jour-vide" aria-hidden="true"></div>
			{:else}
				{@const evenements = evenementsDuJour(jour)}
				<div class="agenda-jour" class:agenda-aujourdhui={dateIso(jour) === aujourdHuiIso} role="gridcell">
					<span class="agenda-numero">{jour}</span>
					{#each evenements as evenement (evenement.id)}
						<a
							href={lienPublication(evenement.kind, evenement.slug)}
							class="agenda-evenement {classeCategorie(evenement.eventCategory)}"
							title={evenement.title}
						>{evenement.title}</a>
					{/each}
				</div>
			{/if}
		{/each}
	</div>

	{#if data.evenements.length === 0}
		<p class="carte mt-6 text-center text-ink-soft">Aucun rendez-vous annoncé pour ce mois.</p>
	{:else if evenementsVisibles.length === 0}
		<p class="carte mt-6 text-center text-ink-soft">
			Aucun rendez-vous ne correspond aux catégories choisies.
			<button type="button" class="ml-1 font-semibold text-brand hover:underline" onclick={toutAfficher}>Tout afficher</button>
		</p>
	{/if}
</section>

<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { PublicationVue } from '$lib/types';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import { lienPublication } from '$lib/format';

	let { data }: { data: PageData } = $props();

	type Categorie = PublicationVue['eventCategory'];
	const categories: { valeur: Categorie; libelle: string; classe: string }[] = [
		{ valeur: 'reunion', libelle: 'Événements', classe: 'agenda-reunion' },
		{ valeur: 'apero', libelle: 'Apéros', classe: 'agenda-apero' },
		{ valeur: 'formation', libelle: 'Formations', classe: 'agenda-formation' },
		{ valeur: 'autre', libelle: 'Autres', classe: 'agenda-autre' }
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
	// l'adresse nue. Les autres mois portent `noindex, follow` — il y en a une
	// infinité, le bouton « Suivant » menant toujours au suivant, et ils ne
	// contiennent rien qui ne soit déjà listé dans /actualites et /aperos. Le
	// `follow` reste indispensable : sans lui, les rendez-vous eux-mêmes
	// cesseraient d'être atteints depuis cette page.
	const moisCourant = $derived(data.mois === aujourdHuiIso.slice(0, 7));
	const chemin = $derived(moisCourant ? '/agenda' : `/agenda?mois=${data.mois}`);
	const suffixe = $derived(moisCourant ? '' : ` — ${calendrier.titre}`);
</script>

<Metadonnees
	titre="Agenda{suffixe} — {data.settings.siteName}"
	description="Le calendrier des actions, événements, apéros et formations du groupe d'action."
	canonique={chemin}
	indexable={moisCourant}
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Agenda', chemin: '/agenda' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-sm font-bold tracking-wide text-brand uppercase">Nos rendez-vous</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink sm:text-5xl">Agenda</h1>
	<p class="mt-4 max-w-2xl text-lg text-ink-soft">Consultez les rendez-vous du groupe, mois par mois.</p>
</header>

<section class="mt-8" aria-labelledby="mois-courant">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
		<a class="bouton-secondaire" href="?mois={data.moisPrecedent}" aria-label="Mois précédent">← Précédent</a>
		<h2 id="mois-courant" class="text-center text-2xl font-extrabold text-ink capitalize">{calendrier.titre}</h2>
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

<script lang="ts">
	import type { PageData } from './$types';
	import type { PublicationVue } from '$lib/types';
	import { lienPublication } from '$lib/format';

	let { data }: { data: PageData } = $props();

	type Categorie = PublicationVue['eventCategory'];
	const categories: { valeur: Categorie; libelle: string; classe: string }[] = [
		{ valeur: 'action', libelle: 'Actions', classe: 'agenda-action' },
		{ valeur: 'reunion', libelle: 'Réunions', classe: 'agenda-reunion' },
		{ valeur: 'apero', libelle: 'Apéros', classe: 'agenda-apero' },
		{ valeur: 'formation', libelle: 'Formations', classe: 'agenda-formation' },
		{ valeur: 'autre', libelle: 'Autres', classe: 'agenda-autre' }
	];

	let visibles = $state(new Set<Categorie>(categories.map((c) => c.valeur)));

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

	function classeCategorie(categorie: Categorie): string {
		return categories.find((c) => c.valeur === categorie)?.classe ?? 'agenda-autre';
	}
</script>

<svelte:head>
	<title>Agenda</title>
	<meta name="description" content="Le calendrier des actions, réunions, apéros et formations du groupe." />
</svelte:head>

<header class="max-w-2xl">
	<p class="text-sm font-bold tracking-wide text-brand uppercase">Nos rendez-vous</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink sm:text-5xl">Agenda</h1>
	<p class="mt-4 text-lg text-ink-soft">Consultez les rendez-vous du groupe, mois par mois.</p>
</header>

<section class="mt-8" aria-labelledby="mois-courant">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
		<a class="bouton-secondaire" href="?mois={data.moisPrecedent}" aria-label="Mois précédent">← Précédent</a>
		<h2 id="mois-courant" class="text-center text-2xl font-extrabold text-ink capitalize">{calendrier.titre}</h2>
		<a class="bouton-secondaire" href="?mois={data.moisSuivant}" aria-label="Mois suivant">Suivant →</a>
	</div>

	<div class="mt-4 flex flex-wrap gap-2" aria-label="Filtrer les événements">
		{#each categories as categorie (categorie.valeur)}
			<button
				type="button"
				aria-pressed={visibles.has(categorie.valeur)}
				onclick={() => basculer(categorie.valeur)}
				class="agenda-filtre {categorie.classe} {visibles.has(categorie.valeur) ? '' : 'agenda-filtre-inactif'}"
			>
				<span aria-hidden="true"></span>{categorie.libelle}
			</button>
		{/each}
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
	{/if}
</section>

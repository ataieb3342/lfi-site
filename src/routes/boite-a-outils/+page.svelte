<script lang="ts">
	import { page } from '$app/state';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import type { PageData } from './$types';
	import { outilsEnAvant, rubriquesGarnies, urlOutil } from '$lib/boite-a-outils';

	let { data }: { data: PageData } = $props();

	const enAvant = outilsEnAvant();
	const rubriques = rubriquesGarnies();
</script>

<Metadonnees
	titre="Boîte à outils — {data.settings.siteName}"
	description="Des outils interactifs pour comprendre l’économie française à partir des chiffres officiels : impôts, budget de l’État, patrimoine, budget des ménages."
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Boîte à outils', chemin: '/boite-a-outils' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">Comprendre et argumenter</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Boîte à outils</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Entrez votre salaire, votre loyer ou votre patrimoine : ces outils vous montrent ce que les
		chiffres officiels disent de votre situation, et de celle du pays. Chacun affiche ses sources
		et dit ce que son calcul ne prend pas en compte. Rien de ce que vous saisissez ne quitte votre
		navigateur : ni envoi, ni enregistrement, ni mesure d’audience.
	</p>
</header>

<!--
	Les outils sont des pages à part entière (voir src/lib/boite-a-outils.ts) :
	chacune s'ouvre en plein écran avec sa propre CSP, et son pied de page ramène
	ici.

	Les descriptions tiennent sur une ligne et les cartes n'ont pas de bouton :
	le lien du titre est étendu à toute la carte par son ::after. Sur une page
	qui en comptera vingt, un bouton par carte deviendrait un mur.
-->

<!-- Deux outils en tête, avec une accroche plus longue. Onze cartes égales ne
     disent pas par où entrer. Ce sont des cartes comme les autres, un peu plus
     grandes et bordées de la couleur du site : un encart plein de couleur
     serait lu comme une publicité et sauté. -->
<h2 class="mt-6 text-xs font-bold tracking-[0.15em] text-ink-faint uppercase">Pour commencer</h2>
<ul class="mt-3 grid gap-4 sm:grid-cols-2">
	{#each enAvant as outil (outil.dossier)}
		<li class="carte relative border-brand/40 transition hover:border-brand">
			<h3 class="text-xl font-extrabold text-ink">
				<a class="after:absolute after:inset-0" href={urlOutil(outil)} data-sveltekit-reload>
					{outil.titre}
				</a>
			</h3>
			<p class="mt-2 text-sm leading-relaxed text-ink-soft">{outil.accroche}</p>
		</li>
	{/each}
</ul>

{#each rubriques as { rubrique, modules } (rubrique.id)}
	<section class="mt-8" aria-labelledby="rubrique-{rubrique.id}">
		<h2
			id="rubrique-{rubrique.id}"
			class="text-xs font-bold tracking-[0.15em] text-ink-faint uppercase"
		>
			{rubrique.titre}
		</h2>
		<p class="mt-1 max-w-2xl text-sm text-ink-soft">{rubrique.description}</p>

		<ul class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each modules as outil (outil.dossier)}
				<li class="carte relative transition hover:border-brand">
					<h3 class="text-lg font-extrabold text-ink">
						<a class="after:absolute after:inset-0" href={urlOutil(outil)} data-sveltekit-reload>
							{outil.titre}
						</a>
					</h3>
					<p class="mt-1 text-sm text-ink-soft">{outil.description}</p>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<section class="mt-8 border-t border-line pt-6">
	<p class="text-sm text-ink-soft">
		Les lectures et documents partagés autour de nos apéros sont dans la
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">bibliothèque</a>, et
		quelques <a class="font-semibold text-brand hover:underline" href="/jeux">jeux</a> faits maison
		les accompagnent.
	</p>
</section>

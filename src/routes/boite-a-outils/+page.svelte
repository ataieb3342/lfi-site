<script lang="ts">
	import type { PageData } from './$types';
	import { rubriquesGarnies, urlOutil } from '$lib/boite-a-outils';

	let { data }: { data: PageData } = $props();

	const rubriques = rubriquesGarnies();
</script>

<svelte:head>
	<title>Boîte à outils — {data.settings.siteName}</title>
	<meta
		name="description"
		content="Des outils interactifs pour comprendre l’économie française à partir des chiffres officiels : impôts, budget de l’État, patrimoine, budget des ménages."
	/>
</svelte:head>

<header class="border-b border-line pb-6">
	<p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">Comprendre et argumenter</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink">Boîte à outils</h1>
	<p class="mt-4 max-w-2xl text-lg text-ink-soft">
		Entrez votre salaire, votre loyer ou votre patrimoine : ces outils vous montrent ce que les
		chiffres officiels disent de votre situation, et de celle du pays.
	</p>
	<p class="mt-3 max-w-2xl text-ink-soft">
		Chacun affiche ses sources et dit ce que son calcul ne prend pas en compte. Rien de ce que
		vous saisissez ne quitte votre navigateur : ni envoi, ni enregistrement, ni mesure d’audience.
	</p>
</header>

<!--
	Les outils sont des pages à part entière (voir src/lib/boite-a-outils.ts) :
	chacune s'ouvre en plein écran avec sa propre CSP, et porte un lien de retour
	vers cette page.

	Les descriptions tiennent sur une ligne, et les cartes n'ont pas de bouton :
	le lien du titre est étendu à toute la carte par son ::after. Sur une page qui
	en comptera vingt, un bouton par carte deviendrait un mur.
-->
{#each rubriques as { rubrique, modules } (rubrique.id)}
	<section class="mt-10" aria-labelledby="rubrique-{rubrique.id}">
		<h2 id="rubrique-{rubrique.id}" class="text-xs font-bold tracking-[0.15em] text-ink-faint uppercase">
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

<section class="mt-14 border-t border-line pt-6">
	<p class="text-sm text-ink-soft">
		Vous cherchez plutôt un livre, une vidéo ou un document à lire ? Ils sont dans la
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">bibliothèque</a>,
		avec les sources proposées autour de nos apéros.
	</p>
</section>

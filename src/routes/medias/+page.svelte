<script lang="ts">
	import { page } from '$app/state';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import type { PageData } from './$types';
	import { mediasParFormat } from '$lib/medias';

	let { data }: { data: PageData } = $props();

	const formats = mediasParFormat();
</script>

<Metadonnees
	titre="Médias - {data.settings.siteName}"
	description="Les médias indépendants que le groupe lit et regarde, et qu’il vous recommande."
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Médias', chemin: '/medias' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Les médias qu’on recommande</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Pour s’informer ailleurs que dans les médias des milliardaires : ce que nous regardons et lisons
		nous-mêmes.
	</p>
</header>

<!-- Des cartes, comme les outils et les jeux : la carte entière est cliquable
     par le `::after` du lien. Les liens sortent du site : nouvel onglet, et
     `noopener noreferrer` pour ne pas annoncer d'où vient le visiteur. -->
{#each formats as format (format.id)}
	<section class="mt-8" aria-labelledby="format-{format.id}">
		<h2 id="format-{format.id}" class="text-xs font-bold tracking-[0.15em] text-ink-faint uppercase">
			{format.titre}
		</h2>
		<ul class="mt-5 grid gap-4 sm:grid-cols-2">
			{#each format.medias as media (media.nom)}
				<li class="carte relative transition hover:border-brand">
					<h3 class="text-lg font-extrabold text-ink">
						<a class="after:absolute after:inset-0" href={media.lien} target="_blank" rel="noopener noreferrer">
							{media.nom}
						</a>
					</h3>
					<p class="mt-1 text-sm text-ink-soft">{media.description}</p>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<section class="mt-8 border-t border-line pt-6">
	<p class="text-sm text-ink-soft">
		Les lectures et documents partagés autour de nos apéros sont dans la
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">bibliothèque</a>, et
		ce que nous avons retenu de l’actualité dans la
		<a class="font-semibold text-brand hover:underline" href="/revue-de-presse">revue de presse</a>.
	</p>
</section>

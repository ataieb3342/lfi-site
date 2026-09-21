<script lang="ts">
	import { page } from '$app/state';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import type { PageData } from './$types';
	import { JEUX, urlJeu } from '$lib/jeux';
	import Encart from '$lib/components/Encart.svelte';

	let { data }: { data: PageData } = $props();
</script>

<Metadonnees
	titre="Jeux — {data.settings.siteName}"
	description="Des jeux faits par des militants, sans publicité et sans traçage."
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Jeux', chemin: '/jeux' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Jeux</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Faits par des militants, sans publicité et sans traçage. Chacun s’ouvre en plein écran et
		fonctionne dans le navigateur, sans rien installer.
	</p>
</header>

<!-- Les jeux sont des pages à part entière (voir src/lib/jeux.ts) : chacun
     s'ouvre en plein écran, avec un lien de retour vers cette page. Comme les
     outils, la carte entière est cliquable : pas de bouton répété. -->
<ul class="mt-6 grid gap-4 sm:grid-cols-2">
	{#each JEUX as jeu (jeu.dossier)}
		<li class="carte relative transition hover:border-brand">
			<h2 class="text-lg font-extrabold text-ink">
				<a class="after:absolute after:inset-0" href={urlJeu(jeu)} data-sveltekit-reload>
					{jeu.titre}
				</a>
			</h2>
			<p class="mt-1 text-sm text-ink-soft">{jeu.description}</p>
		</li>
	{/each}
</ul>

<!-- Le seul encart du site placé après le contenu et non en tête : ce n'est pas
     une invitation vers une autre page, c'est un remerciement, et il n'a de sens
     qu'une fois qu'on a vu ce qu'on remercie. Pas de `href` non plus — rien à
     cliquer, juste à lire. -->
<Encart
	sureligne="Les crédits"
	titre="Merci à Dorian, le GOAT"
	texte="Les jeux de cette page sont les siens, écrits à la main et sans rien demander à personne. On lui avait parlé d’un tract ; il a rendu un flipper. On ne regrette rien."
	surface="fond-apero"
/>

<section class="mt-8 border-t border-line pt-6">
	<p class="text-sm text-ink-soft">
		Les lectures et documents partagés autour de nos apéros sont dans la
		<a class="font-semibold text-brand hover:underline" href="/bibliotheque">bibliothèque</a>, et
		les outils pour comprendre les chiffres dans la
		<a class="font-semibold text-brand hover:underline" href="/boite-a-outils">boîte à outils</a>.
	</p>
</section>

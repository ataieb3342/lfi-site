<script lang="ts">
	import type { PageData } from './$types';
	import { formatTailleFichier } from '$lib/format';
	import { JEUX, urlJeu } from '$lib/jeux';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Bibliothèque — {data.settings.siteName}</title>
	<meta name="description" content="Les liens et documents PDF partagés autour des apéros thématiques, et quelques jeux." />
</svelte:head>

<header class="max-w-2xl">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink">Bibliothèque</h1>
	<p class="mt-4 text-lg text-ink-soft">
		Les liens et PDF proposés autour de nos apéros, relus par l’équipe avant publication. Et,
		pour souffler un peu, quelques jeux faits maison.
	</p>
</header>

<h2 class="mt-10 text-2xl font-extrabold text-ink">Ressources</h2>

{#if data.sources.length}
	<ul class="mt-5 grid gap-5 sm:grid-cols-2">
		{#each data.sources as source (source.id)}
			<li class="carte flex flex-col">
				<h3 class="text-lg font-extrabold text-ink">{source.title}</h3>
				{#if source.note}<p class="mt-2 text-sm text-ink-soft">{source.note}</p>{/if}
				{#if source.pdf && source.droitsDiffusion}
					<p class="mt-2 text-xs text-ink-faint">
						<strong>Droits de diffusion :</strong> {source.droitsDiffusion}
					</p>
				{/if}
				<p class="mt-3 text-xs text-ink-faint">
					Apéro : <a class="font-semibold text-brand hover:underline" href={source.apero.url}>{source.apero.titre}</a>
					{#if source.authorName} · proposé par {source.authorName}{/if}
				</p>
				<div class="mt-auto pt-5">
					{#if source.pdf}
						<a class="bouton inline-block" href={source.pdf.url}>Télécharger le PDF ({formatTailleFichier(source.pdf.octets)})</a>
					{:else if source.url}
						<a class="bouton inline-block" href={source.url} target="_blank" rel="noopener noreferrer nofollow">
							Consulter sur {source.site}
						</a>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-5 text-ink-soft">
		Aucune ressource pour le moment. Les premières peuvent être proposées depuis la fiche d’un
		apéro.
	</p>
{/if}

<!-- Les jeux sont des pages à part entière (voir src/lib/jeux.ts) : chacun
     s'ouvre en plein écran, avec un lien de retour vers la bibliothèque. -->
<section class="mt-14" aria-labelledby="jeux-titre">
	<h2 id="jeux-titre" class="text-2xl font-extrabold text-ink">Jeux</h2>
	<p class="mt-2 text-ink-soft">Faits par des militants, sans publicité et sans traçage.</p>
	<ul class="mt-5 grid gap-5 sm:grid-cols-2">
		{#each JEUX as jeu (jeu.dossier)}
			<li class="carte flex flex-col">
				<h3 class="text-lg font-extrabold text-ink">{jeu.titre}</h3>
				<p class="mt-2 text-sm text-ink-soft">{jeu.description}</p>
				<div class="mt-auto pt-5">
					<a class="bouton inline-block" href={urlJeu(jeu)} data-sveltekit-reload>Jouer</a>
				</div>
			</li>
		{/each}
	</ul>
</section>

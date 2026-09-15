<script lang="ts">
	import type { PageData } from './$types';
	import { formatTailleFichier } from '$lib/format';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Bibliothèque — {data.settings.siteName}</title>
	<meta name="description" content="Les liens et documents PDF partagés autour des apéros thématiques." />
</svelte:head>

<header class="max-w-2xl">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink">Bibliothèque</h1>
	<p class="mt-4 text-lg text-ink-soft">
		Les liens et PDF proposés autour de nos apéros, puis relus par l’équipe avant publication.
	</p>
</header>

{#if data.sources.length}
	<ul class="mt-10 grid gap-5 sm:grid-cols-2">
		{#each data.sources as source (source.id)}
			<li class="carte flex flex-col">
				<h2 class="text-lg font-extrabold text-ink">{source.title}</h2>
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
	<p class="carte mt-10 text-ink-soft">
		La bibliothèque est encore vide. Les premières ressources peuvent être proposées depuis la
		fiche d’un apéro.
	</p>
{/if}

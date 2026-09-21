<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const fonds = ['#f7d8a7', '#d9cff7', '#bfe6d5', '#f3c8d5', '#cce2f5'];
</script>

<svelte:head>
	<title>Qui sommes-nous ? — {data.settings.siteName}</title>
	<meta
		name="description"
		content="Qui nous sommes, comment fonctionne un groupe d'action de La France insoumise, et où nous trouver dans le centre de Dijon."
	/>
</svelte:head>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">Dijon Centre</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Qui sommes-nous ?</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Un groupe d’habitantes et d’habitants qui agit dans le centre de Dijon.
	</p>
</header>

<section class="mt-7" aria-labelledby="equipe-groupe">
	<div class="mb-4">
		<p class="text-xs font-bold tracking-[0.18em] text-brand uppercase">Les membres du groupe</p>
		<h2 id="equipe-groupe" class="mt-2 text-2xl font-extrabold tracking-tight text-ink">Une équipe, plusieurs casquettes</h2>
		<p class="mt-2 max-w-2xl text-ink-soft">Les personnes qui font vivre le collectif.</p>
	</div>

	{#if data.profils.length}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.profils as membre, index (membre.name)}
			<article class="rounded-2xl border border-line bg-carte p-4">
				{#if membre.image}
					<img src={membre.image} alt="Portrait de {membre.name}" class="aspect-square w-full rounded-xl object-cover" />
				{:else}
					<div class="grid aspect-square w-full place-items-center rounded-xl text-6xl" style="background-color: {fonds[index % fonds.length]};" role="img" aria-label="Emoji de {membre.name}">{membre.emoji || '👤'}</div>
				{/if}
				<h3 class="mt-4 text-lg font-extrabold text-ink">{membre.name} {membre.emoji}</h3>
				<p class="mt-1 text-sm font-semibold text-brand">{membre.role}</p>
				{#if membre.bio}<p class="mt-3 text-sm leading-relaxed text-ink-soft">{membre.bio}</p>{/if}
			</article>
		{/each}
	</div>
	{:else}
		<p class="rounded-xl border border-dashed border-line-forte p-5 text-sm text-ink-soft">
			Les membres du groupe pourront bientôt se présenter ici.
		</p>
	{/if}
</section>

<section class="mt-8 border-t border-line pt-6" aria-labelledby="fonctionnement-groupe">
	<h2 id="fonctionnement-groupe" class="text-2xl font-extrabold tracking-tight text-ink">Comment on fonctionne</h2>
	<div class="mt-4 grid gap-3 sm:grid-cols-3">
		<div class="rounded-xl bg-surface-alt p-4">
			<p class="font-bold text-ink">On décide ensemble</p>
			<p class="mt-1 text-sm text-ink-soft">Les choix se discutent collectivement.</p>
		</div>
		<div class="rounded-xl bg-surface-alt p-4">
			<p class="font-bold text-ink">On agit localement</p>
			<p class="mt-1 text-sm text-ink-soft">Tractages, porte-à-porte, réunions et mobilisations.</p>
		</div>
		<div class="rounded-xl bg-surface-alt p-4">
			<p class="font-bold text-ink">Tout le monde peut venir</p>
			<p class="mt-1 text-sm text-ink-soft">Aucune expérience militante n’est nécessaire.</p>
		</div>
	</div>
</section>

<section class="mt-6 flex flex-col gap-3 rounded-2xl bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between">
	<div>
		<h2 class="text-xl font-extrabold text-ink">Envie de nous rencontrer ?</h2>
		<p class="mt-1 text-sm text-ink-soft">Consultez les prochaines dates ou venez discuter avec nous.</p>
	</div>
	<div class="flex shrink-0 flex-wrap gap-2">
		<a class="bouton-secondaire" href="/agenda">Voir l’agenda</a>
		<a class="bouton" href="/nous-rejoindre">Nous rejoindre</a>
	</div>
</section>

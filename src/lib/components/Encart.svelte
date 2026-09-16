<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Encart d'appel : le gabarit unique des invitations posées en tête ou en bas
	 * d'une page — la boîte à outils depuis la bibliothèque, la bibliothèque
	 * depuis les apéros, la revue de presse depuis les articles, Action populaire
	 * depuis les actualités.
	 *
	 * Ils avaient chacun leur mise en page ; d'une page à l'autre, le visiteur ne
	 * reconnaissait pas qu'il s'agissait de la même chose. Le gabarit est donc
	 * ici, une fois : une surface colorée, un surlignage en petites capitales, un
	 * titre d'affiche, un paragraphe, et au choix un lien étendu à tout l'encart
	 * ou des boutons.
	 *
	 * La surface est une classe de `app.css` (`.fond-degrade`, `.fond-actu`,
	 * `.fond-apero`). Elle porte déjà son fond et sa couleur de texte : ne jamais
	 * y ajouter `.carte`, qui est déclarée après et écraserait le fond — on
	 * obtiendrait du texte blanc sur fond blanc.
	 *
	 * `style` sert au seul cas d'Action populaire, dont les couleurs sont celles
	 * de l'application et non celles du site.
	 */
	let {
		/** Petites capitales au-dessus du titre : la catégorie de l'encart. */
		sureligne,
		titre,
		texte = '',
		/** Lien étendu à toute la surface. Incompatible avec `actions`. */
		href = '',
		surface = 'fond-degrade',
		style = '',
		/** Faux quand l'encart est déjà placé par sa page : il perd sa marge haute. */
		autonome = true,
		/** Vrai quand il sert de diapositive de carrousel : il remplit la hauteur. */
		hauteurPleine = false,
		/** Petit logo affiché devant le surlignage. */
		icone,
		/** Boutons, à droite sur grand écran. */
		actions
	}: {
		sureligne: string;
		titre: string;
		texte?: string;
		href?: string;
		surface?: string;
		style?: string;
		autonome?: boolean;
		hauteurPleine?: boolean;
		icone?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<section
	class="{surface} relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10
		{autonome ? 'mt-12' : ''}
		{hauteurPleine ? 'flex h-full flex-col justify-center' : ''}"
	{style}
>
	<div class="relative grid gap-6 sm:items-center {actions ? 'sm:grid-cols-[1fr_auto]' : ''}">
		<div>
			<p class="flex items-center gap-2.5 text-xs font-bold tracking-[0.2em] uppercase opacity-80">
				{#if icone}{@render icone()}{/if}
				{sureligne}
			</p>
			<!-- En diapositive de carrousel, le titre est monté d'un cran : à côté
			     des autres diapositives, il paraissait sinon timide. -->
			<h2 class="titre-affiche mt-2 {hauteurPleine ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}">
				{#if href}
					<!-- Le lien du titre est étendu à tout l'encart par son ::after :
					     toute la surface est cliquable, sans bouton supplémentaire. -->
					<a class="underline-offset-4 after:absolute after:inset-0 hover:underline" {href}>{titre}</a>
				{:else}
					{titre}
				{/if}
			</h2>
			{#if texte}
				<p class="mt-3 max-w-xl leading-relaxed opacity-85">{texte}</p>
			{/if}
		</div>

		{#if actions}
			<!-- `relative` pour passer devant le ::after d'un éventuel lien étendu. -->
			<div class="relative flex flex-wrap gap-3">
				{@render actions()}
			</div>
		{/if}
	</div>
</section>

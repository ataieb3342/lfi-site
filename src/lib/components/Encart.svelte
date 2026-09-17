<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Encart d'appel : le gabarit unique des invitations posées en tête ou en bas
	 * d'une page — la bibliothèque depuis les apéros, la revue de presse depuis
	 * les articles, Action populaire depuis les actualités.
	 *
	 * Il annonce toujours une **autre** page. Un encart posé en tête d'une page
	 * pour vanter une section de cette même page se lit comme une publicité, et
	 * se saute : c'est ce qui arrivait à la boîte à outils, qui est aujourd'hui
	 * une section ordinaire de la bibliothèque.
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
		icone?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<section
	class="{surface} relative mt-6 overflow-hidden rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4"
	{style}
>
	<div class="relative grid gap-3 sm:items-center {actions ? 'sm:grid-cols-[1fr_auto]' : ''}">
		<div>
			<p class="flex items-center gap-2 text-[0.6875rem] font-bold tracking-[0.18em] uppercase opacity-75">
				{#if icone}{@render icone()}{/if}
				{sureligne}
			</p>
			<h2 class="titre-affiche mt-1 text-base sm:text-lg">
				{#if href}
					<!-- Le lien du titre est étendu à tout l'encart par son ::after :
					     toute la surface est cliquable, sans bouton supplémentaire. -->
					<a class="underline-offset-4 after:absolute after:inset-0 hover:underline" {href}>{titre}</a>
				{:else}
					{titre}
				{/if}
			</h2>
			<!-- Une seule phrase, en petit : l'encart doit tenir en trois lignes.
			     Un paragraphe de quatre lignes en faisait un pavé que le visiteur
			     sautait pour aller au contenu réel de la page. -->
			{#if texte}
				<p class="mt-1 max-w-2xl text-sm leading-snug opacity-85">{texte}</p>
			{/if}
		</div>

		{#if actions}
			<!-- `relative` pour passer devant le ::after d'un éventuel lien étendu. -->
			<div class="relative flex flex-wrap gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
</section>

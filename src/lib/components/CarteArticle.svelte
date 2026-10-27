<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import { formatDate, lienPublication } from '$lib/format';
	import type { PublicationVue } from '$lib/types';

	/**
	 * Un article dans une liste : la page Articles et l'accueil.
	 *
	 * - `grande` : le plus récent, en tête de la page Articles. Image et texte
	 *   côte à côte sur ordinateur.
	 * - `carte` : la grille de la page Articles et de l'accueil. Image au-dessus
	 *   sur ordinateur ; sur téléphone elle redevient une ligne, sinon quinze
	 *   images pleine largeur feraient défiler cinq écrans.
	 *
	 * **Toujours une image**, même sans couverture : le phi officiel en
	 * couleur sur une carte la remplace (`.vignette-article`, voir `app.css`).
	 * Sans image du tout, ces articles n'avaient pas la même forme que leurs
	 * voisins, et la liste avait l'air cassée.
	 *
	 * Pas d'étiquette « Article » : tout ce qui est listé ici en est un.
	 * Toute la carte est cliquable (le lien du titre est étendu par `::after`).
	 */
	let { publication, forme = 'carte' }: { publication: PublicationVue; forme?: 'grande' | 'carte' } =
		$props();

	const lien = $derived(lienPublication(publication.kind, publication.slug));

	const classeCarte = {
		grande: 'flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:items-center sm:gap-6',
		carte: 'flex gap-4 sm:flex-col sm:gap-3'
	};
	const classeImage = {
		grande: 'aspect-[16/10] w-full',
		carte: 'size-20 shrink-0 sm:aspect-[16/10] sm:size-auto sm:w-full'
	};
	const classeTitre = {
		grande: 'titre-affiche text-2xl sm:text-3xl',
		carte: 'text-base leading-snug font-bold sm:text-lg'
	};
</script>

<article class="group relative {classeCarte[forme]}">
	{#if publication.cover}
		<!-- `alt` vide : l'image illustre le titre qui suit, elle ne dit rien de plus. -->
		<img
			src={publication.cover.url}
			alt=""
			loading="lazy"
			class="{classeImage[forme]} rounded-xl bg-surface-alt object-cover"
		/>
	{:else}
		<div class="{classeImage[forme]} vignette-article grid place-items-center rounded-xl" aria-hidden="true">
			<Logo class="h-2/5 max-h-20 w-auto" />
		</div>
	{/if}

	<div class="min-w-0 flex-1">
		<p class="text-xs text-ink-faint">
			<time datetime={publication.publishedAt ?? undefined}>{formatDate(publication.publishedAt)}</time>
			{#if publication.authorName}· {publication.authorName}{/if}
			{#if publication.commentCount > 0}
				· {publication.commentCount} commentaire{publication.commentCount > 1 ? 's' : ''}
			{/if}
		</p>
		<h3 class="mt-1 text-ink {classeTitre[forme]}">
			<a href={lien} class="after:absolute after:inset-0 group-hover:text-brand group-hover:underline underline-offset-4"
				>{publication.title}</a
			>
		</h3>
		{#if publication.summary}
			<!-- Masqué sur téléphone par `max-sm:hidden` et non `hidden sm:block` :
			     `sm:block` écrasait le `display` de `line-clamp`, et le chapô
			     s'affichait en entier sur ordinateur. -->
			<p
				class="mt-1.5 whitespace-pre-line text-ink-soft
					{forme === 'grande' ? 'line-clamp-4 sm:text-lg' : 'line-clamp-2 text-sm'}
					{forme === 'carte' ? 'max-sm:hidden' : ''}"
			>
				{publication.summary}
			</p>
		{/if}
	</div>
</article>

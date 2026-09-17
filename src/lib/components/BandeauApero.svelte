<script lang="ts">
	import { formatDateLongue } from '$lib/format';
	import type { PublicationVue } from '$lib/types';

	/**
	 * Le prochain apéro, en bandeau.
	 *
	 * Il a longtemps été la première diapositive d'un carrousel de sept, haut de
	 * 425 pixels : l'accueil s'ouvrait sur un écran entier de surface colorée, et
	 * le premier article n'apparaissait qu'après. Six diapositives sur sept
	 * répétaient d'ailleurs ce qui se trouvait déjà ailleurs sur la page ou dans
	 * l'en-tête.
	 *
	 * Le bandeau dit la même chose en trois lignes : la date, le thème, le lieu,
	 * et de quoi cliquer. Il garde la surface pourpre `.fond-apero`, la seule du
	 * site, pour qu'on le reconnaisse d'un coup d'œil, et l'image de couverture
	 * en fond si la fiche en a une.
	 *
	 * Il n'est pas construit sur `Encart.svelte` : celui-ci porte un texte fixe,
	 * alors qu'ici la date, le lieu et l'image viennent de la fiche de l'apéro.
	 * Les deux suivent en revanche le même gabarit — même rembourrage, même
	 * taille de titre, même marge — pour qu'un visiteur ne voie qu'une seule
	 * sorte de bandeau sur tout le site.
	 */
	let {
		apero,
		cadre
	}: {
		apero: PublicationVue;
		/** Heure et lieu habituels des apéros (réglages). */
		cadre: { heure: string; lieu: string };
	} = $props();
</script>

<section class="fond-apero relative mt-6 overflow-hidden rounded-2xl px-4 py-4 sm:px-5 sm:py-5">
	{#if apero.cover}
		<!-- L'image de couverture en fond, teintée par la surface : elle habille
		     sans gêner la lecture. -->
		<img
			src={apero.cover.url}
			alt=""
			class="absolute inset-0 h-full w-full object-cover opacity-25"
			aria-hidden="true"
		/>
	{/if}

	<div class="relative grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
		<div>
			<!-- Les séparateurs sont écrits en expression (`{' · '}`) : collés à une
			     balise, Svelte mange l'espace qui les précède et la ligne devient
			     « 28 septembre 2026- 19 h 30 ». -->
			<p class="text-[0.6875rem] font-bold tracking-[0.18em] text-white/75 uppercase">
				Prochain apéro{' · '}<time datetime={apero.eventAt}>{formatDateLongue(apero.eventAt)}</time
				>{#if cadre.heure}<span class="whitespace-nowrap">{' · '}{cadre.heure}</span>{/if}
			</p>
			<!-- Un cran au-dessus des titres d'article de la liste en dessous : c'est
			     le rendez-vous récurrent du groupe, il ne doit pas être l'élément le
			     plus discret de l'accueil. Le bandeau reste une bande — on monte le
			     titre, pas la hauteur. -->
			<h2 class="titre-affiche mt-1 text-lg text-white sm:text-xl">
				<!-- Le lien du titre est étendu à tout le bandeau par son ::after :
				     toute la surface est cliquable, le bouton n'est là que pour le
				     dire. -->
				<a class="after:absolute after:inset-0" href="/aperos/{apero.slug}">{apero.title}</a>
			</h2>
			{#if cadre.lieu}
				<p class="mt-1 text-sm leading-snug text-white/85">{cadre.lieu}</p>
			{/if}
		</div>

		<!-- `relative` pour passer devant le ::after du lien étendu.

		     Masqué sur mobile : le bouton y passait sous le texte et coûtait
		     cinquante pixels alors que toute la surface est déjà cliquable par le
		     ::after du titre. Sur grand écran il tient sur la même ligne, et il
		     dit que le bandeau mène quelque part. -->
		<div class="relative hidden sm:block">
			<a
				href="/aperos/{apero.slug}"
				class="inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-pourpre transition-colors hover:bg-white/90"
				tabindex="-1"
				aria-hidden="true">En savoir plus</a
			>
		</div>
	</div>
</section>

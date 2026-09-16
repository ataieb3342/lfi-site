<script lang="ts">
	import type { PageData } from './$types';
	import { formatTailleFichier } from '$lib/format';
	import { JEUX, urlJeu } from '$lib/jeux';

	let { data }: { data: PageData } = $props();

	/**
	 * Recherche dans les ressources.
	 *
	 * Le filtrage se fait dans le navigateur, sur une liste déjà chargée : c'est
	 * instantané et cela n'ajoute aucune requête. Sans JavaScript, le champ n'est
	 * pas affiché du tout et la liste complète reste visible — un champ de
	 * recherche qui ne cherche rien serait pire que pas de champ.
	 */
	let recherche = $state('');
	let scriptActif = $state(false);

	$effect(() => {
		scriptActif = true;
	});

	/**
	 * Minuscules et accents retirés, des deux côtés de la comparaison : sans
	 * cela, « economie » ne trouverait pas « économie », ce qui est exactement
	 * ce qu'on tape quand on cherche vite.
	 */
	function normaliser(texte: string): string {
		return texte
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '');
	}

	const sourcesFiltrees = $derived.by(() => {
		const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
		if (termes.length === 0) return data.sources;

		return data.sources.filter((source) => {
			// On cherche dans tout ce qui est affiché sur la ligne, plus le mot
			// « pdf » pour les documents : c'est ce que les gens tapent.
			const matiere = normaliser(
				[
					source.title,
					source.note,
					source.authorName,
					source.site,
					source.apero.titre,
					source.pdf ? 'pdf document' : 'lien'
				]
					.filter((valeur): valeur is string => Boolean(valeur))
					.join(' ')
			);

			return termes.every((terme) => matiere.includes(terme));
		});
	});
</script>

<svelte:head>
	<title>Bibliothèque — {data.settings.siteName}</title>
	<meta name="description" content="Les liens et documents PDF partagés autour des apéros thématiques, et quelques jeux faits maison." />
</svelte:head>

<header class="max-w-2xl">
	<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Ressources partagées</p>
	<h1 class="titre-affiche mt-2 text-4xl text-ink">Bibliothèque</h1>
	<p class="mt-4 text-lg text-ink-soft">
		Ce que nous lisons, regardons et écoutons — proposé et relu par le groupe.
	</p>
</header>

<!-- Les outils interactifs ont leur propre page : ils sont appelés à se
     multiplier, et consulter un lien n'est pas la même chose que faire tourner
     un simulateur. Cet encart est leur porte d'entrée depuis la bibliothèque —
     la page n'est pas dans l'en-tête de bureau, qui déborderait à cinq
     rubriques, mais dans le pied de page et le menu mobile. -->
<aside class="fond-degrade relative mt-10 rounded-xl p-6">
	<p class="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Comprendre et argumenter</p>
	<h2 class="mt-2 text-2xl font-extrabold text-white">
		<a class="after:absolute after:inset-0" href="/boite-a-outils">Boîte à outils</a>
	</h2>
	<p class="mt-2 max-w-xl text-white/85">
		Entrez votre salaire, votre loyer ou votre patrimoine : nos outils interactifs vous montrent
		ce que les chiffres officiels disent de votre situation. Impôts, budget de l’État, patrimoine,
		fin du mois.
	</p>
</aside>

<section class="mt-14" aria-labelledby="ressources">
	<h2 id="ressources" class="text-2xl font-extrabold text-ink">Ressources</h2>
	<p class="mt-2 max-w-2xl text-ink-soft">
		Livres, vidéos et documents proposés autour de nos apéros, relus avant publication.
	</p>

	{#if data.sources.length}
		{#if scriptActif}
			<div class="mt-5 max-w-md">
				<label class="etiquette" for="recherche-ressources">Rechercher une ressource</label>
				<input
					id="recherche-ressources"
					class="champ"
					type="search"
					bind:value={recherche}
					placeholder="Un titre, un thème, un site, un apéro…"
					autocomplete="off"
				/>
				<!-- Le nombre de résultats est annoncé aux lecteurs d'écran, qui ne
				     voient pas la liste se raccourcir sous leurs yeux. -->
				<p class="aide" role="status" aria-live="polite">
					{#if recherche.trim()}
						{sourcesFiltrees.length} ressource{sourcesFiltrees.length > 1 ? 's' : ''} sur
						{data.sources.length}
					{:else}
						{data.sources.length} ressource{data.sources.length > 1 ? 's' : ''} disponible{data
							.sources.length > 1
							? 's'
							: ''}
					{/if}
				</p>
			</div>
		{/if}

		{#if sourcesFiltrees.length}
			<!-- En liste et non en cartes : une ressource est un lien, pas un produit
			     à mettre en vitrine. La liste en tient quinze là où la grille en
			     montrait quatre. -->
			<ul class="mt-5 divide-y divide-line border-y border-line">
				{#each sourcesFiltrees as source (source.id)}
					<li class="py-4">
						<h3 class="font-bold text-ink">
							{#if source.pdf}
								<a class="hover:underline" href={source.pdf.url}>{source.title}</a>
							{:else if source.url}
								<a class="hover:underline" href={source.url} target="_blank" rel="noopener noreferrer nofollow">
									{source.title}
								</a>
							{:else}
								{source.title}
							{/if}
						</h3>

						{#if source.note}<p class="mt-1 text-sm text-ink-soft">{source.note}</p>{/if}

						<p class="mt-1 text-xs text-ink-faint">
							{#if source.pdf}
								PDF · {formatTailleFichier(source.pdf.octets)}
							{:else if source.site}
								{source.site}
							{/if}
							· <a class="hover:underline" href={source.apero.url}>{source.apero.titre}</a>
							{#if source.authorName} · proposé par {source.authorName}{/if}
						</p>

						{#if source.pdf && source.droitsDiffusion}
							<p class="mt-1 text-xs text-ink-faint">
								<strong>Droits de diffusion :</strong> {source.droitsDiffusion}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-5 text-ink-soft">
				Aucune ressource ne correspond à « {recherche} ».
				<button class="font-semibold text-brand hover:underline" type="button" onclick={() => (recherche = '')}>
					Tout afficher
				</button>
			</p>
		{/if}
	{:else}
		<p class="mt-5 text-ink-soft">
			Aucune ressource pour le moment. Les premières peuvent être proposées depuis la fiche d’un
			apéro.
		</p>
	{/if}
</section>

<!-- Les jeux sont des pages à part entière (voir src/lib/jeux.ts) : chacun
     s'ouvre en plein écran, avec un lien de retour vers la bibliothèque.
     Comme les outils, la carte entière est cliquable : pas de bouton répété. -->
<section class="mt-14" aria-labelledby="jeux">
	<h2 id="jeux" class="text-2xl font-extrabold text-ink">Jeux</h2>
	<p class="mt-2 text-ink-soft">Faits par des militants, sans publicité et sans traçage.</p>
	<ul class="mt-5 grid gap-4 sm:grid-cols-2">
		{#each JEUX as jeu (jeu.dossier)}
			<li class="carte relative transition hover:border-brand">
				<h3 class="text-lg font-extrabold text-ink">
					<a class="after:absolute after:inset-0" href={urlJeu(jeu)} data-sveltekit-reload>
						{jeu.titre}
					</a>
				</h3>
				<p class="mt-1 text-sm text-ink-soft">{jeu.description}</p>
			</li>
		{/each}
	</ul>
</section>

<script lang="ts">
	/**
	 * L'en-tête de référencement d'une page publique : titre, description,
	 * adresse canonique, aperçu pour les réseaux sociaux et données structurées.
	 *
	 * Un seul composant pour tout le site, pour la même raison qu'`Encart.svelte` :
	 * ces balises se perdent page par page. Il en manquait une ici, une autre là,
	 * et c'est justement ce que les moteurs regardent en premier.
	 *
	 * L'adresse canonique est la plus importante : elle dit « cette page, c'est
	 * cette adresse-là ». Sans elle, `/articles`, `/articles?page=1` et la même
	 * page atteinte depuis un lien avec une étiquette de campagne comptent pour
	 * trois pages qui se font concurrence, et aucune ne ressort.
	 */
	import { page } from '$app/state';

	let {
		titre,
		description,
		image = null,
		type = 'website',
		indexable = true,
		canonique = null,
		donnees = null
	}: {
		/** Le titre complet de l'onglet, tel qu'il apparaîtra dans Google. */
		titre: string;
		description: string;
		/** Chemin d'une image de couverture (« /media/… »), rendue absolue ici. À défaut, l'image d'aperçu du site. */
		image?: string | null;
		type?: 'website' | 'article';
		/** Faux pour une page qui ne doit pas entrer dans l'index (résultats de recherche, brouillon). */
		indexable?: boolean;
		/** Chemin canonique, si différent de l'adresse consultée. Sert à la pagination. */
		canonique?: string | null;
		/** Données structurées schema.org (voir `$lib/donnees-structurees`). */
		donnees?: unknown;
	} = $props();

	// Sans image de couverture, l'aperçu d'un lien partagé montre le phi sur le
	// violet du site (le fond de `.fond-degrade`). Sans aucune image, le lien
	// passait inaperçu dans un fil WhatsApp ou Facebook. 1200 × 630 : le format
	// des grandes cartes de partage, sur tous les réseaux.
	const IMAGE_PAR_DEFAUT = { chemin: '/apercu-partage.jpg', largeur: 1200, hauteur: 630 };

	const origine = $derived(page.url.origin);
	const adresse = $derived(origine + (canonique ?? page.url.pathname));
	const imageAbsolue = $derived(origine + (image ?? IMAGE_PAR_DEFAUT.chemin));
	const nomDuSite = $derived(page.data.settings?.siteName ?? '');

	// Les « < » du JSON sont échappés avant d'être écrits dans la page : un
	// titre contenant une balise de fermeture refermerait le bloc, et le reste
	// passerait en HTML. C'est la même précaution que `html: false` côté
	// Markdown - un compte compromis ne doit pas pouvoir injecter de script.
	const jsonld = $derived(
		donnees
			? JSON.stringify({ '@context': 'https://schema.org', '@graph': [donnees].flat() }).replace(
					/</g,
					'\\u003c'
				)
			: null
	);
</script>

<svelte:head>
	<title>{titre}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={adresse} />
	{#if !indexable}
		<!-- « follow » : la page n'est pas indexée, mais les liens qu'elle porte
		     sont suivis - sinon les publications listées deviendraient invisibles. -->
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:title" content={titre} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={adresse} />
	<meta property="og:locale" content="fr_FR" />
	{#if nomDuSite}<meta property="og:site_name" content={nomDuSite} />{/if}
	<meta property="og:image" content={imageAbsolue} />
	{#if !image}
		<!-- Les dimensions permettent à Facebook d'afficher l'image dès le premier
		     partage, sans attendre de l'avoir téléchargée. -->
		<meta property="og:image:width" content={String(IMAGE_PAR_DEFAUT.largeur)} />
		<meta property="og:image:height" content={String(IMAGE_PAR_DEFAUT.hauteur)} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />

	<!--
		Les données structurées sont un bloc de données, pas un script : le
		navigateur ne l'exécute pas, la politique de sécurité n'a donc rien à
		assouplir (règle n° 2 des règles de sécurité du projet).
	-->
	{#if jsonld}
		{@html `<script type="application/ld+json">${jsonld}<\/script>`}
	{/if}
</svelte:head>

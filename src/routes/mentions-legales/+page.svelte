<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Mentions légales — {data.settings.siteName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<header class="border-b border-line pb-4">
	<h1 class="text-3xl font-extrabold text-ink sm:text-4xl">Mentions légales</h1>
</header>

<div class="contenu mt-5 max-w-2xl">
	<p class="rounded border border-accent bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
		À COMPLÉTER avant la mise en ligne. La loi pour la confiance dans l'économie numérique
		(article 6-III) rend ces informations obligatoires, y compris pour un site non commercial.
	</p>

	<h2>Éditeur du site</h2>
	<p>
		{data.settings.siteName}<br />
		Directeur ou directrice de la publication : <strong>À COMPLÉTER (nom et prénom)</strong><br />
		Contact : <strong>{data.settings.contactEmail || 'À COMPLÉTER'}</strong>
	</p>
	<p>
		Un site édité à titre non professionnel par une personne physique peut se limiter, en
		affichage public, au nom du directeur de la publication et aux coordonnées de l'hébergeur,
		à condition d'avoir communiqué son identité à l'hébergeur.
	</p>

	<h2>Hébergement</h2>
	<p>
		<strong>À COMPLÉTER : raison sociale de l'hébergeur, adresse postale, téléphone.</strong><br />
		Les données de ce site sont hébergées en France.
	</p>

	<h2>Propriété intellectuelle</h2>
	<p>
		Sauf mention contraire, les textes publiés sur ce site peuvent être repris et diffusés
		librement, à condition d'en citer la source.
	</p>

	<h2>Signaler un contenu</h2>
	<p>
		Pour signaler un contenu que vous estimez illicite, écrivez à l'adresse de contact ci-dessus en
		précisant l'adresse de la page concernée et le motif du signalement.
	</p>
</div>

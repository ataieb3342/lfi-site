<script lang="ts">
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<!-- Hors index : ces pages sont obligatoires, pas destinées aux moteurs. -->
<Metadonnees
	titre="Mentions légales — {data.settings.siteName}"
	description="Éditeur, hébergeur et contact du site du groupe d'action de La France insoumise du centre de Dijon."
	indexable={false}
/>

<header class="border-b border-line pb-4">
	<h1 class="text-3xl font-extrabold text-ink sm:text-4xl">Mentions légales</h1>
</header>

<!--
	Ces informations sont écrites ici et non dans les réglages : l'article 6-III
	de la loi pour la confiance dans l'économie numérique les rend obligatoires,
	et une mention légale qui dépend d'un champ d'administration disparaît le
	jour où quelqu'un vide le champ sans savoir ce qu'il tient.
-->
<div class="contenu mt-5 max-w-2xl">
	<h2>Éditeur du site</h2>
	<p>
		{data.settings.siteName}<br />
		Directeur de la publication : <strong>Adam Taieb</strong><br />
		Contact : <a href="mailto:contact@ataieb-dev.fr">contact@ataieb-dev.fr</a>
	</p>
	<p>
		Ce site est édité à titre non professionnel par une personne physique. La loi l'autorise
		alors à ne pas afficher publiquement son adresse postale, à condition d'avoir communiqué
		son identité à l'hébergeur — ce qui est le cas. L'adresse est communiquée à l'autorité
		judiciaire sur réquisition.
	</p>

	<h2>Hébergement</h2>
	<p>
		OVH SAS<br />
		2 rue Kellermann, 59100 Roubaix, France<br />
		Téléphone : 1007 (depuis la France) ou +33 9 72 10 10 07<br />
		<a href="https://www.ovhcloud.com">ovhcloud.com</a>
	</p>
	<p>Les serveurs et les sauvegardes de ce site sont situés en France.</p>

	<h2>Propriété intellectuelle</h2>
	<p>
		Sauf mention contraire, les textes publiés sur ce site peuvent être repris et diffusés
		librement, à condition d'en citer la source.
	</p>

	<h2>Signaler un contenu</h2>
	<p>
		Pour signaler un contenu que vous estimez illicite, écrivez à
		<a href="mailto:contact@ataieb-dev.fr">contact@ataieb-dev.fr</a> en précisant l'adresse de la
		page concernée et le motif du signalement.
	</p>

	<h2>Données personnelles</h2>
	<p>
		Ce site ne dépose aucun traceur publicitaire et ne conserve aucune adresse IP en clair. Le détail est sur la page
		<a href="/confidentialite">Confidentialité</a>.
	</p>
</div>

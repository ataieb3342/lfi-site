<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const etapes = [
		{
			titre: 'Inscrivez-vous au mouvement',
			texte:
				"C'est gratuit et sans engagement financier : on s'inscrit sur le site de La France insoumise ou sur Action populaire, en acceptant les principes du mouvement.",
			lien: { href: 'https://lafranceinsoumise.fr/rejoindre/', label: 'lafranceinsoumise.fr/rejoindre' }
		},
		{
			titre: 'Rejoignez le groupe',
			texte:
				"Sur Action populaire, cherchez le groupe du centre de Dijon et demandez à le rejoindre. Ou écrivez-nous : on vous indique la date de la prochaine réunion.",
			lien: { href: 'https://actionpopulaire.fr', label: 'actionpopulaire.fr' }
		},
		{
			titre: 'Venez, puis participez',
			texte:
				"Une première réunion pour écouter et poser vos questions. Ensuite, tractage, porte-à-porte, réunions publiques ou logistique : chacun contribue selon ses envies et son temps.",
			lien: null
		}
	];
</script>

<svelte:head>
	<title>Nous rejoindre — {data.settings.siteName}</title>
	<meta
		name="description"
		content="Rejoindre le groupe d'action de La France insoumise du centre de Dijon : inscription gratuite, aucune expérience nécessaire."
	/>
</svelte:head>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">Dijon Centre</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Nous rejoindre</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Aucune expérience militante n'est nécessaire, aucune cotisation n'est demandée. Venez comme
		vous êtes.
	</p>
</header>

<ol class="mt-5 grid gap-4 sm:grid-cols-3">
	{#each etapes as etape, i (etape.titre)}
		<li class="flex flex-col rounded-2xl border border-line bg-carte p-6">
			<span
				class="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-sur-brand"
				aria-hidden="true">{i + 1}</span
			>
			<h2 class="mt-4 text-lg font-extrabold tracking-tight text-ink">{etape.titre}</h2>
			<p class="mt-2 grow text-sm leading-relaxed text-ink-soft">{etape.texte}</p>
			{#if etape.lien}
				<a
					href={etape.lien.href}
					rel="noopener noreferrer"
					target="_blank"
					class="mt-4 text-sm font-semibold text-brand hover:underline">{etape.lien.label} →</a
				>
			{/if}
		</li>
	{/each}
</ol>

<div class="contenu mt-8 max-w-2xl">
	<h2>Ce que ça implique — et ce que ça n'implique pas</h2>
	<p>
		Militer dans un groupe d'action, c'est venir quand on peut. Certains membres sont là chaque
		semaine, d'autres une fois par mois, d'autres seulement pour les grandes mobilisations. Il n'y a
		ni présence obligatoire, ni tâche imposée, ni compte à rendre.
	</p>
	<p>
		L'inscription au mouvement et la participation au groupe sont deux choses distinctes : on
		peut militer avec nous sans être inscrit, et inversement. L'inscription donne accès à Action
		populaire, aux formations et aux informations du mouvement.
	</p>

	<h2>Nous écrire</h2>
	{#if data.settings.contactEmail}
		<p>
			<a href="mailto:{data.settings.contactEmail}">{data.settings.contactEmail}</a> — nous répondons
			sous quelques jours.
		</p>
	{:else}
		<p>
			<strong>À COMPLÉTER</strong> : renseignez une adresse de contact dans
			<em>Administration → Réglages</em>, elle s'affichera automatiquement ici et en pied de page.
		</p>
	{/if}

	<h2>Un autre quartier, une autre ville ?</h2>
	<p>
		Il existe d'autres groupes d'action à Dijon et dans toute la Côte-d'Or. La
		<a href="https://lafranceinsoumise.fr/groupes-action/carte-groupes/" rel="noopener noreferrer" target="_blank"
			>carte des groupes</a
		>
		permet de trouver le plus proche de chez vous, et
		<a href="https://lafranceinsoumise21.fr" rel="noopener noreferrer" target="_blank"
			>La France insoumise 21</a
		> coordonne l'ensemble du département.
	</p>
</div>

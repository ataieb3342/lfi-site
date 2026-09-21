<script lang="ts">
	import { page } from '$app/state';
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import { filAriane } from '$lib/donnees-structurees';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<Metadonnees
	titre="Le groupe — {data.settings.siteName}"
	description="Qui nous sommes, comment fonctionne un groupe d'action de La France insoumise, et où nous trouver dans le centre de Dijon."
	donnees={filAriane(page.url.origin, [
		{ nom: 'Accueil', chemin: '/' },
		{ nom: 'Le groupe', chemin: '/le-groupe' }
	])}
/>

<header class="border-b border-line pb-4">
	<p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">Dijon Centre</p>
	<h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Le groupe</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">
		Un groupe d'action de La France insoumise, ancré dans le centre de Dijon.
	</p>
</header>

<div class="contenu mt-5 max-w-2xl">
	<p>
		Nous sommes des habitantes et habitants du centre de Dijon, réunis pour faire vivre le
		programme de La France insoumise là où nous vivons : dans les rues, sur les marchés, aux
		portes des immeubles et dans les réunions publiques. Pas de carte, pas de cotisation, pas de
		hiérarchie : un collectif de quartier qui décide ensemble de ce qu'il fait.
	</p>

	<h2>Un groupe d'action, c'est quoi ?</h2>
	<p>
		La France insoumise n'est pas organisée en sections mais en <strong>groupes d'action</strong>,
		un maillage de collectifs locaux présents sur tout le territoire. Chacun se constitue
		librement, à partir de deux personnes, et décide de ses propres actions dans le cadre du
		programme commun, <em>L'Avenir en commun</em>.
	</p>
	<p>Ce que prévoit la charte des groupes d'action, et que nous appliquons :</p>
	<ul>
		<li>
			<strong>Deux animateurs, une femme et un homme</strong>, qui gèrent l'outil numérique du
			groupe et veillent au bon déroulement des réunions. Ils n'ont pas de pouvoir de décision
			particulier.
		</li>
		<li>
			<strong>Le consensus plutôt que le vote</strong> : on discute jusqu'à trouver ce qui convient
			à tout le monde. Quand un groupe dépasse une douzaine de membres actifs, il se dédouble
			plutôt que de grossir — c'est ce qui permet à chacun de prendre la parole.
		</li>
		<li>
			<strong>Des actions de terrain régulières</strong> : diffusion de tracts, porte-à-porte,
			points d'information, cafés populaires, soutien aux mobilisations locales.
		</li>
		<li>
			<strong>Bienveillance et ouverture</strong> : aucune expérience militante n'est demandée, et
			personne n'a à justifier de son parcours pour participer.
		</li>
	</ul>

	<h2>Le mouvement</h2>
	<p>
		La France insoumise a été lancée le 10 février 2016 par Jean-Luc Mélenchon. Son programme,
		<em>L'Avenir en commun</em>, a été rédigé de façon participative à partir de plusieurs
		milliers de contributions et publié en décembre 2016 ; il est régulièrement mis à jour.
	</p>
	<p>
		Le mouvement fonctionne en réseau : les groupes d'action d'un même département sont mis en
		relation au sein d'une <strong>boucle départementale</strong>, animée par un binôme de
		référents qui coordonne les initiatives communes et fournit le matériel militant. En Côte-d'Or,
		c'est <a href="https://lafranceinsoumise21.fr" rel="noopener noreferrer" target="_blank"
			>La France insoumise 21</a
		>.
	</p>
	<p>
		L'ensemble s'appuie sur <strong>Action populaire</strong>, la plateforme du mouvement, où sont
		recensés les groupes, les événements et les actions en cours. C'est aussi l'application que
		nous vous proposons d'installer sur nos pages d'actualités.
	</p>

	<h2>Nos réunions</h2>
	<p>
		Le groupe se retrouve aussi régulièrement pour des <a href="/aperos">apéros thématiques</a> :
		un sujet choisi à l'avance, une discussion ouverte à toutes et tous autour d'un verre, puis un
		résumé des échanges publié sur le site. Dates, lieu et résumés des soirées passées sont sur la
		page <a href="/aperos">Les apéros</a>.
	</p>
	<p>
		<strong>À COMPLÉTER</strong> : indiquez ici la fréquence, le jour et le lieu habituel de vos
		réunions, ainsi que la marche à suivre pour venir une première fois.
	</p>

	<h2>Nous contacter</h2>
	{#if data.settings.contactEmail}
		<p>
			Écrivez-nous à <a href="mailto:{data.settings.contactEmail}">{data.settings.contactEmail}</a>,
			ou retrouvez-nous sur <a href="https://actionpopulaire.fr" rel="noopener noreferrer" target="_blank"
				>Action populaire</a
			>. Voir aussi la page <a href="/nous-rejoindre">Nous rejoindre</a>.
		</p>
	{:else}
		<p>
			Retrouvez-nous sur <a href="https://actionpopulaire.fr" rel="noopener noreferrer" target="_blank"
				>Action populaire</a
			>, ou voyez la page <a href="/nous-rejoindre">Nous rejoindre</a>.
		</p>
	{/if}

	<h2>Pour aller plus loin</h2>
	<ul>
		<li>
			<a href="https://lafranceinsoumise.fr/lfi-comment-ca-marche/" rel="noopener noreferrer" target="_blank"
				>Comment fonctionne La France insoumise</a
			>
		</li>
		<li>
			<a
				href="https://lafranceinsoumise.fr/groupes-action/charte-groupes-action-de-france-insoumise/"
				rel="noopener noreferrer"
				target="_blank">La charte des groupes d'action</a
			>
		</li>
		<li>
			<a href="https://lafranceinsoumise.fr/groupes-action/carte-groupes/" rel="noopener noreferrer" target="_blank"
				>La carte des groupes d'action</a
			>
		</li>
	</ul>
</div>

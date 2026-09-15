<script lang="ts">
	import { formatDateTime, formatRelative } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const onglets = [
		{ etat: 'pending', label: 'En attente' },
		{ etat: 'approved', label: 'Publiées' },
		{ etat: 'rejected', label: 'Rejetées' }
	];
</script>

<svelte:head><title>Sources des apéros — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Sources des apéros</h1>
<p class="mt-1 text-sm text-ink-soft">
	Ce que les visiteurs proposent de lire, voir ou écouter avant un apéro. Ouvrez le lien avant de
	publier : c'est lui que les gens cliqueront.
</p>

<nav class="mt-4 flex gap-1 border-b border-line" aria-label="Filtrer par état">
	{#each onglets as onglet (onglet.etat)}
		<a
			href="?etat={onglet.etat}"
			aria-current={data.etat === onglet.etat ? 'page' : undefined}
			class="-mb-px border-b-2 px-4 py-2 text-sm font-semibold
				{data.etat === onglet.etat
				? 'border-brand text-brand'
				: 'border-transparent text-ink-soft hover:text-ink'}"
		>
			{onglet.label}
			{#if onglet.etat === 'pending' && data.sourcesEnAttente}
				<span class="ml-1 rounded-full bg-brand px-1.5 text-xs text-white">{data.sourcesEnAttente}</span>
			{/if}
		</a>
	{/each}
</nav>

{#if data.sources.length}
	<ul class="mt-6 space-y-4">
		{#each data.sources as s (s.id)}
			<li class="carte">
				<div class="flex flex-wrap items-baseline gap-x-2 text-sm">
					<span class="font-bold text-ink">{s.auteur || 'Anonyme'}</span>
					<span class="text-ink-faint">{formatRelative(s.creeLe)}</span>
					<span class="text-ink-faint" title={formatDateTime(s.creeLe)}>·</span>
					<a class="text-brand hover:underline" href={s.publicationLien}>{s.publicationTitre}</a>
					<span class="ml-auto font-mono text-xs text-ink-faint" title="Empreinte d'origine (IP pseudonymisée)"
						>{s.empreinteCourte}</span
					>
				</div>

				<p class="mt-3 font-semibold text-ink">{s.titre}</p>
				{#if s.lien}
					<!-- Le lien complet, en clair : on doit voir où il mène avant de le publier. -->
					<p class="mt-1 text-sm break-all">
						<a class="text-brand hover:underline" href={s.lien} target="_blank" rel="noopener noreferrer nofollow">{s.lien}</a>
					</p>
				{:else}
					<p class="mt-1 text-xs text-ink-faint">Sans lien (un livre, par exemple).</p>
				{/if}
				{#if s.note}
					<p class="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{s.note}</p>
				{/if}

				<div class="mt-4 flex flex-wrap gap-2">
					{#if data.etat !== 'approved'}
						<form method="POST" action="?/approuver&etat={data.etat}">
							<input type="hidden" name="id" value={s.id} />
							<button class="bouton" type="submit">Publier</button>
						</form>
					{/if}
					{#if data.etat !== 'rejected'}
						<form method="POST" action="?/rejeter&etat={data.etat}">
							<input type="hidden" name="id" value={s.id} />
							<button class="bouton-secondaire" type="submit">Rejeter</button>
						</form>
					{/if}
					<form method="POST" action="?/supprimer&etat={data.etat}">
						<input type="hidden" name="id" value={s.id} />
						<button class="bouton-danger" type="submit">Supprimer</button>
					</form>
					<form method="POST" action="?/bloquerOrigine&etat={data.etat}" class="ml-auto">
						<input type="hidden" name="empreinte" value={s.empreinte} />
						<button class="bouton-danger" type="submit" title="Rejette tout ce qu'elle a envoyé en attente et bloque les envois suivants">
							Bloquer cette origine
						</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-6 text-sm text-ink-soft">
		{#if data.etat === 'pending'}
			Rien à relire. Toutes les sources proposées ont été traitées.
		{:else}
			Aucune source dans cette catégorie.
		{/if}
	</p>
{/if}

<p class="mt-8 text-xs text-ink-faint">
	Les origines bloquées se gèrent depuis la page
	<a class="font-semibold text-brand hover:underline" href="/admin/commentaires">Commentaires</a>.
</p>

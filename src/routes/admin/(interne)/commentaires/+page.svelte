<script lang="ts">
	import { formatDateTime, formatRelative } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const onglets = [
		{ etat: 'pending', label: 'En attente' },
		{ etat: 'approved', label: 'Publiés' },
		{ etat: 'rejected', label: 'Rejetés' }
	];
</script>

<svelte:head><title>Commentaires — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Commentaires</h1>

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
			{#if onglet.etat === 'pending' && data.commentairesEnAttente}
				<span class="ml-1 rounded-full bg-brand px-1.5 text-xs text-sur-brand">{data.commentairesEnAttente}</span>
			{/if}
		</a>
	{/each}
</nav>

{#if data.commentaires.length}
	<ul class="mt-6 space-y-4">
		{#each data.commentaires as c (c.id)}
			<li class="carte">
				<div class="flex flex-wrap items-baseline gap-x-2 text-sm">
					<span class="font-bold text-ink">{c.auteur || 'Anonyme'}</span>
					<span class="text-ink-faint">{formatRelative(c.creeLe)}</span>
					<span class="text-ink-faint" title={formatDateTime(c.creeLe)}>·</span>
					<a class="text-brand hover:underline" href={c.publicationLien}>{c.publicationTitre}</a>
					<span class="ml-auto font-mono text-xs text-ink-faint" title="Empreinte d'origine (IP pseudonymisée)"
						>{c.empreinteCourte}</span
					>
				</div>

				<p class="mt-3 whitespace-pre-wrap text-ink">{c.corps}</p>

				<div class="mt-4 flex flex-wrap gap-2">
					{#if data.etat !== 'approved'}
						<form method="POST" action="?/approuver&etat={data.etat}">
							<input type="hidden" name="id" value={c.id} />
							<button class="bouton" type="submit">Publier</button>
						</form>
					{/if}
					{#if data.etat !== 'rejected'}
						<form method="POST" action="?/rejeter&etat={data.etat}">
							<input type="hidden" name="id" value={c.id} />
							<button class="bouton-secondaire" type="submit">Rejeter</button>
						</form>
					{/if}
					<form method="POST" action="?/supprimer&etat={data.etat}">
						<input type="hidden" name="id" value={c.id} />
						<button class="bouton-danger" type="submit">Supprimer</button>
					</form>
					<form method="POST" action="?/bloquerOrigine&etat={data.etat}" class="ml-auto">
						<input type="hidden" name="empreinte" value={c.empreinte} />
						<button class="bouton-danger" type="submit" title="Rejette tous ses messages en attente et bloque les suivants">
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
			Rien à relire. Tous les commentaires ont été traités.
		{:else}
			Aucun commentaire dans cette catégorie.
		{/if}
	</p>
{/if}

{#if data.bloquees.length}
	<section class="mt-12">
		<h2 class="text-lg font-extrabold text-ink">Origines bloquées</h2>
		<p class="mt-1 text-sm text-ink-soft">
			Ces empreintes ne peuvent plus déposer de commentaire. Une empreinte correspond à une adresse
			IP passée à la moulinette d'une fonction à sens unique : elle ne permet pas d'identifier
			quelqu'un.
		</p>
		<ul class="mt-3 divide-y divide-line rounded-lg border border-line text-sm">
			{#each data.bloquees as b (b.ip_hash)}
				<li class="flex flex-wrap items-center gap-3 px-4 py-2">
					<span class="font-mono text-xs">{b.ip_hash.slice(0, 16)}…</span>
					<span class="text-ink-faint">{b.reason}</span>
					<form method="POST" action="?/debloquerOrigine&etat={data.etat}" class="ml-auto">
						<input type="hidden" name="empreinte" value={b.ip_hash} />
						<button class="text-xs font-semibold text-brand hover:underline" type="submit">Débloquer</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}

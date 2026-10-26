<script lang="ts">
	import { COULEUR_KIND, formatDate, libellePublication, lienPublication } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const complete = $derived(data.une.length >= data.max);
</script>

<svelte:head><title>À la une - Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">À la une</h1>
<p class="mt-1 text-sm text-ink-soft">
	Les publications mises en avant en haut de l’<a class="font-semibold text-brand hover:underline" href="/">accueil</a>,
	dans cet ordre : la première en grande fiche, les suivantes en cartes. Rien n’expire tout seul : une publication
	reste à la une jusqu’à ce qu’on l’en retire. {data.max} au plus.
</p>

{#if form?.erreur}<p role="alert" class="alerte mt-4">{form.erreur}</p>{/if}

<p class="mt-6 text-xs font-bold tracking-wide text-ink-faint uppercase">
	{data.une.length} sur {data.max}
</p>
{#if data.une.length}
	<ol class="mt-3 space-y-3">
		{#each data.une as p, i (p.id)}
			<li class="carte flex flex-wrap items-center gap-3">
				{#if p.cover}
					<img class="size-12 shrink-0 rounded-lg object-cover" src={p.cover.url} alt="" width="48" height="48" />
				{:else}
					<div class="size-12 shrink-0 rounded-lg bg-surface-alt" aria-hidden="true"></div>
				{/if}
				<div class="min-w-0 flex-1">
					<p class="text-xs font-semibold text-ink-faint">
						{i === 0 ? 'Grande fiche' : `Carte ${i}`}
						· <span class={COULEUR_KIND[p.kind]}>{libellePublication(p.kind, p.eventCategory)}</span>
						{#if p.pinnedAt}· depuis le {formatDate(p.pinnedAt)}{/if}
					</p>
					<p class="font-bold text-ink">{p.title}</p>
					{#if p.status === 'draft'}
						<p class="text-xs font-semibold text-brand">Repassée en brouillon : elle n’apparaît pas sur l’accueil.</p>
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<form method="POST" action="?/deplacer" class="flex gap-1">
						<input type="hidden" name="id" value={p.id} />
						<button class="bouton-secondaire" type="submit" name="sens" value="haut" disabled={i === 0} aria-label="Monter {p.title}">↑</button>
						<button
							class="bouton-secondaire"
							type="submit"
							name="sens"
							value="bas"
							disabled={i === data.une.length - 1}
							aria-label="Descendre {p.title}">↓</button
						>
					</form>
					<a class="text-sm font-semibold text-brand hover:underline" href={lienPublication(p.kind, p.slug)}>Voir</a>
					<a class="text-sm font-semibold text-ink-soft hover:underline" href="/admin/publications/{p.id}">Modifier</a>
					<form method="POST" action="?/retirer">
						<input type="hidden" name="id" value={p.id} />
						<button class="bouton-secondaire" type="submit">Retirer</button>
					</form>
				</div>
			</li>
		{/each}
	</ol>
{:else}
	<p class="carte mt-3 text-sm text-ink-soft">Rien n’est à la une : la section est masquée sur l’accueil.</p>
{/if}

<h2 class="mt-8 text-lg font-extrabold text-ink">Ajouter une publication</h2>
{#if complete}
	<p class="mt-1 text-sm text-ink-soft">La une est complète : retirez une publication pour en ajouter une autre.</p>
{/if}
<form method="GET" class="mt-3 flex flex-wrap items-end gap-3">
	<div class="grow">
		<label class="etiquette" for="q">Rechercher une publication en ligne</label>
		<input id="q" name="q" class="champ" value={data.recherche} placeholder="Titre ou contenu" />
	</div>
	<button class="bouton-secondaire" type="submit">Rechercher</button>
</form>

{#if data.candidates.length}
	{#if !data.recherche}<p class="mt-5 text-xs font-bold tracking-wide text-ink-faint uppercase">Les plus récentes</p>{/if}
	<ul class="mt-3 divide-y divide-line rounded-lg border border-line">
		{#each data.candidates as p (p.id)}
			<li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
				<div class="min-w-0 grow">
					<p class="font-semibold text-ink">{p.title}</p>
					<p class="mt-0.5 text-xs text-ink-faint">
						<span class="font-semibold {COULEUR_KIND[p.kind]}">{libellePublication(p.kind, p.eventCategory)}</span>
						· Publié le {formatDate(p.publishedAt)}
					</p>
				</div>
				<form method="POST" action="?/ajouter">
					<input type="hidden" name="id" value={p.id} />
					<button class="bouton" type="submit" disabled={complete}>Mettre à la une</button>
				</form>
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-5 text-sm text-ink-soft">Aucune publication en ligne ne correspond à cette recherche.</p>
{/if}

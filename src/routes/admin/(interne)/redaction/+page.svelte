<script lang="ts">
 import type { PageData } from './$types';
 let {data}:{data:PageData}=$props();
</script>
<svelte:head><title>Rédaction - Administration</title></svelte:head>
<header class="flex flex-wrap items-center justify-between gap-4"><h1 class="text-2xl font-extrabold">Rédaction</h1><a class="bouton" href="/admin/publications/nouvelle">Écrire un article</a></header>
<p class="mt-3 text-ink-soft">Les articles en cours restent ici. Quand votre texte est prêt, ouvrez-le et cochez « Soumettre à validation » avant d'enregistrer.</p>
<div class="mt-6 space-y-3">
{#each data.articles as p}
<article class="rounded-lg border border-line p-4"><h2 class="font-bold"><a href="/admin/publications/{p.id}">{p.title}</a></h2><p class="mt-1 text-sm">{p.author_name || 'Auteur à renseigner'} · Brouillon</p>
{#if p.review.advice_requested_id}<p class="mt-2 text-sm text-brand">Avis demandé à {data.admins.find(a=>a.id===p.review.advice_requested_id)?.name ?? 'Compte indisponible'} : {p.review.advice_note}</p>{/if}
<a class="bouton-secondaire mt-3" href="/admin/publications/{p.id}">Continuer la rédaction</a></article>
{:else}<p>Aucun article en rédaction.</p>{/each}
</div>

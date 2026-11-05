<script lang="ts">
 import type { PageData } from './$types';
 let {data}:{data:PageData}=$props();
 let state=$state('all');
</script>
<svelte:head><title>Vérifications - Administration</title></svelte:head>
<h1 class="text-2xl font-extrabold">Vérifications</h1>
<p class="mt-2 text-ink-soft">Articles soumis par leur auteur, classés par urgence puis par ancienneté.</p>
<label class="mt-4 block">État<select class="champ" bind:value={state}><option value="all">Tous</option><option>À valider</option><option>Troisième avis demandé</option><option>Validé</option></select></label>
<div class="mt-6 space-y-4">
{#each data.articles.filter(p=>state==='all'||p.label===state) as p}
<article class="rounded-lg border border-line p-5">
<p class="text-sm"><span class="rounded px-2 py-1 {p.review.reviewer_id ? 'bg-green-100 text-green-900' : p.review.author_approved_by ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-800'}">{p.label}</span> · <span class:text-red-700={p.review.priority===2}>{['Priorité normale','Prioritaire','Urgent'][p.review.priority]}</span></p>
<h2 class="mt-3 font-bold"><a href="/admin/publications/{p.id}">{p.title}</a></h2>
<p class="mt-1 text-sm">Auteur : {p.author_name || 'À renseigner'}</p>
{#if p.review.request_note}<p class="mt-2 text-sm">{p.review.request_note}</p>{/if}
<a class="bouton-secondaire mt-3" href="/admin/publications/{p.id}">Lire et vérifier</a>
</article>
{:else}<p>Aucun article dans cet état.</p>{/each}
</div>

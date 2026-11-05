<script lang="ts">
 import type { PageData } from './$types';
 let {data}:{data:PageData}=$props();
 const items=$derived(data.tab==='mes-articles'?data.mine:data.toReview);
</script>
<svelte:head><title>Vérifications - Administration</title></svelte:head>
<header class="flex flex-wrap items-center justify-between gap-4"><h1 class="text-2xl font-extrabold">Vérifications</h1><a class="bouton-secondaire" href="/admin/publications/nouvelle">Écrire un article</a></header>
<nav aria-label="Suivi des articles" class="mt-5 flex gap-2 border-b border-line pb-3">
 <a class={data.tab==='mes-articles'?'bouton':'bouton-secondaire'} aria-current={data.tab==='mes-articles'?'page':undefined} href="/admin/verifications?onglet=mes-articles">Mes articles</a>
 <a class={data.tab==='a-verifier'?'bouton':'bouton-secondaire'} aria-current={data.tab==='a-verifier'?'page':undefined} href="/admin/verifications?onglet=a-verifier">À vérifier ({data.toReview.length})</a>
</nav>
<p class="mt-4 text-sm text-ink-soft">{data.tab==='mes-articles'?'Retrouvez vos textes et les retours reçus. Pendant la relecture, vous pouvez consulter le texte et les commentaires.':'Les articles des autres sur lesquels vous pouvez intervenir. Les demandes d’avis sur un brouillon sont indiquées séparément.'}</p>
<div class="mt-5 space-y-3">
{#each items as p (p.id)}
<article class="rounded-lg border border-line p-4">
 <div class="flex flex-wrap items-center gap-2 text-sm"><span class="rounded px-2 py-1 {p.review.reviewer_id?'bg-green-100 text-green-900':p.review.author_approved_by?'bg-amber-100 text-amber-900':'bg-gray-100 text-gray-800'}">{data.tab==='a-verifier'?(p.permissions.canReplyAdvice?'Votre avis est demandé':'À relire'):p.label}</span>{#if p.review.priority===2}<span class="text-red-700">Urgent</span>{/if}</div>
 <h2 class="mt-2 font-bold"><a href="/admin/publications/{p.id}">{p.title}</a></h2>
 {#if data.tab==='a-verifier'}<p class="mt-1 text-sm">Auteur : {p.author_name || 'À renseigner'}</p>{/if}
 {#if p.lastRemark}<p class="mt-2 text-sm text-ink-soft">Dernier retour : {p.lastRemark}</p>{/if}
 {#if p.permissions.canReplyAdvice}<p class="mt-2 text-sm">{p.review.advice_note}</p>{/if}
 <a class="bouton-secondaire mt-3" href="/admin/publications/{p.id}">{data.tab==='a-verifier'?(p.permissions.canReplyAdvice?'Donner mon avis':'Lire et vérifier'):p.permissions.canPublish?'Voir et publier':p.permissions.canEdit?'Continuer la rédaction':'Consulter'}</a>
</article>
{:else}<p class="py-5 text-ink-soft">{data.tab==='mes-articles'?'Aucun article en cours.':'Aucune intervention en attente pour vous.'}</p>{/each}
</div>

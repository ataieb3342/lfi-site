<script lang="ts">
 import Metadonnees from '$lib/components/Metadonnees.svelte';
 import { filAriane } from '$lib/donnees-structurees';
 import { page } from '$app/state';
 import type { PageData } from './$types';
 let { data }: { data: PageData } = $props();
</script>
<Metadonnees titre="Dessins et caricatures - {data.settings.siteName}" description="Dessins et caricatures proposés sur le site. Vous pouvez envoyer un dessin sans créer de compte." donnees={filAriane(page.url.origin, [{ nom: 'Accueil', chemin: '/' }, { nom: 'Dessins et caricatures', chemin: '/dessins' }])} />
<header class="border-b border-line pb-4">
 <h1 class="titre-affiche text-3xl text-ink sm:text-4xl">Dessins et caricatures</h1>
 <p class="mt-3 max-w-2xl text-lg text-ink-soft">Vous pouvez proposer un dessin sans créer de compte. Il sera vérifié avant d’être publié.</p>
 <a class="bouton mt-5" href="/dessins/proposer">Proposer un dessin</a>
</header>
{#if data.drawings.length}
 <ul class="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
  {#each data.drawings as drawing (drawing.id)}
   <li>
    <a href="/dessins/{drawing.id}" class="group block">
     {#if drawing.image}<div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-carte p-3"><img src={drawing.thumbnail ?? drawing.image} alt={drawing.alt} class="h-full w-full object-contain" loading="lazy" decoding="async" /></div>{/if}
     <h2 class="mt-3 text-xl font-bold text-ink group-hover:text-brand">{drawing.title}</h2>
     <p class="mt-1 text-sm text-ink-soft">Dessin de {drawing.author}</p>
     <span class="mt-3 inline-block text-sm font-semibold text-brand">Voir et partager →</span>
    </a>
   </li>
  {/each}
 </ul>
{:else}
 <div class="mt-8 rounded-xl border border-line bg-carte p-6">
  <p class="text-ink-soft">Aucun dessin publié pour le moment.</p>
  {#if data.admin}<a class="bouton mt-5" href="/admin/dessins">Ajouter un dessin</a>{/if}
 </div>
{/if}

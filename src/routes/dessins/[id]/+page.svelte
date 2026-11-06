<script lang="ts">
 import { page } from '$app/state';
 import Metadonnees from '$lib/components/Metadonnees.svelte';
 import DrawingViewer from '$lib/components/DrawingViewer.svelte';
 import Partage from '$lib/components/Partage.svelte';
 import { filAriane } from '$lib/donnees-structurees';
 import type { PageData } from './$types';
 let { data }: { data: PageData } = $props();
 const drawing = $derived(data.drawing);
</script>
<Metadonnees titre="{drawing.title} - {data.settings.siteName}" description={drawing.caption || `Dessin de ${drawing.author} : ${drawing.title}`} image={drawing.image} canonique="/dessins/{drawing.id}" donnees={filAriane(page.url.origin, [{ nom: 'Accueil', chemin: '/' }, { nom: 'Dessins et caricatures', chemin: '/dessins' }, { nom: drawing.title, chemin: `/dessins/${drawing.id}` }])} />
<a class="text-sm font-semibold text-brand hover:underline" href="/dessins">← Tous les dessins</a>
<article class="mt-6">
 <header class="border-b border-line pb-4">
  <h1 class="titre-affiche text-3xl text-ink sm:text-4xl">{drawing.title}</h1>
  <p class="mt-3 text-ink-soft">Dessin de {drawing.author}</p>
 </header>
 {#if drawing.image}
  <figure class="mt-6"><DrawingViewer image={drawing.image} alt={drawing.alt} title={drawing.title} previous={data.previous} next={data.next} /><figcaption class="mt-3 whitespace-pre-line text-ink-soft">{drawing.caption}</figcaption></figure>
  <a class="bouton-secondaire mt-5" href={drawing.image} download>Télécharger l’image originale</a>
 {/if}
 <p class="mt-5 whitespace-pre-line text-sm text-ink-soft">{drawing.rights}</p>
 <nav class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5" aria-label="Parcourir les dessins">
  {#if data.previous}<a class="bouton-secondaire" href="/dessins/{data.previous.id}" aria-label="Dessin précédent : {data.previous.title}">← Précédent</a>{:else}<span></span>{/if}
  {#if data.next}<a class="bouton-secondaire" href="/dessins/{data.next.id}" aria-label="Dessin suivant : {data.next.title}">Suivant →</a>{/if}
 </nav>
 <Partage titre={drawing.title} adresse={`${page.url.origin}/dessins/${drawing.id}`} />
</article>

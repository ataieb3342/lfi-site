<script lang="ts">
 import { onMount } from 'svelte';
 let { image, alt, title, previous, next }: {
  image: string; alt: string; title: string;
  previous: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
 } = $props();
 let dialog: HTMLDialogElement;
 let stage: HTMLDivElement;
 let active = $state(false);
 let zoom = $state(1);
 onMount(() => { active = true; });
 $effect(() => { image; zoom = 1; if (stage) { stage.scrollTop = 0; stage.scrollLeft = 0; } });
 function open() { zoom = 1; dialog.showModal(); }
 function changeZoom(value: number) {
  zoom = value;
  if (stage) { stage.scrollTop = 0; stage.scrollLeft = 0; }
 }
 function navigate(event: KeyboardEvent) {
  if (zoom > 1 || event.target instanceof HTMLInputElement) return;
  if (event.key === 'ArrowLeft' && previous) { event.preventDefault(); window.location.assign(`/dessins/${previous.id}?lecture=1`); }
  if (event.key === 'ArrowRight' && next) { event.preventDefault(); window.location.assign(`/dessins/${next.id}?lecture=1`); }
 }
 onMount(() => {
  if (new URLSearchParams(window.location.search).get('lecture') === '1') open();
 });
</script>
{#if active}
 <button type="button" class="block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-brand" onclick={open} aria-label="Agrandir le dessin : {title}">
  <img class="mx-auto max-h-[75vh] w-full rounded-xl bg-carte object-contain" src={image} {alt} />
 </button>
 <p class="mt-3 text-center text-sm text-ink-faint">Toucher ou cliquer sur le dessin pour l’agrandir</p>
{:else}
 <a href={image} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir le dessin en taille originale"><img class="mx-auto max-h-[75vh] w-full rounded-xl bg-carte object-contain" src={image} {alt} /></a>
{/if}
<dialog bind:this={dialog} onkeydown={navigate} class="drawing-reader" aria-labelledby="drawing-reader-title">
 <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
  <h2 id="drawing-reader-title" class="min-w-0 text-lg font-bold text-ink">{title}</h2>
  <button class="bouton-secondaire" type="button" onclick={() => dialog.close()}>Fermer</button>
 </div>
 <div class="flex flex-wrap items-center justify-center gap-2 p-3">
  <button class="bouton-secondaire" type="button" disabled={zoom === 1} onclick={() => changeZoom(zoom - 1)} aria-label="Réduire le dessin">Réduire</button>
  <span class="min-w-12 text-center text-sm text-ink" aria-live="polite">{zoom}×</span>
  <button class="bouton-secondaire" type="button" disabled={zoom === 3} onclick={() => changeZoom(zoom + 1)} aria-label="Zoomer dans le dessin">Zoomer</button>
 </div>
 <div bind:this={stage} class="drawing-stage" class:zoomed={zoom > 1} class:triple={zoom === 3}>
  <img src={image} {alt} draggable="false" />
 </div>
 <nav class="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4" aria-label="Parcourir les dessins en grand">
  {#if previous}<a class="bouton-secondaire" href="/dessins/{previous.id}?lecture=1" aria-label="Dessin précédent : {previous.title}">← Précédent</a>{:else}<span></span>{/if}
  {#if next}<a class="bouton-secondaire" href="/dessins/{next.id}?lecture=1" aria-label="Dessin suivant : {next.title}">Suivant →</a>{/if}
 </nav>
</dialog>
<style>
 .drawing-reader { width: min(96vw, 90rem); max-width: 96vw; max-height: 95dvh; padding: 0; margin: auto; border: 1px solid var(--color-line); border-radius: 1rem; background: var(--color-carte); color: var(--color-ink); }
 .drawing-reader::backdrop { background: rgb(0 0 0 / 80%); }
 .drawing-stage { max-height: 65dvh; overflow: auto; overscroll-behavior: contain; background: var(--color-surface); }
 .drawing-stage img { display: block; max-width: 100%; max-height: 65dvh; width: auto; height: auto; margin: auto; object-fit: contain; }
 .drawing-stage.zoomed img { width: 200%; max-width: none; max-height: none; }
 .drawing-stage.triple img { width: 300%; }
 @media (max-width: 480px) { .drawing-stage, .drawing-stage img { max-height: 55dvh; } .drawing-stage.zoomed img { max-height: none; } }
</style>

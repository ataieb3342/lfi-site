<script lang="ts">
 import DrawingForm from '$lib/components/DrawingForm.svelte';
 import type { PageData, ActionData } from './$types';
 let { data, form }: { data: PageData; form: ActionData } = $props();
</script>
<svelte:head><title>Dessins · Administration</title></svelte:head>
<header class="border-b border-line pb-4"><h1 class="titre-affiche text-3xl text-ink">Dessins et caricatures</h1><p class="mt-3 text-ink-soft">Vérifiez les propositions reçues, puis publiez les dessins acceptés avec leur signature.</p><a class="mt-3 inline-block font-semibold text-brand hover:underline" href="/dessins">Voir la galerie →</a></header>
{#if form?.error}<p role="alert" class="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">{form.error}</p>{/if}
<section class="mt-6" aria-labelledby="pending-drawings-title">
 <h2 id="pending-drawings-title" class="text-xl font-bold text-ink">Propositions à vérifier ({data.submissions.length})</h2>
 {#if !data.submissions.length}<p class="mt-3 text-ink-soft">Aucune proposition en attente.</p>{/if}
 {#each data.submissions as submission (submission.id)}
  <details class="carte mt-5">
   <summary class="cursor-pointer font-semibold text-ink">{submission.title} · {submission.author}</summary>
   <a href={submission.image} target="_blank" rel="noopener noreferrer"><img class="mt-5 max-h-96 w-full object-contain" src={submission.image} alt={submission.alt} /></a>
   <form method="POST" action="?/approve" class="mt-5 space-y-4">
    <input type="hidden" name="submissionId" value={submission.id} />
    <div><label class="etiquette" for="submission-{submission.id}-title">Titre</label><input class="champ" id="submission-{submission.id}-title" name="title" value={submission.title} required maxlength="180" /></div>
    <div><label class="etiquette" for="submission-{submission.id}-author">Auteur ou pseudonyme</label><input class="champ" id="submission-{submission.id}-author" name="author" value={submission.author} required maxlength="120" /></div>
    <div><label class="etiquette" for="submission-{submission.id}-alt">Description accessible</label><textarea class="champ" id="submission-{submission.id}-alt" name="alt" required maxlength="300" rows="3">{submission.alt}</textarea></div>
    <div><label class="etiquette" for="submission-{submission.id}-caption">Légende</label><textarea class="champ" id="submission-{submission.id}-caption" name="caption" maxlength="2000" rows="3">{submission.caption}</textarea></div>
    <div><label class="etiquette" for="submission-{submission.id}-rights">Conditions de partage indiquées par l’auteur</label><textarea class="champ" id="submission-{submission.id}-rights" name="rights" required maxlength="500" rows="2">{submission.rights}</textarea></div>
    <p class="text-sm text-ink-soft">L’expéditeur a confirmé disposer de l’autorisation de publication. Vérifiez le dessin et ses conditions avant de l’accepter.</p>
    <button class="bouton" type="submit">Accepter et publier</button>
   </form>
   <details class="mt-5 border-t border-line pt-5"><summary class="cursor-pointer text-sm text-ink-soft">Refuser cette proposition…</summary><form method="POST" action="?/reject" class="mt-3"><input type="hidden" name="submissionId" value={submission.id} /><p class="mb-3 text-sm text-ink-soft">La proposition et son fichier privé seront supprimés.</p><button class="bouton-secondaire" type="submit">Confirmer le refus</button></form></details>
  </details>
 {/each}
</section>
<details class="carte mt-6" open={!data.drawings.length}><summary class="cursor-pointer text-lg font-bold text-ink">Ajouter un dessin</summary><div class="mt-5"><DrawingForm /></div></details>
<section class="mt-8" aria-label="Dessins enregistrés">
 {#each data.drawings as drawing (drawing.id)}
  <details class="mt-5 rounded-xl border border-line bg-carte p-5">
   <summary class="cursor-pointer font-semibold text-ink">{drawing.title} · {drawing.published ? 'Publié' : 'Brouillon'}</summary>
   {#if drawing.image}<img class="mt-5 max-h-64 w-full object-contain" src={drawing.image} alt={drawing.alt} />{/if}
   {#if drawing.published}<a class="mt-3 inline-block text-sm font-semibold text-brand hover:underline" href="/dessins/{drawing.id}">Voir la page publique →</a>{/if}
   <div class="mt-5"><DrawingForm {drawing} /></div>
   <details class="mt-5 border-t border-line pt-5"><summary class="cursor-pointer text-sm text-ink-soft">Supprimer ce dessin…</summary><form method="POST" action="?/delete" class="mt-3"><input type="hidden" name="id" value={drawing.id} /><p class="mb-3 text-sm text-ink-soft">La fiche sera supprimée. L’image restera disponible dans la médiathèque.</p><button class="bouton-secondaire" type="submit">Confirmer la suppression</button></form></details>
  </details>
 {/each}
</section>

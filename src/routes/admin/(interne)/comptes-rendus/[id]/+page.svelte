<script lang="ts">
 import {enhance} from '$app/forms';
 import MeetingReportEditor from '$lib/components/MeetingReportEditor.svelte';
 import type {PageData,ActionData} from './$types';
 let {data,form}:{data:PageData;form:ActionData}=$props();
 let savingTask=$state(false);
 let taskLine=$state('');let taskChecked=$state('false');
 function changeTask(event:Event){
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||!input.dataset.taskLine)return;
  taskLine=input.dataset.taskLine;taskChecked=String(input.checked);
  const taskForm=input.form;if(!taskForm)return;
  // FormData reads the hidden controls immediately, before Svelte's next render.
  (taskForm.elements.namedItem('taskLine') as HTMLInputElement).value=taskLine;
  (taskForm.elements.namedItem('checked') as HTMLInputElement).value=taskChecked;
  taskForm.requestSubmit();
 }
</script>
<svelte:head><title>{data.report.title} · Comptes rendus internes</title></svelte:head>
<a class="text-sm font-semibold text-brand hover:underline" href="/admin/comptes-rendus">← Comptes rendus de réunions</a>
<header class="mt-6 border-b border-line pb-4"><h1 class="titre-affiche text-3xl text-ink">{data.report.title}</h1><p class="mt-3 text-ink-soft">Réunion du {data.report.meetingDate.split('-').reverse().join('/')} · Document interne</p></header>
{#if form?.error}<p role="alert" class="alerte mt-5">{form.error}</p>{/if}
{#if data.report.originalUrl}<a class="bouton-secondaire mt-5" href={data.report.originalUrl}>Télécharger l’original ({data.report.originalName})</a><p class="aide">Le fichier original correspond à l’import initial ; les corrections ci-dessous concernent le texte consultable sur le site.</p>{/if}
<form class="mt-6" method="POST" action="?/task" onchange={changeTask} use:enhance={()=>{savingTask=true;return async({update,result})=>{try{if(result.type!=='success'){const checkbox=document.querySelector<HTMLInputElement>(`.meeting-body input[data-task-line="${taskLine}"]`);if(checkbox)checkbox.checked=taskChecked!=='true';}await update({reset:false});}finally{savingTask=false;}};}}>
 <input type="hidden" name="version" value={data.report.updatedAt} />
 <input type="hidden" name="taskLine" value={taskLine} /><input type="hidden" name="checked" value={taskChecked} />
 <fieldset disabled={savingTask} class="min-w-0"><div class="contenu meeting-body">{@html data.html}</div></fieldset>
 <p class="aide" role="status">{savingTask?'Enregistrement…':form?.taskSaved?'Case enregistrée.':'Les cases à cocher sont enregistrées automatiquement.'}</p>
</form>
<details class="carte mt-8"><summary class="cursor-pointer font-bold text-ink">Modifier le compte rendu</summary><form class="mt-5 space-y-5" method="POST" action="?/save" use:enhance>
 <input type="hidden" name="version" value={data.report.updatedAt} />
 <div><label class="etiquette" for="edit-title">Titre</label><input class="champ" id="edit-title" name="title" required maxlength="200" value={data.report.title} /></div>
 <div><label class="etiquette" for="edit-date">Date de la réunion</label><input class="champ" id="edit-date" name="meetingDate" type="date" required value={data.report.meetingDate} /></div>
 {#key data.report.updatedAt}<MeetingReportEditor id="edit-body" body={data.report.body} required />{/key}
 <button class="bouton" type="submit">Enregistrer les modifications</button>
</form></details>
<style>
 :global(.meeting-body .meeting-task){list-style:none;}
 :global(.meeting-body input[type="checkbox"]){width:1rem;height:1rem;vertical-align:middle;margin-right:0.4rem;accent-color:var(--color-brand);cursor:pointer;}
 :global(.meeting-body h1){font-size:1.6rem;font-weight:700;margin:1.6rem 0 1rem;}
</style>
<details class="mt-6 border-t border-line pt-5"><summary class="cursor-pointer text-sm text-ink-soft">Supprimer ce compte rendu…</summary><p class="mt-3 text-sm text-ink-soft">Le compte rendu et le fichier original seront supprimés.</p><form method="POST" action="?/delete" class="mt-3"><button class="bouton-secondaire" type="submit">Confirmer la suppression</button></form></details>

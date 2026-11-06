<script lang="ts">
 import { enhance } from '$app/forms';
 import MeetingReportEditor from '$lib/components/MeetingReportEditor.svelte';
 import type { PageData,ActionData } from './$types';
 let {data,form}:{data:PageData;form:ActionData}=$props();
 let sending=$state(false);
 let body=$state('');let importing=$state(false);let importError=$state('');let importStatus=$state('');
 let importSequence=0;
 async function readFile(event:Event){
  const file=(event.currentTarget as HTMLInputElement).files?.[0];
  const sequence=++importSequence;importError='';importStatus='';
  if(!file){importing=false;return;}
  importing=true;
  try{
   const payload=new FormData();payload.set('file',file);
   const response=await fetch('/admin/comptes-rendus/import',{method:'POST',body:payload});
   if(response.redirected)throw new Error('Votre session a expiré. Reconnectez-vous.');
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??'Le fichier n’a pas pu être importé.');
   if(sequence!==importSequence)return;
   body=result.body;importStatus='Le texte est prêt à être corrigé ci-dessous.';
  }catch(error){if(sequence===importSequence)importError=error instanceof Error?error.message:'Import impossible.';}
  finally{if(sequence===importSequence)importing=false;}
 }
</script>
<svelte:head><title>Comptes rendus de réunions · Administration</title></svelte:head>
<header class="border-b border-line pb-4"><h1 class="titre-affiche text-3xl text-ink">Comptes rendus de réunions</h1><p class="mt-3 text-ink-soft">Un espace interne, accessible uniquement aux administrateurs connectés.</p></header>
{#if form?.error}<p class="alerte mt-5" role="alert">{form.error}</p>{/if}
<details class="carte mt-6"><summary class="cursor-pointer text-lg font-bold text-ink">Ajouter un compte rendu</summary>
 <form class="mt-5 space-y-5" method="POST" action="?/create" enctype="multipart/form-data" use:enhance={()=>{sending=true;return async({update})=>{try{await update({reset:false});}finally{sending=false;}};}}>
  <div><label class="etiquette" for="title">Titre de la réunion</label><input class="champ" id="title" name="title" required maxlength="200" /></div>
  <div><label class="etiquette" for="meeting-date">Date de la réunion</label><input class="champ" id="meeting-date" name="meetingDate" type="date" required /></div>
  <div><label class="etiquette" for="file">Importer un fichier .docx ou .md</label><input class="champ" id="file" name="file" type="file" accept=".docx,.md,.markdown" onchange={readFile} disabled={sending} /><p class="aide">.docx : 10 Mo maximum. .md : 1 Mo maximum. Le fichier original reste téléchargeable.</p></div>
  {#if importError}<p class="alerte" role="alert">{importError}</p>{/if}
  <p class="aide" role="status">{importing?'Lecture du fichier…':importStatus}</p>
  <fieldset disabled={importing||sending} class="min-w-0"><MeetingReportEditor template bind:body /></fieldset>
  <button class="bouton" type="submit" disabled={sending||importing||!!importError}>{sending?'Enregistrement en cours…':'Enregistrer le compte rendu'}</button>
 </form>
</details>
<form method="GET" class="mt-6 flex flex-wrap items-end gap-3"><div class="min-w-0 flex-1"><label class="etiquette" for="q">Rechercher dans les titres et le texte</label><input class="champ" id="q" name="q" value={data.search} maxlength="100" /></div><button class="bouton-secondaire" type="submit">Rechercher</button>{#if data.search}<a class="bouton-secondaire" href="/admin/comptes-rendus">Tout afficher</a>{/if}</form>
{#if data.reports.length}
 <ul class="mt-6 divide-y divide-line">{#each data.reports as report (report.id)}<li class="py-4"><a class="font-bold text-brand hover:underline" href="/admin/comptes-rendus/{report.id}">{report.title}</a><p class="mt-1 text-sm text-ink-soft">Réunion du {report.meetingDate.split('-').reverse().join('/')}</p></li>{/each}</ul>
 {#if data.reports.length===200}<p class="mt-3 text-sm text-ink-soft">Les 200 premiers résultats sont affichés. Précisez votre recherche pour retrouver un compte rendu plus ancien.</p>{/if}
{:else}<p class="mt-6 text-ink-soft">{data.search?'Aucun compte rendu ne correspond à cette recherche.':'Aucun compte rendu enregistré pour le moment.'}</p>{/if}

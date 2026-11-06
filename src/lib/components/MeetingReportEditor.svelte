<script lang="ts">
 import { tick } from 'svelte';
 import { renderMeetingBody } from '../meeting-markdown';
 let { body=$bindable(''), id='body', required=false, template=false }:{body?:string;id?:string;required?:boolean;template?:boolean}=$props();
 let mode=$state<'markdown'|'preview'>('markdown');
 let area=$state<HTMLTextAreaElement>();
 const html=$derived(renderMeetingBody(body));
 const model='## Participants\n\n\n\n## Points discutés\n\n\n\n## Décisions\n\n\n\n## Actions à mener\n\n- [ ] \n';
 async function wrap(before:string,after=before,placeholder='texte'){
  if(!area)return;
  const start=area.selectionStart,end=area.selectionEnd;
  const selected=body.slice(start,end)||placeholder;
  body=body.slice(0,start)+before+selected+after+body.slice(end);
  await tick();area.focus();area.setSelectionRange(start+before.length,start+before.length+selected.length);
 }
 async function prefix(marker:string){
  if(!area)return;
  const selection=area.selectionStart;
  const start=selection===0?0:body.lastIndexOf('\n',selection-1)+1;
  const end=area.selectionEnd;
  const text=body.slice(start,end).split('\n').map(line=>marker+line).join('\n');
  body=body.slice(0,start)+text+body.slice(end);
  await tick();area.focus();area.setSelectionRange(start+text.length,start+text.length);
 }
 async function useTemplate(){body=model;mode='markdown';await tick();area?.focus();}
</script>
<div class="report-editor" role="group" aria-label="Éditeur du compte rendu">
 <div class="editor-heading">
  <label class="etiquette" for={id}>Écrire en Markdown</label>
  {#if template && !body.trim()}<button type="button" class="template-button" onclick={useTemplate}>Utiliser le modèle</button>{/if}
 </div>
 <div class="editor-surface">
  <div class="editor-bar">
   <div class="editor-tabs" role="group" aria-label="Mode d’édition">
    <button type="button" aria-pressed={mode==='markdown'} onclick={()=>mode='markdown'}>Rédaction</button>
    <button type="button" aria-pressed={mode==='preview'} disabled={!body.trim()} onclick={()=>mode='preview'}>Aperçu</button>
   </div>
   {#if mode==='markdown'}
    <div class="editor-tools" role="group" aria-label="Mise en forme Markdown">
     <button type="button" class="bold-tool" title="Mettre en gras" onclick={()=>wrap('**')}>Gras</button>
     <button type="button" class="italic-tool" title="Mettre en italique" onclick={()=>wrap('*')}>Italique</button>
     <button type="button" onclick={()=>prefix('## ')}>Titre</button>
     <span class="separator" aria-hidden="true"></span>
     <button type="button" onclick={()=>wrap('[','](https://)','texte du lien')}>Lien</button>
     <button type="button" onclick={()=>prefix('- ')}>Liste</button>
     <button type="button" onclick={()=>prefix('- [ ] ')}>Case à cocher</button>
    </div>
   {/if}
  </div>
  <textarea class="font-mono" hidden={mode!=='markdown'} {id} name="body" {required} maxlength="200000" rows="16" bind:this={area} bind:value={body}></textarea>
  {#if mode==='preview'}<fieldset disabled class="preview-surface"><div class="contenu report-preview">{@html html}</div></fieldset>{/if}
 </div>
</div>
<style>
 .editor-heading { display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem;margin-bottom:.6rem; }
 .editor-heading label { margin:0; }
 .template-button { color:var(--color-brand);font-size:.8rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer; }
 .editor-surface { overflow:hidden;border:1px solid var(--color-line-forte);border-radius:.5rem;background:var(--color-carte); }
 .editor-bar { display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;padding:.4rem .6rem;border-bottom:1px solid var(--color-line); }
 .editor-tabs,.editor-tools { display:flex;flex-wrap:wrap;align-items:center;gap:.15rem; }
 .editor-tabs { padding-right:.7rem;border-right:1px solid var(--color-line); }
 .editor-bar button { border-radius:.25rem;padding:.4rem .5rem;color:var(--color-ink-soft);font-size:.8rem;line-height:1.3;cursor:pointer; }
 .editor-bar button:hover:not(:disabled) { background:color-mix(in srgb,var(--color-brand) 10%,transparent);color:var(--color-ink); }
 .editor-tabs button[aria-pressed='true'] { background:color-mix(in srgb,var(--color-brand) 15%,transparent);color:var(--color-brand);font-weight:600; }
 button:focus-visible { outline:2px solid var(--color-brand);outline-offset:2px; }
 button:disabled { opacity:.45;cursor:default; }
 .bold-tool { font-weight:700; }.italic-tool { font-style:italic; }
 .separator { height:1rem;border-left:1px solid var(--color-line);margin:0 .3rem; }
 textarea { width:100%;display:block;resize:vertical;min-height:18rem;border:0;background:transparent;padding:1rem;color:var(--color-ink);font-size:.875rem;line-height:1.65; }
 textarea[hidden] { display:none; }
 textarea:focus { outline:0;box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--color-brand) 45%,transparent); }
 .preview-surface { padding:1rem;min-height:18rem;min-width:0; }
 :global(.report-preview .meeting-task){list-style:none;}
 :global(.report-preview input[type="checkbox"]){width:1rem;height:1rem;vertical-align:middle;margin-right:0.4rem;}
 :global(.report-preview h1){font-size:1.6rem;font-weight:700;margin:1.6rem 0 1rem;}
 @media(max-width:640px){.editor-tabs{border-right:0;}.editor-tools{width:100%;border-top:1px solid var(--color-line);padding-top:.35rem;}.editor-bar{gap:.35rem;}}
</style>

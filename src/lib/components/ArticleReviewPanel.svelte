<script lang="ts">
 import type { Review, articleReviewPermissions, reviewHistory } from '$lib/server/reviews';
 import { formatDateTime } from '$lib/format';
 let {id,review,permissions,admins,actorId,ownerId,history,status,error=''}:{
 id:number;review:Review;permissions:ReturnType<typeof articleReviewPermissions>;
 admins:{id:number;name:string}[];actorId:number;ownerId:number|null;
 history:ReturnType<typeof reviewHistory>;status:string;error?:string;
 }=$props();
 const targetName=$derived(admins.find(a=>a.id===(review.requested_id ?? review.advice_requested_id))?.name ?? 'la personne sollicitée');
 const message=$derived(status==='published'?'Cet article est publié.':permissions.canPublish?'Votre article est validé. Vous pouvez le publier.':review.requested_id?`En attente de l’avis de ${targetName}.`:permissions.canReplyAdvice?'Votre avis est demandé sur ce brouillon.':permissions.isAuthor&&review.author_approved_by?'Votre article attend une relecture.':permissions.canReview?'Cet article attend votre relecture.':permissions.canSubmit?'Votre article est en rédaction.':'Vous pouvez consulter cet article.');
 const remarks=$derived(history.filter(h=>['comment','corrections','advice_reply'].includes(h.action)).slice(0,3));
 const labels:Record<string,string>={author:'Soumission',approve:'Validation',comment:'Commentaire',corrections:'Corrections demandées',advice:'Avis demandé',advice_reply:'Avis reçu',request:'Autre avis demandé',priority:'Priorité modifiée'};
</script>
<section class="mb-6 rounded-lg border border-line p-5" aria-label="Suivi de l'article">
 <h2 class="font-bold">{message}</h2>
 {#if error}<p class="alerte mt-3" role="alert">{error}</p>{/if}
 {#if review.request_note}<p class="mt-2 text-sm text-ink-soft">{review.request_note}</p>{/if}
 {#if review.advice_note}<p class="mt-2 text-sm text-ink-soft">Question : {review.advice_note}</p>{/if}
 {#if permissions.canPublish}<form method="POST" action="?/publier" class="mt-4"><input type="hidden" name="revision" value={review.revision}/><button class="bouton" type="submit">Publier</button></form>{/if}
 {#if permissions.canReview}<a class="bouton mt-4" href="#texte-article">Lire et corriger</a>{/if}
 {#if permissions.canSubmit}<p class="mt-2 text-sm text-ink-soft">Enregistrez votre texte, puis choisissez « Enregistrer et soumettre » quand il est prêt.</p>{/if}
 {#if remarks.length}<div class="mt-4 space-y-2">{#each remarks as h}<p class="rounded bg-surface-alt p-3 text-sm"><span class="font-semibold">{h.name}</span> : {h.note}</p>{/each}</div>{/if}
 {#if permissions.canReplyAdvice}<form method="POST" action="?/verifier" class="mt-4 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Votre avis<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><button class="bouton" name="decision" value="advice_reply">Donner mon avis</button></form>{/if}
 <div class="mt-4 flex flex-wrap items-start gap-4">
 {#if permissions.canComment}<details class="min-w-0 grow"><summary class="cursor-pointer text-sm font-semibold text-brand">Commenter</summary><form method="POST" action="?/verifier" class="mt-3 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Commentaire<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><button class="bouton-secondaire" name="decision" value="comment">Ajouter le commentaire</button></form></details>{/if}
 {#if permissions.canReview}<details class="min-w-0 grow"><summary class="cursor-pointer text-sm font-semibold text-brand">Demander des corrections</summary><form method="POST" action="?/verifier" class="mt-3 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Corrections attendues<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><p class="text-xs text-ink-soft">L'auteur pourra reprendre son texte, puis le soumettre à nouveau.</p><button class="bouton-secondaire" name="decision" value="corrections">Envoyer la demande</button></form></details>{/if}
 {#if (permissions.canReview && !review.requested_id) || (permissions.canAskAdvice && !review.advice_requested_id)}<details class="min-w-0 grow"><summary class="cursor-pointer text-sm font-semibold text-brand">Demander un autre avis</summary><form method="POST" action="?/verifier" class="mt-3 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Personne à solliciter<select class="champ mt-1" name="target" required><option value="">Choisir une personne</option>{#each admins.filter(a=>a.id!==actorId && (!permissions.canReview || a.id!==ownerId)) as a}<option value={a.id}>{a.name}</option>{/each}</select></label><label class="block text-sm">Votre question<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><button class="bouton-secondaire" name="decision" value={permissions.canReview?'request':'advice'}>Demander l'avis</button></form></details>{/if}
 </div>
 <details class="mt-4"><summary class="cursor-pointer text-xs text-ink-soft">Historique et priorité</summary>
 {#if permissions.canEdit}<form method="POST" action="?/verifier" class="my-3 flex flex-wrap items-end gap-2"><input type="hidden" name="revision" value={review.revision}/><label class="text-sm">Priorité<select class="champ" name="priority"><option value="0" selected={review.priority===0}>Normale</option><option value="1" selected={review.priority===1}>Prioritaire</option><option value="2" selected={review.priority===2}>Urgente</option></select></label><button class="bouton-secondaire" name="decision" value="priority">Enregistrer la priorité</button></form>{/if}
 {#each history as h}<p class="mt-2 text-xs text-ink-soft">{formatDateTime(h.created_at)} · {h.name} · {labels[h.action] ?? h.action} · Version {h.revision}{h.note?` : ${h.note}`:''}</p>{/each}
 </details>
</section>

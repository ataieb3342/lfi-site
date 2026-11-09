<script lang="ts">
 import type { Review, articleReviewPermissions, reviewHistory } from '$lib/server/reviews';
 import { formatDateTime } from '$lib/format';
 let {id,review,permissions,admins,actorId,ownerId,history,status,error=''}:{
 id:number;review:Review;permissions:ReturnType<typeof articleReviewPermissions>;
 admins:{id:number;name:string}[];actorId:number;ownerId:number|null;
 history:ReturnType<typeof reviewHistory>;status:string;error?:string;
 }=$props();
 const targetName=$derived(admins.find(a=>a.id===(review.requested_id ?? review.advice_requested_id))?.name ?? 'la personne sollicitée');
 const message=$derived(status==='published'?(review.author_approved_by && !review.reviewer_id?'Cet article est en ligne. Une nouvelle relecture est demandée.':'Cet article est publié.'):permissions.canPublish?'Votre article est validé. Vous pouvez le publier.':review.reviewer_id?(review.reviewer_id===actorId?'Vous avez validé cet article. Son auteur peut maintenant le publier.':'Cet article est validé. Son auteur peut le publier.'):review.requested_id?`En attente de l’avis de ${targetName}.`:permissions.canReplyAdvice?'Votre avis est demandé sur ce brouillon.':permissions.isAuthor&&review.author_approved_by?'Votre article attend une relecture.':permissions.canReview?'Cet article attend votre relecture.':permissions.canSubmit?'Votre article est en rédaction.':'Vous pouvez consulter cet article.');
 const remarks=$derived(history.filter(h=>['comment','corrections','advice_reply','reopen'].includes(h.action)).slice(0,3));
 const labels:Record<string,string>={author:'Soumission',approve:'Validation',comment:'Commentaire',corrections:'Corrections demandées',advice:'Avis demandé',advice_reply:'Avis reçu',request:'Autre avis demandé',priority:'Priorité modifiée',reopen:'Nouvelle relecture demandée'};
</script>
<section class="mb-6 rounded-lg border p-5 {permissions.canReview && !review.reviewer_id ? 'border-brand bg-brand-soft' : 'border-line'}" aria-label="Suivi de l'article">
 <h2 class="font-bold">{message}</h2>
 {#if error}<p class="alerte mt-3" role="alert">{error}</p>{/if}
 {#if review.request_note}<p class="mt-2 text-sm text-ink-soft">{review.request_note}</p>{/if}
 {#if review.advice_note}<p class="mt-2 text-sm text-ink-soft">Question : {review.advice_note}</p>{/if}
 {#if permissions.canPublish}<div class="mt-4"><button class="bouton" type="submit" form="publication-edit" formaction="?/enregistrerEtPublier">Publier</button><p class="mt-2 text-sm text-ink-soft">Enregistre vos dernières corrections et publie l’article.</p></div>{/if}
 {#if permissions.canReview}
 <div class="mt-4 flex flex-wrap items-center gap-3">
 {#if !review.reviewer_id}<button class="bouton review-primary" type="submit" form="publication-edit" formaction="?/enregistrerEtValider" aria-describedby="validation-help">Valider cet article</button>{/if}
 <a class="bouton-secondaire" href="#texte-article">Lire et corriger le texte</a>
 </div>
 {#if !review.reviewer_id}<p class="mt-2 text-sm text-ink-soft" id="validation-help">{status==='published'?'Enregistre vos corrections et termine la relecture. L’article reste en ligne.':"Enregistre vos corrections et autorise l'auteur à publier."}</p>{/if}
 {/if}
 {#if permissions.canSubmit}<p class="mt-2 text-sm text-ink-soft">Enregistrez votre texte, puis choisissez « Enregistrer et soumettre » quand il est prêt.</p>{/if}
 {#if status==='draft' && review.author_approved_by && permissions.canEdit}<p class="mt-2 text-sm text-ink-soft">Les corrections conservent les validations déjà données. Une nouvelle relecture peut être demandée si nécessaire.</p>{/if}
 {#if remarks.length}<div class="mt-4 space-y-2">{#each remarks as h}<p class="rounded bg-surface-alt p-3 text-sm"><span class="font-semibold">{h.name}</span> : {h.note}</p>{/each}</div>{/if}
 {#if permissions.canReplyAdvice}<form method="POST" action="?/verifier" class="mt-4 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Votre avis<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><button class="bouton" name="decision" value="advice_reply">Donner mon avis</button></form>{/if}

 {#if permissions.canRequestReview}<details class="mt-4"><summary class="cursor-pointer text-sm font-semibold text-brand">Demander une nouvelle relecture</summary><form method="POST" action="?/verifier" class="mt-3 space-y-3"><input type="hidden" name="revision" value={review.revision}/><label class="block text-sm">Ce qui doit être relu<textarea class="champ mt-1" name="note" maxlength="2000" required></textarea></label><p class="text-xs text-ink-soft">{status==='published'?'L’article reste en ligne pendant la relecture.':'La soumission est conservée. Une nouvelle validation sera nécessaire pour publier.'}</p><button class="bouton-secondaire" name="decision" value="reopen">Demander la relecture</button></form></details>{/if}
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

<style>
 .review-primary { padding:0.85rem 1.4rem; font-size:1rem; font-weight:800; }
 @media(max-width:520px) { .review-primary { width:100%; justify-content:center; } }
</style>

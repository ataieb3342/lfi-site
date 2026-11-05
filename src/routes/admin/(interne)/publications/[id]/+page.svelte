<script lang="ts">
	import { enhance } from '$app/forms';
	import FormulairePublication from '$lib/components/FormulairePublication.svelte';
	import { formatDateTime, lienPublication } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Après une erreur, on réaffiche ce qui venait d'être saisi ; sinon le
	// contenu enregistré en base.
	const valeurs = $derived(form && ('body' in form) ? { ...form } : { body: data.corps });
</script>

<svelte:head><title>{data.publication.title} - Administration</title></svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
	<div>
		<a class="text-sm font-semibold text-brand hover:underline" href="/admin/publications">← Publications</a>
		<h1 class="mt-1 text-2xl font-extrabold text-ink">Modifier</h1>
		<p class="mt-1 text-xs text-ink-faint">
			Adresse : <code class="rounded bg-surface-alt px-1"
				>{lienPublication(data.publication.kind, data.publication.slug)}</code
			>
			· Modifié {formatDateTime(data.publication.updatedAt)}
		</p>
	</div>
	<a class="bouton-secondaire" href={lienPublication(data.publication.kind, data.publication.slug)}>
		{data.publication.status === 'draft' ? 'Aperçu' : 'Voir en ligne'}
	</a>
</header>

{#if data.enregistre && !form}
	<!-- Le résultat de « Enregistrer et mettre à la une ». Le texte est
	     toujours enregistré ; seule la une a pu refuser la fiche. -->
	{#if data.une === 'ok'}
		<p class="alerte alerte-succes mb-6">
			Enregistré et mis à la une, {data.positionUne === 1
				? 'en grande fiche'
				: `en ${data.positionUne}ᵉ position`}.
			<a class="font-semibold underline" href="/admin/a-la-une">Ranger la une →</a>
		</p>
	{:else if data.une === 'brouillon'}
		<p class="alerte mb-6">
			Enregistré, mais pas mis à la une : c'est un brouillon. Passez l'état à « Publié », puis
			cliquez à nouveau sur « Enregistrer et mettre à la une ».
		</p>
	{:else if data.une === 'pleine'}
		<p class="alerte mb-6">
			Enregistré, mais pas mis à la une : elle est déjà pleine.
			<a class="font-semibold underline" href="/admin/a-la-une">Retirer une fiche de la une →</a>
		</p>
	{:else}
		<p class="alerte alerte-succes mb-6">Modifications enregistrées.</p>
	{/if}
{/if}

{#if data.publication.kind === 'article'}
<section class="mb-6 rounded-lg border border-line p-5">
 <h2 class="font-bold">Vérification de l'article</h2>
 <p class="my-3"><span class="rounded px-3 py-1 {data.review.requested_id ? 'bg-orange-100 text-orange-900' : data.review.reviewer_id ? 'bg-green-100 text-green-900' : data.review.author_approved_by ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-800'}">{data.reviewLabel}</span> · Version {data.review.revision}</p>
 <p class="text-sm">Enregistrez vos modifications avant de valider. Vous pouvez corriger le texte, enregistrer, puis valider directement. L'accord de l'auteur reste acquis ; la validation du relecteur doit être renouvelée après une modification.</p>
 {#if data.review.author_approved_at}<p class="mt-2 text-sm">Accord de l'auteur : {formatDateTime(data.review.author_approved_at)}</p>{/if}
 {#if data.review.requested_id}<p class="mt-2 text-sm">Avis demandé à {data.admins.find(a => a.id === data.review.requested_id)?.name ?? 'Compte indisponible'} : {data.review.request_note}</p>{/if}
 <form method="POST" action="?/verifier" class="mt-4 space-y-3">
 <input type="hidden" name="revision" value={data.review.revision} />
 <label class="block">Priorité <select name="priority" class="champ"><option value="0" selected={data.review.priority===0}>Normale</option><option value="1" selected={data.review.priority===1}>Prioritaire</option><option value="2" selected={data.review.priority===2}>Urgente</option></select></label>
 <button class="bouton-secondaire" name="decision" value="priority">Enregistrer la priorité</button>
 <label class="block">Commentaire<textarea name="note" class="champ" maxlength="2000"></textarea></label>
 <label class="block">Personne à solliciter<select name="target" class="champ"><option value="">Choisir une personne</option>{#each data.admins.filter(a => a.id !== data.adminCourant.id && a.id !== data.reviewAuthor) as admin}<option value={admin.id}>{admin.name}</option>{/each}</select></label>
 <div class="flex flex-wrap gap-2">
 {#if data.adminCourant.id===data.reviewAuthor}<button class="bouton" name="decision" value="author">Je valide mon texte</button>{:else if data.review.author_approved_by}
 <button class="bouton" name="decision" value="approve" disabled={!!data.review.requested_id && data.review.requested_id!==data.adminCourant.id}>Valider l'article</button>
 <button class="bouton-secondaire" name="decision" value="request" disabled={!!data.review.requested_id}>Demander un troisième avis</button>
 {/if}
 <button class="bouton-secondaire" name="decision" value="comment">Ajouter un commentaire</button>
 <button class="bouton-secondaire" name="decision" value="corrections">Demander des corrections</button>
 </div>
 </form>
 <details class="mt-4"><summary>Historique des vérifications</summary>{#each data.history as h}<p class="mt-2 text-sm">{formatDateTime(h.created_at)} · {h.name} · Version {h.revision} · {{comment:'Commentaire',author:'Accord de l’auteur',approve:'Validation',request:'Troisième avis demandé',corrections:'Corrections demandées',priority:'Priorité modifiée'}[h.action] ?? h.action}{h.note ? ` : ${h.note}` : ''}</p>{/each}</details>
</section>
{/if}

<form
	method="POST"
	action="?/enregistrer"
	enctype="multipart/form-data"
	use:enhance={({ action, formData }) => {
		// L'aperçu n'a pas besoin de l'image de couverture : on ne l'envoie pas.
		if (action.search === '?/apercu') {
			formData.delete('cover');
			formData.delete('eventMap');
		}
		return async ({ update }) => {
			// reset: false : les champs gardent ce qu'on vient de taper, et le
			// fichier choisi reste sélectionné.
			await update({ reset: false });
			if (action.search === '?/apercu') document.getElementById('apercu')?.scrollIntoView();
		};
	}}
>
	<FormulairePublication
		publication={data.publication}
        articleValidated={data.articleValidated}
		admins={data.admins}
		positionUne={data.positionUne}
		{valeurs}
		erreur={form?.erreur ?? ''}
		apercu={form?.apercu ?? ''}
		libelleValider="Enregistrer"
		actionUne="?/enregistrerEtUne"
	/>

	<label class="mt-4 flex items-start gap-2 text-sm text-ink">
		<input type="checkbox" name="regenererUrl" value="1" class="mt-0.5" />
		<span>
			Régénérer l'adresse à partir du nouveau titre
			<span class="block text-xs text-ink-faint">
				Les liens déjà partagés vers l'ancienne adresse cesseront de fonctionner.
			</span>
		</span>
	</label>
</form>

<section class="mt-10 rounded-lg border border-brand p-5">
	<h2 class="font-bold text-brand">Supprimer cette publication</h2>
	<p class="mt-1 text-sm text-ink-soft">
		La publication et ses {data.publication.commentCount} commentaire{data.publication.commentCount > 1
			? 's'
			: ''} seront définitivement effacés. Cette action est irréversible.
	</p>
	<details class="mt-3">
		<summary class="bouton-danger cursor-pointer list-none">Supprimer…</summary>
		<form method="POST" action="?/supprimer" class="mt-3">
			<p class="text-sm font-semibold text-ink">Confirmez-vous la suppression définitive ?</p>
			<button class="bouton-danger mt-2" type="submit">Oui, supprimer définitivement</button>
		</form>
	</details>
</section>

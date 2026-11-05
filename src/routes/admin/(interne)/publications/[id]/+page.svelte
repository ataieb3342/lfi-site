<script lang="ts">
	import ArticleReviewPanel from '$lib/components/ArticleReviewPanel.svelte';
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
		<h1 class="mt-1 text-2xl font-extrabold text-ink">{!data.permissions.canEdit ? 'Consulter' : data.publication.kind === 'article' && data.publication.status === 'draft' && !data.review.author_approved_by ? 'Rédaction' : 'Modifier'}</h1>
        {#if data.publication.kind === 'article'}<p class="mt-2 text-sm text-ink-soft">{data.publication.status === 'published' ? 'Rédaction → Vérification → Publication effectuée' : data.review.author_approved_by ? 'Rédaction terminée → Vérification → Publication' : 'Rédaction → Soumettre à validation → Vérification → Publication'}</p>{/if}
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
<ArticleReviewPanel id={data.publication.id} review={data.review} permissions={data.permissions} admins={data.admins} actorId={data.adminCourant.id} ownerId={data.reviewAuthor} history={data.history} status={data.publication.status} error={form?.erreur ?? ''}/>
{/if}

{#if data.permissions.canEdit}

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
	<input type="hidden" name="reviewRevision" value={data.review.revision}/>
    <div id="texte-article"></div>
	<FormulairePublication
		publication={data.publication}
        articleValidated={data.articleValidated}
        canSubmitArticle={data.permissions.canSubmit}
        canReviewArticle={data.permissions.canReview}
        articleWorkflow={data.publication.kind==='article'}
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


{:else}
<article class="carte" id="texte-article">
 <h2 class="text-2xl font-bold">{data.publication.title}</h2>
 {#if data.publication.summary}<p class="mt-3 text-ink-soft">{data.publication.summary}</p>{/if}
 <div class="contenu mt-6">{@html data.previewHtml}</div>
</article>
{/if}

{#if data.permissions.canEdit}

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

{/if}

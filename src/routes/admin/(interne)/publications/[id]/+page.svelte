<script lang="ts">
	import FormulairePublication from '$lib/components/FormulairePublication.svelte';
	import { formatDateTime, lienPublication } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Après une erreur, on réaffiche ce qui venait d'être saisi ; sinon le
	// contenu enregistré en base.
	const valeurs = $derived(form ? { ...form } : { body: data.corps });
</script>

<svelte:head><title>{data.publication.title} — Administration</title></svelte:head>

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
	<p class="alerte alerte-succes mb-6">Modifications enregistrées.</p>
{/if}

<form method="POST" action="?/enregistrer" enctype="multipart/form-data">
	<FormulairePublication
		publication={data.publication}
		{valeurs}
		erreur={form?.erreur ?? ''}
		libelleValider="Enregistrer"
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

<section class="mt-12 rounded-lg border border-brand p-5">
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

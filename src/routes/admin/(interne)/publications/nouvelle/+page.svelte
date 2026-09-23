<script lang="ts">
	import { enhance } from '$app/forms';
	import FormulairePublication from '$lib/components/FormulairePublication.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Nouvelle publication — Administration</title></svelte:head>

<header class="mb-6">
	<a class="text-sm font-semibold text-brand hover:underline" href="/admin/publications">← Publications</a>
	<h1 class="mt-1 text-2xl font-extrabold text-ink">Nouvelle publication</h1>
</header>

<form
	method="POST"
	action="?/creer"
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
		admins={data.admins}
		valeurs={form ?? {}}
		erreur={form?.erreur ?? ''}
		apercu={form?.apercu ?? ''}
		libelleValider="Créer la publication"
	/>
</form>

<script lang="ts">
	import FormulairePublication from '$lib/components/FormulairePublication.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Nouvelle publication — Administration</title></svelte:head>

<header class="mb-6">
	<a class="text-sm font-semibold text-brand hover:underline" href="/admin/publications">← Publications</a>
	<h1 class="mt-1 text-2xl font-extrabold text-ink">Nouvelle publication</h1>
</header>

<form method="POST" enctype="multipart/form-data">
	<FormulairePublication
		valeurs={form ?? {}}
		erreur={form?.erreur ?? ''}
		libelleValider="Créer la publication"
	/>
</form>

<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Page introuvable</title></svelte:head>

<div class="py-20 text-center">
	<p class="text-6xl font-extrabold text-brand">{page.status}</p>
	<h1 class="mt-4 text-2xl font-extrabold text-ink">{page.error?.message ?? 'Une erreur est survenue'}</h1>
	<p class="mt-3 text-ink-soft">La page demandée n'existe pas ou n'est plus disponible.</p>
	<a
		href="/"
		class="mt-8 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-sur-brand hover:bg-brand-dark"
		>Retour à l'accueil</a
	>
</div>

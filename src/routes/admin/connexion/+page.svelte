<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Connexion — Administration</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-sm py-8">
	<h1 class="text-2xl font-extrabold text-ink">Connexion</h1>
	<p class="mt-1 text-sm text-ink-soft">Espace réservé aux administrateurs du site.</p>

	{#if data.demo}
		<div class="mt-6 rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
			<p class="font-semibold">Compte de démonstration</p>
			<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
				<dt>Identifiant</dt>
				<dd><code class="font-mono">{data.demo.identifiant}</code></dd>
				<dt>Mot de passe</dt>
				<dd><code class="font-mono">{data.demo.motDePasse}</code></dd>
				<dt>Code du moment</dt>
				<dd><code class="font-mono text-base font-bold">{data.demo.code ?? '—'}</code></dd>
			</dl>
			<p class="mt-2 text-xs">
				Le code change toutes les 30 secondes : si la connexion échoue, rechargez cette page et recopiez le
				nouveau code.
			</p>
		</div>
	{/if}

	<form method="POST" class="mt-6 space-y-4">
		{#if form?.erreur}
			<p role="alert" class="alerte">{form.erreur}</p>
		{/if}

		<input type="hidden" name="suite" value={data.suite} />

		<div>
			<label class="etiquette" for="identifiant">Identifiant</label>
			<input
				id="identifiant"
				name="identifiant"
				class="champ"
				autocomplete="username"
				required
				value={form?.identifiant ?? data.demo?.identifiant ?? ''}
			/>
		</div>

		<div>
			<label class="etiquette" for="mot_de_passe">Mot de passe</label>
			<input
				id="mot_de_passe"
				name="mot_de_passe"
				type="password"
				class="champ"
				autocomplete="current-password"
				required
			/>
		</div>

		<div>
			<label class="etiquette" for="code">Code à 6 chiffres</label>
			<input
				id="code"
				name="code"
				class="champ"
				inputmode="numeric"
				autocomplete="one-time-code"
				pattern="[0-9]&#123;6&#125;"
				maxlength="6"
			/>
			<p class="aide">Depuis votre application d'authentification. Laissez vide à la première connexion.</p>
		</div>

		<button class="bouton w-full justify-center" type="submit">Se connecter</button>
	</form>
</div>

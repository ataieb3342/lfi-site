<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Installation — Administration</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-md py-8">
	<h1 class="text-2xl font-extrabold text-ink">Premier compte administrateur</h1>
	<p class="mt-2 text-sm text-ink-soft">
		Cette page n'existe que tant qu'aucun compte n'a été créé. Le jeton d'installation s'affiche
		dans les journaux du serveur au démarrage, et se trouve aussi dans le fichier
		<code class="rounded bg-surface-alt px-1">data/jeton-installation.txt</code>.
	</p>

	<form method="POST" class="mt-6 space-y-4">
		{#if form?.erreur}
			<p role="alert" class="alerte">{form.erreur}</p>
		{/if}

		<div>
			<label class="etiquette" for="jeton">Jeton d'installation</label>
			<input id="jeton" name="jeton" class="champ" required autocomplete="off" />
		</div>

		<hr class="border-line" />

		<div>
			<label class="etiquette" for="identifiant">Identifiant de connexion</label>
			<input
				id="identifiant"
				name="identifiant"
				class="champ"
				required
				autocomplete="username"
				value={form?.identifiant ?? ''}
			/>
			<p class="aide">3 à 32 caractères : lettres minuscules, chiffres, point, tiret, souligné.</p>
		</div>

		<div>
			<label class="etiquette" for="nom">Nom affiché</label>
			<input id="nom" name="nom" class="champ" required value={form?.nom ?? ''} />
		</div>

		<div>
			<label class="etiquette" for="mot_de_passe">Mot de passe</label>
			<input
				id="mot_de_passe"
				name="mot_de_passe"
				type="password"
				class="champ"
				required
				minlength="12"
				autocomplete="new-password"
			/>
			<p class="aide">
				12 caractères minimum. Une phrase de passe (quatre ou cinq mots sans rapport entre eux) est
				plus sûre et plus facile à retenir qu'un mot compliqué.
			</p>
		</div>

		<div>
			<label class="etiquette" for="confirmation">Confirmer le mot de passe</label>
			<input
				id="confirmation"
				name="confirmation"
				type="password"
				class="champ"
				required
				autocomplete="new-password"
			/>
		</div>

		<button class="bouton w-full justify-center" type="submit">Créer le compte</button>
	</form>
</div>

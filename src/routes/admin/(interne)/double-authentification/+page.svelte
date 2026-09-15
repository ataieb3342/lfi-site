<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Double authentification — Administration</title></svelte:head>

<div class="max-w-xl">
	<h1 class="text-2xl font-extrabold text-ink">Activer la double authentification</h1>
	<p class="mt-2 text-sm text-ink-soft">
		Obligatoire pour administrer le site. Sans elle, un mot de passe volé — par hameçonnage ou
		parce qu'il est réutilisé ailleurs — suffirait à prendre le contrôle du site.
	</p>

	<ol class="mt-6 space-y-6">
		<li class="carte">
			<h2 class="font-bold text-ink">1. Installez une application d'authentification</h2>
			<p class="mt-1 text-sm text-ink-soft">
				<strong>Aegis</strong> (Android) ou <strong>Tofu</strong> (iPhone) sont gratuites et
				fonctionnent hors ligne. Les gestionnaires de mots de passe comme Bitwarden ou Proton Pass
				savent aussi le faire.
			</p>
		</li>

		<li class="carte">
			<h2 class="font-bold text-ink">2. Scannez ce QR code</h2>
			<img src={data.qr} alt="QR code de configuration" class="mt-3 rounded bg-white p-2" width="240" height="240" />
			<p class="mt-3 text-sm text-ink-soft">Impossible de scanner ? Saisissez cette clé à la main :</p>
			<p class="mt-1 font-mono text-sm break-all text-ink select-all">{data.secretLisible}</p>
			<p class="aide">
				Ne partagez cette clé avec personne : elle permet de générer vos codes.
			</p>
		</li>

		<li class="carte">
			<h2 class="font-bold text-ink">3. Saisissez le code affiché</h2>
			<form method="POST" class="mt-3 space-y-3">
				{#if form?.erreur}<p role="alert" class="alerte">{form.erreur}</p>{/if}
				<div>
					<label class="etiquette" for="code">Code à 6 chiffres</label>
					<input
						id="code"
						name="code"
						class="champ font-mono text-lg tracking-widest"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength="6"
						required
					/>
				</div>
				<button class="bouton" type="submit">Activer</button>
			</form>
		</li>
	</ol>

	<p class="mt-6 text-sm text-ink-soft">
		Notez la clé sur un papier gardé en lieu sûr : si vous perdez votre téléphone sans elle, il
		faudra qu'un autre administrateur réinitialise votre accès.
	</p>
</div>

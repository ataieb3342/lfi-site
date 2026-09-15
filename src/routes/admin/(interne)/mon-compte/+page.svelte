<script lang="ts">
	import { formatDateTime, formatRelative } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Mon compte — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Mon compte</h1>
<p class="mt-1 text-sm text-ink-soft">
	{data.adminCourant.displayName} · @{data.adminCourant.username}
</p>

{#if form?.erreur}<p role="alert" class="alerte mt-4">{form.erreur}</p>{/if}
{#if data.enregistre && !form}<p class="alerte alerte-succes mt-4">C'est enregistré.</p>{/if}

<div class="mt-6 max-w-lg space-y-6">
	<section class="carte">
		<h2 class="font-bold text-ink">Changer de mot de passe</h2>
		<form method="POST" action="?/changerMotDePasse" class="mt-3 space-y-3">
			<div>
				<label class="etiquette" for="actuel">Mot de passe actuel</label>
				<input id="actuel" name="actuel" type="password" class="champ" required autocomplete="current-password" />
			</div>
			<div>
				<label class="etiquette" for="nouveau">Nouveau mot de passe</label>
				<input
					id="nouveau"
					name="nouveau"
					type="password"
					class="champ"
					required
					minlength="12"
					autocomplete="new-password"
				/>
				<p class="aide">
					12 caractères minimum. Une phrase de quatre mots choisis au hasard vaut mieux qu'un mot
					court truffé de symboles.
				</p>
			</div>
			<div>
				<label class="etiquette" for="confirmation">Confirmer</label>
				<input
					id="confirmation"
					name="confirmation"
					type="password"
					class="champ"
					required
					autocomplete="new-password"
				/>
			</div>
			<button class="bouton" type="submit">Changer le mot de passe</button>
		</form>
	</section>

	<section class="carte">
		<h2 class="font-bold text-ink">Double authentification</h2>
		<p class="mt-1 text-sm text-ink-soft">
			{data.adminCourant.totpEnabled ? 'Activée.' : 'À activer.'} Pour changer de téléphone, reconfigurez-la
			ci-dessous : vous serez déconnecté et l'écran d'activation s'affichera à la reconnexion.
		</p>
		<form method="POST" action="?/reconfigurer2fa" class="mt-3 space-y-3">
			<div>
				<label class="etiquette" for="mot_de_passe">Confirmez avec votre mot de passe</label>
				<input
					id="mot_de_passe"
					name="mot_de_passe"
					type="password"
					class="champ"
					required
					autocomplete="current-password"
				/>
			</div>
			<button class="bouton-secondaire" type="submit">Reconfigurer</button>
		</form>
	</section>

	<section class="carte">
		<h2 class="font-bold text-ink">Sessions ouvertes</h2>
		<ul class="mt-3 divide-y divide-line text-sm">
			{#each data.sessions as s (s.creeLe + s.navigateur)}
				<li class="py-2">
					<p class="text-ink">
						{s.courante ? 'Cette session' : 'Autre session'}
						<span class="text-ink-faint">· ouverte {formatRelative(s.creeLe)}</span>
					</p>
					<p class="text-xs break-all text-ink-faint">{s.navigateur || 'navigateur inconnu'}</p>
					<p class="text-xs text-ink-faint">Expire le {formatDateTime(s.expireLe)}</p>
				</li>
			{/each}
		</ul>
		{#if data.sessions.length > 1}
			<form method="POST" action="?/fermerAutresSessions" class="mt-3">
				<button class="bouton-danger" type="submit">Fermer toutes les autres sessions</button>
			</form>
		{/if}
	</section>
</div>

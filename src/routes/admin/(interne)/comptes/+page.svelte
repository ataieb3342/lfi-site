<script lang="ts">
	import { formatDate, formatRelative } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Comptes — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Comptes administrateurs</h1>
<p class="mt-1 text-sm text-ink-soft">
	Un compte par personne, jamais de compte partagé : c'est ce qui permet de savoir qui a fait quoi,
	et de couper un seul accès si un téléphone ou un ordinateur est perdu.
</p>

{#if form?.erreur}
	<p role="alert" class="alerte mt-4">{form.erreur}</p>
{/if}

{#if form?.creation}
	<div class="alerte alerte-succes mt-4">
		<p>
			Mot de passe provisoire pour <strong>{form.creation.username}</strong> :
		</p>
		<p class="mt-2 font-mono text-base break-all select-all">{form.creation.motDePasse}</p>
		<p class="mt-2 text-xs font-normal">
			Il ne sera plus jamais affiché. Transmettez-le de vive voix ou par un canal chiffré (Signal),
			jamais par courriel ni SMS. La personne devra le changer et activer la double
			authentification à sa première connexion.
		</p>
	</div>
{/if}

<section class="mt-6">
	<ul class="divide-y divide-line rounded-lg border border-line">
		{#each data.comptes as c (c.id)}
			<li class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
				<div class="min-w-0 grow">
					<p class="font-semibold text-ink">
						{c.displayName}
						<span class="font-normal text-ink-faint">@{c.username}</span>
						{#if c.role === 'owner'}
							<span class="ml-1 rounded bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand">Responsable</span>
						{/if}
						{#if c.desactive}
							<span class="ml-1 rounded bg-surface-alt px-1.5 py-0.5 text-xs font-bold text-ink-soft">Désactivé</span>
						{/if}
					</p>
					<p class="mt-0.5 text-xs text-ink-faint">
						Créé le {formatDate(c.creeLe)}
						{#if c.derniereConnexion}· dernière connexion {formatRelative(c.derniereConnexion)}{/if}
						· {c.totpActive ? 'double authentification active' : 'double authentification à activer'}
					</p>
				</div>

				<div class="flex flex-wrap gap-2">
					<form method="POST" action="?/reinitialiserMotDePasse">
						<input type="hidden" name="id" value={c.id} />
						<button class="bouton-secondaire" type="submit">Nouveau mot de passe</button>
					</form>
					{#if c.totpActive}
						<form method="POST" action="?/reinitialiser2fa">
							<input type="hidden" name="id" value={c.id} />
							<button class="bouton-secondaire" type="submit" title="En cas de téléphone perdu ou changé">
								Réinitialiser la 2FA
							</button>
						</form>
					{/if}
					{#if c.desactive}
						<form method="POST" action="?/reactiver">
							<input type="hidden" name="id" value={c.id} />
							<button class="bouton-secondaire" type="submit">Réactiver</button>
						</form>
					{:else if c.id !== data.adminCourant.id}
						<form method="POST" action="?/desactiver">
							<input type="hidden" name="id" value={c.id} />
							<button class="bouton-danger" type="submit">Désactiver</button>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</section>

<section class="carte mt-8 max-w-lg">
	<h2 class="font-bold text-ink">Ajouter un compte</h2>
	<form method="POST" action="?/creer" class="mt-3 space-y-3">
		<div>
			<label class="etiquette" for="username">Identifiant</label>
			<input id="username" name="username" class="champ" required />
			<p class="aide">3 à 32 caractères : minuscules, chiffres, point, tiret, souligné.</p>
		</div>
		<div>
			<label class="etiquette" for="displayName">Nom affiché</label>
			<input id="displayName" name="displayName" class="champ" required />
		</div>
		<div>
			<label class="etiquette" for="role">Rôle</label>
			<select id="role" name="role" class="champ">
				<option value="admin">Administrateur — publie et modère</option>
				<option value="owner">Responsable — gère aussi les comptes</option>
			</select>
		</div>
		<button class="bouton" type="submit">Créer le compte</button>
	</form>
</section>

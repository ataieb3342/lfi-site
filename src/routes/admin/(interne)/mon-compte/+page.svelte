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
		<h2 class="font-bold text-ink">Ma fiche publique</h2>
		<p class="mt-1 text-sm text-ink-soft">
			Elle reste invisible tant que vous ne choisissez pas de l'afficher sur la page « Qui sommes-nous ? ».
		</p>
		<form method="POST" action="?/enregistrerProfil" enctype="multipart/form-data" class="mt-4 space-y-3">
			<div>
				<label class="etiquette" for="nom">Nom ou pseudo public</label>
				<input id="nom" name="nom" class="champ" maxlength="80" value={data.profil.nom} />
			</div>
			<div>
				<label class="etiquette" for="role">Rôle dans le groupe</label>
				<input id="role" name="role" class="champ" maxlength="120" value={data.profil.role} />
			</div>
			<div>
				<label class="etiquette" for="emoji">Emoji</label>
				<input id="emoji" name="emoji" class="champ max-w-24" maxlength="16" value={data.profil.emoji} placeholder="🌱" />
			</div>
			<div>
				<label class="etiquette" for="bio">Courte présentation</label>
				<textarea id="bio" name="bio" class="champ" rows="5" maxlength="1200">{data.profil.bio}</textarea>
			</div>
			<div>
				<label class="etiquette" for="image">Image</label>
				{#if data.profil.image}
					<img src={data.profil.image} alt="Aperçu du portrait" class="mb-2 h-28 w-28 rounded-xl border border-line object-cover" />
					<label class="mb-2 flex items-center gap-2 text-sm text-ink-soft">
						<input type="checkbox" name="supprimer_image" value="1" /> Supprimer l'image actuelle
					</label>
				{/if}
				<input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="champ" />
				<p class="aide">JPEG, PNG, WebP, GIF ou AVIF, 5 Mo maximum.</p>
			</div>
			<label class="flex items-start gap-2 text-sm text-ink">
				<input type="checkbox" name="visible" value="1" checked={data.profil.visible} class="mt-0.5" />
				<span>Afficher ma fiche sur la page « Qui sommes-nous ? »</span>
			</label>
			<button class="bouton" type="submit">Enregistrer ma fiche</button>
		</form>
	</section>

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

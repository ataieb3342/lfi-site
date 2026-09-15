<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const r = $derived(data.reglages);
</script>

<svelte:head><title>Réglages — Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Réglages</h1>

{#if data.enregistre}
	<p class="alerte alerte-succes mt-4">Réglages enregistrés.</p>
{/if}

<form method="POST" class="mt-6 max-w-2xl space-y-6">
	<section class="carte space-y-4">
		<h2 class="font-bold text-ink">Identité du site</h2>

		<div>
			<label class="etiquette" for="site_name">Nom du site</label>
			<input id="site_name" name="site_name" class="champ" required value={r.site_name} />
		</div>

		<div>
			<label class="etiquette" for="site_tagline">Sous-titre</label>
			<input id="site_tagline" name="site_tagline" class="champ" value={r.site_tagline} />
			<p class="aide">Affiché en petit à côté du nom, dans l'en-tête.</p>
		</div>

		<div>
			<label class="etiquette" for="site_description">Phrase de présentation</label>
			<textarea id="site_description" name="site_description" class="champ" rows="2">{r.site_description}</textarea>
			<p class="aide">Sert de titre sur la page d'accueil et de description dans les moteurs de recherche.</p>
		</div>

		<div>
			<label class="etiquette" for="contact_email">Adresse de contact</label>
			<input id="contact_email" name="contact_email" type="email" class="champ" value={r.contact_email} />
			<p class="aide">Affichée en pied de page et sur la page « Nous rejoindre ». Laissez vide pour la masquer.</p>
		</div>
	</section>

	<section class="carte space-y-4">
		<h2 class="font-bold text-ink">Commentaires</h2>

		<label class="flex items-start gap-2 text-sm text-ink">
			<input type="checkbox" name="comments_enabled" value="1" checked={r.comments_enabled === '1'} class="mt-0.5" />
			<span>
				Autoriser les commentaires sur le site
				<span class="block text-xs text-ink-faint">
					Décocher ferme les commentaires partout d'un coup, sans toucher aux publications.
				</span>
			</span>
		</label>

		<fieldset>
			<legend class="etiquette">Mode de modération</legend>

			<label class="mt-1 flex items-start gap-2 text-sm text-ink">
				<input type="radio" name="comments_mode" value="pre" checked={r.comments_mode !== 'post'} class="mt-1" />
				<span>
					<strong>Relire avant publication</strong> (recommandé)
					<span class="block text-xs text-ink-faint">
						Rien n'apparaît en ligne sans validation. C'est le seul mode qui garantit qu'une insulte
						ou une attaque personnelle ne s'affiche jamais publiquement, même quelques minutes.
					</span>
				</span>
			</label>

			<label class="mt-3 flex items-start gap-2 text-sm text-ink">
				<input type="radio" name="comments_mode" value="post" checked={r.comments_mode === 'post'} class="mt-1" />
				<span>
					<strong>Publication immédiate</strong>
					<span class="block text-xs text-ink-faint">
						Les messages s'affichent aussitôt et doivent être surveillés. Ceux qui échouent à la
						vérification anti-robot restent malgré tout soumis à relecture.
					</span>
				</span>
			</label>
		</fieldset>
	</section>

	<section class="carte space-y-4">
		<h2 class="font-bold text-ink">Application Action populaire</h2>
		<p class="text-sm text-ink-soft">
			Un bandeau proposant d'installer l'application s'affiche au bas des pages d'actualités.
		</p>

		<label class="flex items-start gap-2 text-sm text-ink">
			<input
				type="checkbox"
				name="app_bandeau_actif"
				value="1"
				checked={r.app_bandeau_actif === '1'}
				class="mt-0.5"
			/>
			<span>Afficher le bandeau</span>
		</label>

		<div>
			<label class="etiquette" for="app_url_android">Lien Google Play</label>
			<input
				id="app_url_android"
				name="app_url_android"
				type="url"
				class="champ"
				placeholder="https://play.google.com/store/apps/details?id=..."
				value={r.app_url_android}
			/>
			<p class="aide">
				Ouvrez la fiche de l'application dans le Play Store et copiez l'adresse. Seules les
				adresses commençant par <code>https://</code> sont acceptées.
			</p>
		</div>

		<div>
			<label class="etiquette" for="app_url_ios">Lien App Store</label>
			<input
				id="app_url_ios"
				name="app_url_ios"
				type="url"
				class="champ"
				placeholder="https://apps.apple.com/fr/app/..."
				value={r.app_url_ios}
			/>
			<p class="aide">
				Facultatif. Tant que les deux champs sont vides, le bandeau renvoie vers le site
				actionpopulaire.fr.
			</p>
		</div>
	</section>

	<button class="bouton" type="submit">Enregistrer</button>
</form>

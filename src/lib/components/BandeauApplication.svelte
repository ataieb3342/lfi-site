<script lang="ts">
	/**
	 * Invitation à installer Action populaire, la plateforme de mobilisation du
	 * mouvement, affichée au bas des pages d'actualités : c'est là que le
	 * visiteur vient chercher les prochains rendez-vous, donc le moment où lui
	 * proposer l'application a du sens.
	 *
	 * Le bandeau reprend l'identité de l'application (jaune et bleu nuit) et non
	 * celle du site. C'est délibéré : il renvoie vers un autre produit, et ce
	 * contraste avec le reste de la page le fait remarquer.
	 *
	 * Ces deux couleurs sont écrites en dur plutôt que prises dans les jetons du
	 * site : elles ne doivent changer ni avec le thème sombre, ni si l'on
	 * retouche la palette du site.
	 *
	 * Les adresses viennent des réglages. Quand aucune n'est renseignée, le
	 * bandeau renvoie vers le site d'Action populaire plutôt que d'afficher des
	 * boutons morts.
	 */
	let {
		actif = true,
		android = '',
		ios = '',
		/** Faux quand le bandeau sert de diapositive : il perd sa marge et remplit
		    la hauteur de la diapositive. */
		autonome = true
	}: { actif?: boolean; android?: string; ios?: string; autonome?: boolean } = $props();

	const SITE = 'https://actionpopulaire.fr';

	const boutons = $derived(
		[
			{ href: android, label: 'Google Play', detail: 'Android' },
			{ href: ios, label: 'App Store', detail: 'iPhone' }
		].filter((b) => b.href)
	);
</script>

{#if actif}
	<section
		class="relative flex flex-col justify-center overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12
			{autonome ? 'mt-16' : 'h-full'}"
		style="background-color: #f0e80d; color: #0b0b33;"
	>

		<div class="relative grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
			<div>
				<p class="flex items-center gap-2.5 text-xs font-bold tracking-[0.2em] uppercase opacity-80">
					<!-- L'épingle de l'application, en petit et en pleines couleurs : c'est
					     ce qui permet de la reconnaître d'un coup d'œil. -->
					<svg class="h-7 w-7 shrink-0" viewBox="0 0 40 36" aria-hidden="true">
						<path
							fill="#ffffff"
							d="M23.5 3.5c-5.4 0-9.8 4.4-9.8 9.8 0 7.3 9.8 17.7 9.8 17.7s9.8-10.4 9.8-17.7c0-5.4-4.4-9.8-9.8-9.8z"
						/>
						<path
							fill="none"
							stroke="#0b0b33"
							stroke-width="3.4"
							d="M16.2 4.2c-5.4 0-9.8 4.4-9.8 9.8 0 7.3 9.8 17.7 9.8 17.7S26 21.3 26 14c0-5.4-4.4-9.8-9.8-9.8z"
						/>
					</svg>
					Action populaire
				</p>
				<h2 class="titre-affiche mt-2 text-2xl sm:text-3xl">Toutes nos actions dans votre poche</h2>
				<p class="mt-4 max-w-lg leading-relaxed opacity-80">
					La plateforme du mouvement rassemble les événements près de chez vous et les groupes
					d'action de votre ville. De quoi participer sans dépendre des réseaux sociaux.
				</p>
			</div>

			<div class="flex flex-wrap gap-3">
				{#each boutons as bouton (bouton.label)}
					<a
						href={bouton.href}
						rel="noopener noreferrer"
						target="_blank"
						class="flex items-center gap-3 rounded-full px-5 py-3 font-bold transition-opacity hover:opacity-85"
						style="background-color: #0b0b33; color: #f0e80d;"
					>
						<svg
							class="h-5 w-5 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M12 3v12" />
							<path d="m7 10 5 5 5-5" />
							<path d="M4 20h16" />
						</svg>
						<span class="leading-tight">
							<span class="block text-sm">{bouton.label}</span>
							<span class="block text-xs font-semibold opacity-70">{bouton.detail}</span>
						</span>
					</a>
				{:else}
					<a
						href={SITE}
						rel="noopener noreferrer"
						target="_blank"
						class="rounded-full px-5 py-3 font-bold transition-opacity hover:opacity-85"
						style="background-color: #0b0b33; color: #f0e80d;"
					>
						Découvrir Action populaire
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

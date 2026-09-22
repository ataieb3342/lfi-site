<script lang="ts">
	import Encart from './Encart.svelte';

	/**
	 * Invitation à installer Action populaire, la plateforme de mobilisation du
	 * mouvement, affichée en tête de la liste des actualités, au bas de chaque
	 * actualité et au bas de l'accueil : c'est là que le visiteur vient chercher
	 * les prochains rendez-vous, donc le moment où lui proposer l'application a
	 * du sens. Sur l'accueil il est tout en bas, jamais en tête : on propose
	 * d'installer quelque chose à quelqu'un qui a lu la page, pas à quelqu'un qui
	 * arrive.
	 *
	 * C'est un encart ordinaire (voir Encart.svelte), au même gabarit que ceux des
	 * articles et de la revue de presse — mais il garde les couleurs de
	 * l'application (jaune et bleu nuit) et non celles du site. C'est délibéré :
	 * il renvoie vers un autre produit, et ce contraste avec le reste de la page
	 * le fait remarquer.
	 *
	 * Ces deux couleurs sont écrites en dur plutôt que prises dans les jetons du
	 * site : elles ne doivent changer ni avec le thème sombre, ni si l'on
	 * retouche la palette du site.
	 *
	 * Les adresses viennent des réglages. Quand aucune n'est renseignée, le
	 * bandeau renvoie vers le site d'Action populaire plutôt que d'afficher des
	 * boutons morts. C'est vrai des deux formes : `compact` est une bande d'une
	 * seule ligne pour la tête de la liste des actualités, mais elle mène aux
	 * mêmes magasins. Une variante qui ignorerait `android` et `ios` viderait
	 * les réglages de leur effet sans que personne ne s'en aperçoive.
	 */
	let {
		actif = true,
		android = '',
		ios = '',
		compact = false
	}: { actif?: boolean; android?: string; ios?: string; compact?: boolean } = $props();

	const SITE = 'https://actionpopulaire.fr';

	const boutons = $derived(
		[
			{ href: android, label: 'Google Play', detail: 'Android' },
			{ href: ios, label: 'App Store', detail: 'iPhone' }
		].filter((b) => b.href)
	);
</script>

{#if actif}
	{#if compact}
		<aside
			class="mt-5 flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
			style="background-color: #f0e80d; color: #0b0b33;"
			aria-label="Action populaire"
		>
			<p class="text-sm leading-snug">
				<strong>Vous participez à un rendez-vous ?</strong>
				Pensez à vous inscrire sur Action populaire pour nous prévenir de votre présence.
			</p>
			<div class="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
				{#if boutons.length}
					{#each boutons as bouton (bouton.href)}
						<a
							href={bouton.href}
							rel="noopener noreferrer"
							target="_blank"
							class="rounded-full px-4 py-2 text-sm font-bold"
							style="background-color: #0b0b33; color: #f0e80d;"
							>{bouton.label} ↗</a
						>
					{/each}
				{:else}
					<a
						href={SITE}
						rel="noopener noreferrer"
						target="_blank"
						class="rounded-full px-4 py-2 text-sm font-bold"
						style="background-color: #0b0b33; color: #f0e80d;"
						>Action populaire ↗</a
					>
				{/if}
			</div>
		</aside>
	{:else}
	<Encart
		sureligne="Action populaire"
		titre="Toutes nos actions dans votre poche"
		texte="Les événements et les groupes d'action près de chez vous, sans passer par les réseaux sociaux. Pensez à vous inscrire sur Action populaire pour nous prévenir de votre présence !"
		surface=""
		style="background-color: #f0e80d; color: #0b0b33;"
	>
		{#snippet icone()}
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
		{/snippet}

		{#snippet actions()}
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
		{/snippet}
	</Encart>
	{/if}
{/if}

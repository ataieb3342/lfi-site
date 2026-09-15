<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const liens = [
		{ href: '/', label: 'Accueil' },
		{ href: '/articles', label: 'Articles' },
		{ href: '/actualites', label: 'Actualités' },
		{ href: '/le-groupe', label: 'Le groupe' },
		{ href: '/nous-rejoindre', label: 'Nous rejoindre' }
	];

	function actif(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	const annee = new Date().getFullYear();
</script>

<a class="skip-link" href="#contenu-principal">Aller au contenu</a>

{#if data.demo}
	<!-- Site de démonstration : tout ce qui est publié ici est fictif. -->
	<div class="bg-amber-300 text-sm text-amber-950">
		<p class="mx-auto max-w-5xl px-4 py-2">
			<strong>Site de démonstration.</strong> Les articles, actualités et commentaires sont fictifs.
			L'espace d'administration est ouvert à l'essai :
			<a class="font-semibold underline underline-offset-2" href="/admin">essayez-le</a>.
		</p>
	</div>
{/if}

{#if data.admin}
	<!-- Bandeau visible uniquement pour un administrateur connecté. -->
	<div class="bg-ink text-surface text-sm">
		<div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
			<span class="opacity-70">Connecté·e comme <strong>{data.admin.displayName}</strong></span>
			<a class="underline underline-offset-2 hover:text-brand" href="/admin">Administration</a>
			<form method="POST" action="/admin/deconnexion" class="ml-auto">
				<button class="underline underline-offset-2 hover:text-brand" type="submit">Se déconnecter</button>
			</form>
		</div>
	</div>
{/if}

<!-- Filet aux couleurs du mouvement, présent sur toutes les pages. -->
<div class="filet-degrade h-1" aria-hidden="true"></div>

<header class="border-b border-line bg-surface">
	<div class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
		<a href="/" class="flex items-center gap-3 no-underline">
			<Logo class="h-10 w-auto shrink-0" />
			<span class="leading-tight">
				<span class="block text-lg font-extrabold tracking-tight text-ink">{data.settings.siteName}</span>
				<span class="mt-0.5 block text-xs font-medium text-ink-faint">{data.settings.tagline}</span>
			</span>
		</a>

		<!-- Navigation bureau -->
		<nav class="ml-auto hidden md:block" aria-label="Navigation principale">
			<ul class="flex items-center gap-1">
				{#each liens as lien (lien.href)}
					<li>
						<a
							href={lien.href}
							aria-current={actif(lien.href) ? 'page' : undefined}
							class="block rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors
								{actif(lien.href)
								? 'bg-brand-soft text-brand'
								: 'text-ink-soft hover:bg-surface-alt hover:text-ink'}">{lien.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- Navigation mobile : un <details>, donc aucun JavaScript nécessaire -->
		<details class="relative ml-auto md:hidden">
			<summary
				class="cursor-pointer list-none rounded border border-line px-3 py-2 text-sm font-semibold text-ink"
				aria-label="Ouvrir le menu">Menu</summary
			>
			<nav
				class="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-lg"
				aria-label="Navigation principale"
			>
				<ul>
					{#each liens as lien (lien.href)}
						<li>
							<a
								href={lien.href}
								aria-current={actif(lien.href) ? 'page' : undefined}
								class="block rounded px-3 py-2 text-sm font-semibold
									{actif(lien.href) ? 'bg-brand-soft text-brand' : 'text-ink-soft'}">{lien.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
		</details>
	</div>
</header>

<main id="contenu-principal" class="mx-auto min-h-[60vh] max-w-5xl px-4 py-10">
	{@render children()}
</main>

<footer class="fond-degrade-sombre mt-16">
	<div class="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3">
		<div class="sm:col-span-2">
			<div class="flex items-center gap-3">
				<Logo variante="mono" class="h-10 w-auto shrink-0 text-white" />
				<p class="text-lg font-extrabold tracking-tight text-white">{data.settings.siteName}</p>
			</div>
			<p class="mt-4 max-w-md text-sm text-white/75">
				Site d'un groupe d'action local de La France insoumise. Les contenus publiés ici
				n'engagent que ce groupe et ne constituent pas une communication officielle du mouvement.
			</p>
			{#if data.settings.contactEmail}
				<p class="mt-3 text-sm">
					<a class="font-semibold text-white underline underline-offset-2" href="mailto:{data.settings.contactEmail}"
						>{data.settings.contactEmail}</a
					>
				</p>
			{/if}
		</div>
		<nav aria-label="Pied de page">
			<ul class="space-y-2 text-sm text-white/80">
				<li><a class="hover:text-white hover:underline" href="/nous-rejoindre">Nous rejoindre</a></li>
				<li><a class="hover:text-white hover:underline" href="/rss.xml">Flux RSS</a></li>
				<li><a class="hover:text-white hover:underline" href="/mentions-legales">Mentions légales</a></li>
				<li><a class="hover:text-white hover:underline" href="/confidentialite">Confidentialité</a></li>
				<li><a class="hover:text-white hover:underline" href="/admin">Administration</a></li>
			</ul>
		</nav>
	</div>
	<div class="border-t border-white/15">
		<p class="mx-auto max-w-5xl px-4 py-4 text-xs text-white/60">
			© {annee} — Ce site ne dépose aucun cookie de mesure d'audience et n'utilise aucun service tiers.
		</p>
	</div>
</footer>

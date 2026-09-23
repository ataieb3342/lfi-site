<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const groupesNavigation = [
		{
			href: '/actualites',
			label: 'Actualités',
			liens: [
				{ href: '/agenda', label: 'Agenda' },
				{ href: '/aperos', label: 'Apéros' },
				{ href: '/actualites?categorie=action', label: 'Actions' },
				{ href: '/actualites?categorie=reunion', label: 'Événements' },
				{ href: '/actualites?categorie=formation', label: 'Formations' },
				{ href: '/articles', label: 'Articles' },
				{ href: '/revue-de-presse', label: 'Revue de presse' }
			]
		},
		{
			href: '/bibliotheque',
			label: 'Ressources',
			liens: [
				{ href: '/bibliotheque', label: 'Bibliothèque' },
				{ href: '/boite-a-outils', label: 'Boîte à outils' },
				{ href: '/jeux', label: 'Jeux' }
			]
		}
	];

	function actif(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	const annee = new Date().getFullYear();

	// Le menu mobile est un <details> : il reste ouvert tant qu'on ne le ferme
	// pas. Comme le site navigue sans recharger la page, on le referme nous-mêmes
	// une fois arrivé sur la page choisie.
	let menu = $state<HTMLDetailsElement | null>(null);
	let menusBureau = $state<HTMLDetailsElement[]>([]);
	afterNavigate(() => {
		if (menu) menu.open = false;
		for (const menuBureau of menusBureau) menuBureau.open = false;
	});

	function enregistrerMenu(element: HTMLDetailsElement, index: number) {
		menusBureau[index] = element;
		return {
			destroy() {
				menusBureau = menusBureau.filter((menuBureau) => menuBureau !== element);
			}
		};
	}

	function fermerAutres(index: number) {
		if (!menusBureau[index]?.open) return;
		menusBureau.forEach((element, autreIndex) => {
			if (autreIndex !== index) element.open = false;
		});
	}

	const affichages = [
		{ valeur: 'auto', label: 'Automatique' },
		{ valeur: 'clair', label: 'Clair' },
		{ valeur: 'sombre', label: 'Sombre' }
	] as const;
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

<header class="border-b border-line bg-carte">
	<div class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
		<a href="/" class="flex items-center gap-3 no-underline">
			<Logo class="h-10 w-auto shrink-0" />
			<span class="leading-tight">
				<span class="block text-lg font-extrabold tracking-tight text-ink">{data.settings.siteName}</span>
				<!-- Le sous-titre est masqué sur mobile : à côté du logo et du bouton
				     de menu, il se coupait sur deux lignes serrées. -->
				<span class="mt-0.5 hidden text-xs font-medium text-ink-faint sm:block">{data.settings.tagline}</span>
			</span>
		</a>

		<!-- Navigation bureau -->
		<nav class="ml-auto hidden md:block" aria-label="Navigation principale">
			<ul class="flex items-center gap-1">
				{#each groupesNavigation as groupe, index (groupe.href)}
					<li>
						<div class="flex items-center rounded-full {actif(groupe.href) ? 'bg-brand-soft text-brand' : ''}">
							<a
								href={groupe.href}
								aria-current={actif(groupe.href) ? 'page' : undefined}
								class="rounded-l-full py-1.5 pr-1 pl-3 text-sm font-semibold
									{actif(groupe.href) ? '' : 'text-ink-soft hover:text-ink'}">{groupe.label}</a
							>
							<details
								class="navigation-deroulante relative"
								use:enregistrerMenu={index}
								ontoggle={() => fermerAutres(index)}
							>
								<summary
									class="grid cursor-pointer list-none place-items-center rounded-r-full py-2 pr-3 pl-1
										{actif(groupe.href) ? '' : 'text-ink-soft hover:text-ink'}"
									aria-label="Ouvrir le menu {groupe.label}"
								>
									<svg class="h-3.5 w-3.5 transition-transform" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
										<path d="m5 7 5 5 5-5" />
									</svg>
								</summary>
								<ul class="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-carte p-2 shadow-lg">
									{#each groupe.liens as lien (lien.href)}
										<li>
											<a class="block rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-alt hover:text-ink" href={lien.href}>{lien.label}</a>
										</li>
									{/each}
								</ul>
							</details>
						</div>
					</li>
				{/each}
				<li>
					<a
						href="/le-groupe"
						aria-current={actif('/le-groupe') ? 'page' : undefined}
						class="block rounded-full px-3 py-1.5 text-sm font-semibold transition-colors
							{actif('/le-groupe') ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'}"
						>Qui sommes-nous ?</a
					>
				</li>
				<li class="ml-1">
					<a href="/nous-rejoindre" class="bouton px-4 py-1.5 text-sm">Nous rejoindre</a>
				</li>
			</ul>
		</nav>

		<!-- Navigation mobile : un <details>, donc aucun JavaScript nécessaire -->
		<details class="relative ml-auto md:hidden" bind:this={menu}>
			<summary
				class="cursor-pointer list-none rounded border border-line-forte px-3 py-2 text-sm font-semibold text-ink"
				>Menu</summary
			>
			<nav
				class="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-line bg-carte p-2 shadow-lg"
				aria-label="Navigation principale"
			>
				<ul class="space-y-2">
					{#each groupesNavigation as groupe (groupe.href)}
						<li class="border-t border-line pt-2">
							<a class="block rounded px-3 py-2 font-bold text-ink" href={groupe.href}>{groupe.label}</a>
							<ul class="ml-3 border-l border-line pl-2">
								{#each groupe.liens as lien (lien.href)}
									<li><a class="block rounded px-3 py-1.5 text-sm text-ink-soft" href={lien.href}>{lien.label}</a></li>
								{/each}
							</ul>
						</li>
					{/each}
					<li class="border-t border-line pt-2"><a class="block rounded px-3 py-2 font-bold text-ink" href="/le-groupe">Qui sommes-nous ?</a></li>
					<li><a class="bouton mt-1 w-full justify-center" href="/nous-rejoindre">Nous rejoindre</a></li>
				</ul>
			</nav>
		</details>
	</div>
</header>

<main id="contenu-principal" class="mx-auto min-h-[60vh] max-w-5xl px-4 py-6">
	{@render children()}
</main>

<!-- Pas de marge haute : le rembourrage bas de `<main>` fait déjà l'écart, et
     le passage à une surface sombre marque la rupture à lui seul. -->
<footer class="fond-degrade-sombre">
	<div class="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:grid-cols-3">
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
				<li><a class="hover:text-white hover:underline" href="/le-groupe">Qui sommes-nous ?</a></li>
				<li><a class="hover:text-white hover:underline" href="/nous-rejoindre">Nous rejoindre</a></li>
				<li><a class="hover:text-white hover:underline" href="/revue-de-presse">Revue de presse</a></li>
				<li><a class="hover:text-white hover:underline" href="/bibliotheque">Bibliothèque</a></li>
				<li><a class="hover:text-white hover:underline" href="/boite-a-outils">Boîte à outils</a></li>
				<li><a class="hover:text-white hover:underline" href="/jeux">Jeux</a></li>
				<li><a class="hover:text-white hover:underline" href="/rss.xml">Flux RSS</a></li>
				<li><a class="hover:text-white hover:underline" href="/mentions-legales">Mentions légales</a></li>
				<li><a class="hover:text-white hover:underline" href="/confidentialite">Confidentialité</a></li>
				<li><a class="hover:text-white hover:underline" href="/admin">Administration</a></li>
			</ul>

			<!-- Choix d'affichage. Un formulaire ordinaire : le serveur pose un
			     cookie et renvoie sur la même page, sans JavaScript. -->
			<form method="POST" action="/theme" class="mt-6">
				<p id="affichage-titre" class="text-sm font-semibold text-white/80">Affichage</p>
				<div class="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="affichage-titre">
					{#each affichages as a (a.valeur)}
						<button
							type="submit"
							name="theme"
							value={a.valeur}
							aria-pressed={data.theme === a.valeur}
							class="rounded-full border px-3 py-1 text-sm font-semibold transition-colors
								{data.theme === a.valeur
								? 'border-white bg-white text-[#1a0f2e]'
								: 'border-white/40 text-white/85 hover:border-white hover:text-white'}">{a.label}</button
						>
					{/each}
				</div>
			</form>
		</nav>
	</div>
	<div class="border-t border-white/15">
		<p class="mx-auto max-w-5xl px-4 py-4 text-xs text-white/60">
			© {annee} — Ce site ne dépose aucun cookie de mesure d'audience.
		</p>
	</div>
</footer>

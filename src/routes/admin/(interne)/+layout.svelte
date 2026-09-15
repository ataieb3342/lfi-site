<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const liens = $derived([
		{ href: '/admin', label: 'Tableau de bord', exact: true },
		{ href: '/admin/publications', label: 'Publications' },
		{ href: '/admin/commentaires', label: 'Commentaires', badge: data.commentairesEnAttente },
		{ href: '/admin/medias', label: 'Images' },
		...(data.adminCourant.role === 'owner' ? [{ href: '/admin/comptes', label: 'Comptes' }] : []),
		{ href: '/admin/reglages', label: 'Réglages' },
		{ href: '/admin/mon-compte', label: 'Mon compte' }
	]);

	function actif(lien: { href: string; exact?: boolean }): boolean {
		return lien.exact ? page.url.pathname === lien.href : page.url.pathname.startsWith(lien.href);
	}
</script>

<div class="grid gap-8 lg:grid-cols-[13rem_1fr]">
	<nav aria-label="Administration">
		<p class="mb-3 text-xs font-bold tracking-wide text-ink-faint uppercase">Administration</p>
		<ul class="flex flex-wrap gap-1 lg:block lg:space-y-1">
			{#each liens as lien (lien.href)}
				<li>
					<a
						href={lien.href}
						aria-current={actif(lien) ? 'page' : undefined}
						class="flex items-center justify-between gap-2 rounded px-3 py-2 text-sm font-semibold
							{actif(lien) ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'}"
					>
						{lien.label}
						{#if lien.badge}
							<span class="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{lien.badge}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="min-w-0">
		{@render children()}
	</div>
</div>

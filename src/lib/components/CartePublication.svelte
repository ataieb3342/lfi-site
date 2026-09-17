<script lang="ts">
	import { COULEUR_KIND, formatDate, formatDateCourte, LIBELLE_KIND, lienPublication } from '$lib/format';
	import type { PublicationVue } from '$lib/types';

	let { publication, avecImage = true }: { publication: PublicationVue; avecImage?: boolean } = $props();

	const lien = $derived(lienPublication(publication.kind, publication.slug));
</script>

<article class="group flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:gap-5">
	{#if avecImage && publication.cover}
		<a href={lien} class="shrink-0" tabindex="-1" aria-hidden="true">
			<img
				src={publication.cover.url}
				alt=""
				loading="lazy"
				class="h-24 w-full rounded-lg object-cover sm:w-36"
			/>
		</a>
	{/if}

	<div class="min-w-0 flex-1">
		<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
			<span class="font-semibold tracking-wide uppercase {COULEUR_KIND[publication.kind]}">
				{LIBELLE_KIND[publication.kind]}
			</span>
			{#if publication.pinned}
				<span class="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">Épinglé</span>
			{/if}
			{#if publication.eventAt && publication.aVenir}
				<span class="rounded bg-accent-soft px-1.5 py-0.5 font-semibold text-accent-dark">
					{formatDateCourte(publication.eventAt)}
				</span>
			{:else if publication.eventAt}
				<span class="rounded bg-surface-alt px-1.5 py-0.5 font-semibold text-ink-faint">
					Action passée
				</span>
			{/if}
			{#if publication.status === 'draft'}
				<span class="rounded bg-surface-alt px-1.5 py-0.5 font-semibold text-ink-soft">Brouillon</span>
			{/if}
			<span>·</span>
			<time datetime={publication.publishedAt ?? undefined}>{formatDate(publication.publishedAt)}</time>
		</p>

		<h2 class="mt-1 text-lg font-bold text-ink sm:text-xl">
			<a href={lien} class="hover:text-brand hover:underline underline-offset-4">{publication.title}</a>
		</h2>

		{#if publication.summary}
			<p class="mt-1.5 line-clamp-3 text-sm text-ink-soft">{publication.summary}</p>
		{/if}

		{#if publication.authorName || publication.commentCount > 0}
			<p class="mt-2 text-xs text-ink-faint">
				{#if publication.authorName}{publication.authorName}{/if}
				{#if publication.authorName && publication.commentCount > 0} · {/if}
				{#if publication.commentCount > 0}
					{publication.commentCount}
					{publication.commentCount > 1 ? 'commentaires' : 'commentaire'}
				{/if}
			</p>
		{/if}
	</div>
</article>

<script lang="ts">
	import { enhance } from '$app/forms';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import PreuveDeTravail from '$lib/components/PreuveDeTravail.svelte';
	import { COULEUR_KIND, formatDate, formatDateLongue, formatDateTime, LIBELLE_KIND } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const p = $derived(data.publication);
	let envoiEnCours = $state(false);

	// Cadre des apéros (heure, lieu), affiché sous le titre d'un apéro.
	const cadre = $derived(data.apero);
	const lieuComplet = $derived([cadre.lieu, cadre.adresse].filter(Boolean).join(', '));
</script>

<svelte:head>
	<title>{p.title} — {data.settings.siteName}</title>
	<meta name="description" content={data.resume} />
	<meta property="og:title" content={p.title} />
	<meta property="og:description" content={data.resume} />
	<meta property="og:type" content="article" />
	{#if p.cover}<meta property="og:image" content={p.cover.url} />{/if}
</svelte:head>

{#if data.apercu}
	<p class="mb-6 rounded border border-accent bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
		Aperçu d'un brouillon : cette page n'est pas visible du public.
	</p>
{/if}

{#if p.kind === 'apero'}
	<p class="mb-6 text-sm">
		<a class="font-semibold text-brand hover:underline" href="/aperos">← Tous les apéros</a>
	</p>
{/if}

<article>
	<header class="border-b border-line pb-6">
		<p class="text-xs font-semibold tracking-wide uppercase {COULEUR_KIND[p.kind]}">{LIBELLE_KIND[p.kind]}</p>
		<h1 class="mt-2 text-3xl leading-tight font-extrabold text-ink sm:text-4xl">{p.title}</h1>
		<p class="mt-3 text-sm text-ink-faint">
			<time datetime={p.publishedAt ?? undefined}>{formatDate(p.publishedAt)}</time>
			{#if p.authorName} · {p.authorName}{/if}
		</p>
		{#if p.summary}
			<p class="mt-4 max-w-2xl text-lg text-ink-soft">{p.summary}</p>
		{/if}

		{#if p.eventAt && p.kind === 'apero'}
			<!-- Un apéro : la date complète, l'heure et le lieu habituels (réglages). -->
			<p
				class="mt-5 inline-flex flex-wrap items-center gap-x-2 rounded-lg px-4 py-2.5 text-sm font-bold
					{p.aVenir ? 'bg-accent-soft text-accent-dark' : 'bg-surface-alt text-ink-faint'}"
			>
				{#if p.aVenir}
					<span>Rendez-vous le <time datetime={p.eventAt}>{formatDateLongue(p.eventAt)}</time>{cadre.heure ? ` à ${cadre.heure}` : ''}</span>
				{:else}
					<span>Cet apéro a eu lieu le <time datetime={p.eventAt}>{formatDateLongue(p.eventAt)}</time></span>
				{/if}
				{#if lieuComplet}<span aria-hidden="true">·</span><span class="font-semibold">{lieuComplet}</span>{/if}
			</p>
		{:else if p.eventAt}
			<p
				class="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold
					{p.aVenir ? 'bg-accent-soft text-accent-dark' : 'bg-surface-alt text-ink-faint'}"
			>
				{#if p.aVenir}
					Rendez-vous le <time datetime={p.eventAt}>{formatDate(p.eventAt)}</time>
				{:else}
					Cette action a eu lieu le <time datetime={p.eventAt}>{formatDate(p.eventAt)}</time>
				{/if}
			</p>
		{/if}
	</header>

	{#if p.kind === 'apero' && data.sansTexte}
		<!-- L'annonce a été publiée mais le résumé des échanges n'est pas encore écrit. -->
		<p class="mx-auto mt-8 max-w-2xl rounded-lg border border-line bg-surface-alt px-4 py-3 text-sm text-ink-soft">
			{#if p.aVenir}
				Le résumé des échanges sera publié sur cette page après la soirée.
			{:else}
				Le résumé des échanges sera publié ici dans les prochains jours.
			{/if}
		</p>
	{/if}

	{#if p.cover}
		<img src={p.cover.url} alt={p.cover.alt} class="mt-8 w-full rounded-lg" />
	{/if}

	<!-- Contenu Markdown rendu côté serveur. `html: false` dans markdown.ts
	     garantit qu'aucune balise brute ne peut être injectée ici. -->
	<div class="contenu mx-auto mt-8 max-w-2xl">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html data.corpsHtml}
	</div>
</article>

<section id="commentaires" class="mx-auto mt-16 max-w-2xl border-t border-line pt-10">
	<h2 class="text-xl font-extrabold text-ink">
		{data.commentaires.length}
		{data.commentaires.length > 1 ? 'commentaires' : 'commentaire'}
	</h2>

	{#if data.commentaires.length}
		<ul class="mt-6 space-y-6">
			{#each data.commentaires as commentaire (commentaire.id)}
				<li class="border-b border-line pb-6 last:border-0">
					<p class="text-sm font-semibold text-ink">
						{commentaire.authorName || 'Anonyme'}
						<span class="ml-2 font-normal text-ink-faint">
							<time datetime={commentaire.createdAt}>{formatDateTime(commentaire.createdAt)}</time>
						</span>
					</p>
					<!-- Texte brut : Svelte échappe le contenu, aucun HTML n'est interprété. -->
					<p class="mt-2 whitespace-pre-wrap text-ink-soft">{commentaire.body}</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-4 text-ink-soft">Aucun commentaire pour l'instant.</p>
	{/if}

	{#if data.commentairesOuverts}
		<h3 class="mt-10 text-lg font-bold text-ink">Réagir</h3>

		{#if form?.succes}
			<p class="mt-4 rounded border border-line bg-surface-alt px-4 py-3 text-sm text-ink">
				{#if form.enAttente}
					Merci. Votre message a bien été reçu : il sera publié après relecture par l'équipe.
				{:else}
					Merci, votre message est publié.
				{/if}
			</p>
		{/if}

		<form
			method="POST"
			action="?/commenter"
			class="mt-4 space-y-4"
			use:enhance={() => {
				envoiEnCours = true;
				return async ({ update }) => {
					await update();
					envoiEnCours = false;
				};
			}}
		>
			{#if form?.erreur}
				<p role="alert" class="rounded border border-accent bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
					{form.erreur}
				</p>
			{/if}

			<div>
				<label class="block text-sm font-semibold text-ink" for="pseudo">
					Pseudonyme <span class="font-normal text-ink-faint">(facultatif)</span>
				</label>
				<input
					id="pseudo"
					name="pseudo"
					type="text"
					maxlength="60"
					autocomplete="off"
					value={form?.pseudo ?? ''}
					class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
				/>
			</div>

			<div>
				<label class="block text-sm font-semibold text-ink" for="corps">Votre message</label>
				<textarea
					id="corps"
					name="corps"
					rows="5"
					required
					maxlength="3000"
					class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
					>{form?.corps ?? ''}</textarea
				>
			</div>

			<!-- Champ-piège : masqué aux humains, souvent rempli par les robots. -->
			<div class="hidden" aria-hidden="true">
				<label for="site">Ne pas remplir</label>
				<input id="site" name="site" type="text" tabindex="-1" autocomplete="off" />
			</div>

			{#if data.defi}
				<PreuveDeTravail defi={data.defi} />
			{/if}

			<div class="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					disabled={envoiEnCours}
					class="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
					>{envoiEnCours ? 'Envoi…' : 'Envoyer'}</button
				>
				<p class="text-xs text-ink-faint">
					{#if data.preModeration}Les messages sont relus avant publication.{/if}
					Aucune inscription, aucun cookie, aucune adresse IP conservée en clair.
				</p>
			</div>
		</form>
	{:else}
		<p class="mt-8 rounded border border-line bg-surface-alt px-4 py-3 text-sm text-ink-soft">
			Les commentaires sont fermés sur cette publication.
		</p>
	{/if}
</section>

{#if p.kind === 'actu'}
	<BandeauApplication actif={data.app.actif} android={data.app.android} ios={data.app.ios} />
{/if}

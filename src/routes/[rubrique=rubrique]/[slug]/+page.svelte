<script lang="ts">
	import { enhance } from '$app/forms';
	import BandeauApplication from '$lib/components/BandeauApplication.svelte';
	import PreuveDeTravail from '$lib/components/PreuveDeTravail.svelte';
	import { COULEUR_KIND, formatDate, formatDateLongue, formatDateTime, LIBELLE_KIND } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const p = $derived(data.publication);
	let envoiEnCours = $state(false);

	// Le formulaire de partage d'une source est replié par défaut ; il se
	// rouvre de lui-même si l'envoi a échoué, pour montrer l'erreur.
	let partageOuvert = $state(false);
	$effect(() => {
		if (form?.formulaire === 'source' && form?.erreurSource) partageOuvert = true;
	});
	let envoiSourceEnCours = $state(false);

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

{#if p.kind === 'apero'}
	<!-- Le dossier partagé : ce que les uns et les autres proposent de lire,
	     voir ou écouter avant la soirée. Volontairement peu formel : un titre,
	     un lien si on en a un, un mot pour dire pourquoi. -->
	<section id="sources" class="mx-auto mt-16 max-w-2xl rounded-2xl border border-line bg-surface-alt px-5 py-6 sm:px-8 sm:py-8">
		<p class="text-xs font-bold tracking-[0.2em] text-pourpre uppercase">Pour préparer la soirée</p>
		<h2 class="mt-1 text-xl font-extrabold text-ink">Le dossier partagé</h2>
		<p class="mt-2 text-sm text-ink-soft">
			Un livre, une vidéo, un podcast, un article, un site : ce que chacun a trouvé utile sur le sujet.
			Rien d'obligatoire, rien d'exhaustif — on vient aussi sans avoir rien lu.
		</p>

		{#if data.sources.length}
			<ul class="mt-6 space-y-4">
				{#each data.sources as source (source.id)}
					<li class="rounded-lg border border-line bg-surface px-4 py-3">
						<p class="font-semibold text-ink">
							{#if source.url}
								<a
									href={source.url}
									target="_blank"
									rel="noopener noreferrer nofollow"
									class="text-brand underline-offset-4 hover:underline">{source.title}</a
								>
								<span class="ml-2 rounded bg-surface-alt px-1.5 py-0.5 text-xs font-medium text-ink-faint">{source.site}</span>
							{:else}
								{source.title}
							{/if}
						</p>
						{#if source.note}
							<p class="mt-1 text-sm text-ink-soft">{source.note}</p>
						{/if}
						{#if source.authorName}
							<p class="mt-1 text-xs text-ink-faint">Proposé par {source.authorName}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-6 text-sm text-ink-soft">Le dossier est encore vide. La première source peut être la vôtre.</p>
		{/if}

		{#if form?.formulaire === 'source' && form?.succesSource}
			<p class="mt-6 rounded border border-line bg-surface px-4 py-3 text-sm text-ink">
				{#if form.enAttenteSource}
					Merci ! Votre source a bien été reçue : elle apparaîtra dans le dossier après un coup d'œil de l'équipe.
				{:else}
					Merci, votre source est dans le dossier.
				{/if}
			</p>
		{/if}

		{#if data.defiSource}
			<details class="mt-6" bind:open={partageOuvert}>
				<summary class="inline-block cursor-pointer list-none rounded-full bg-pourpre px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
					Partager une source
				</summary>

				<form
					method="POST"
					action="?/partagerSource"
					class="mt-4 space-y-4"
					use:enhance={() => {
						envoiSourceEnCours = true;
						return async ({ update }) => {
							await update();
							envoiSourceEnCours = false;
						};
					}}
				>
					{#if form?.formulaire === 'source' && form?.erreurSource}
						<p role="alert" class="rounded border border-accent bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
							{form.erreurSource}
						</p>
					{/if}

					<div>
						<label class="block text-sm font-semibold text-ink" for="titre">
							De quoi s'agit-il ?
							<span class="block text-xs font-normal text-ink-faint">Le titre du livre, de la vidéo, de l'article, du site…</span>
						</label>
						<input
							id="titre"
							name="titre"
							type="text"
							required
							maxlength="120"
							value={form?.formulaire === 'source' ? (form.titre ?? '') : ''}
							class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
						/>
					</div>

					<div>
						<label class="block text-sm font-semibold text-ink" for="lien">
							Le lien <span class="font-normal text-ink-faint">(facultatif)</span>
							<span class="block text-xs font-normal text-ink-faint">Une vidéo YouTube, un article en ligne, un site… Pour un livre, laissez vide.</span>
						</label>
						<input
							id="lien"
							name="lien"
							type="url"
							inputmode="url"
							maxlength="500"
							placeholder="https://"
							value={form?.formulaire === 'source' ? (form.lien ?? '') : ''}
							class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
						/>
					</div>

					<div>
						<label class="block text-sm font-semibold text-ink" for="note">
							Un mot pour dire pourquoi <span class="font-normal text-ink-faint">(facultatif)</span>
						</label>
						<textarea
							id="note"
							name="note"
							rows="2"
							maxlength="300"
							class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
							>{form?.formulaire === 'source' ? (form.note ?? '') : ''}</textarea
						>
					</div>

					<div>
						<label class="block text-sm font-semibold text-ink" for="pseudoSource">
							Votre prénom ou pseudonyme <span class="font-normal text-ink-faint">(facultatif)</span>
						</label>
						<input
							id="pseudoSource"
							name="pseudoSource"
							type="text"
							maxlength="60"
							autocomplete="off"
							value={form?.formulaire === 'source' ? (form.pseudoSource ?? '') : ''}
							class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-ink"
						/>
					</div>

					<!-- Champ-piège : masqué aux humains, souvent rempli par les robots. -->
					<div class="hidden" aria-hidden="true">
						<label for="site-source">Ne pas remplir</label>
						<input id="site-source" name="site" type="text" tabindex="-1" autocomplete="off" />
					</div>

					<!-- La preuve de travail ne se calcule qu'une fois le formulaire déplié. -->
					{#if partageOuvert && !data.sourceDirecte}
						<PreuveDeTravail defi={data.defiSource} />
					{/if}

					<div class="flex flex-wrap items-center gap-3">
						<button
							type="submit"
							disabled={envoiSourceEnCours}
							class="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
							>{envoiSourceEnCours ? 'Envoi…' : 'Ajouter au dossier'}</button
						>
						<p class="text-xs text-ink-faint">
							{#if data.sourceDirecte}
								Vous êtes connecté : la source est publiée immédiatement.
							{:else}
								Les sources sont relues avant d'apparaître. Aucune inscription, aucune adresse IP conservée en clair.
							{/if}
						</p>
					</div>
				</form>
			</details>
		{/if}
	</section>
{/if}

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

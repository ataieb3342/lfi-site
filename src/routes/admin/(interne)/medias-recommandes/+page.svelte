<script lang="ts">
	import { FORMATS, titreFormat } from '$lib/medias';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const surAccueil = $derived(data.medias.filter((m) => m.accueil).length);
	// Une erreur sur la modification d'un média rouvre son formulaire.
	const idEnErreur = $derived(form && 'id' in form ? form.id : null);
</script>

<svelte:head><title>Médias recommandés - Administration</title></svelte:head>

<h1 class="text-2xl font-extrabold text-ink">Médias recommandés</h1>
<p class="mt-1 text-sm text-ink-soft">
	Tous les médias de cette liste sont sur la page <a class="font-semibold text-brand hover:underline" href="/medias">Médias</a>,
	dans cet ordre. Ceux marqués « Sur l’accueil » sont aussi dans « On recommande », en bas de l’accueil.
	La liste doit rester courte : cinq médias, c’est un conseil ; vingt, c’est un annuaire.
</p>

{#if form?.erreur && idEnErreur === null}<p role="alert" class="alerte mt-4">{form.erreur}</p>{/if}

{#if data.medias.length}
	<p class="mt-6 text-xs font-bold tracking-wide text-ink-faint uppercase">
		{data.medias.length} média{data.medias.length > 1 ? 's' : ''} · {surAccueil} sur l’accueil
	</p>
	<ul class="mt-3 space-y-3">
		{#each data.medias as m, i (m.id)}
			<li class="carte">
				<div class="flex gap-3">
					{#if m.logo}
						<img class="size-12 shrink-0 rounded-lg object-cover" src={m.logo} alt="" width="48" height="48" />
					{:else}
						<div class="size-12 shrink-0 rounded-lg bg-surface-alt" aria-hidden="true"></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="font-bold text-ink">
							{m.nom}
							<span class="ml-1 text-xs font-normal text-ink-faint">{titreFormat(m.format)}</span>
							{#if m.accueil}
								<span class="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Sur l’accueil</span>
							{/if}
						</p>
						<p class="text-xs break-all text-ink-faint">{m.lien}</p>
						{#if m.description}<p class="mt-1 text-sm text-ink-soft">{m.description}</p>{/if}
					</div>
				</div>

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<form method="POST" action="?/accueil">
						<input type="hidden" name="id" value={m.id} />
						<input type="hidden" name="accueil" value={m.accueil ? '0' : '1'} />
						<button class={m.accueil ? 'bouton-secondaire' : 'bouton'} type="submit">
							{m.accueil ? 'Retirer de l’accueil' : 'Afficher sur l’accueil'}
						</button>
					</form>
					<form method="POST" action="?/deplacer" class="flex gap-1">
						<input type="hidden" name="id" value={m.id} />
						<button class="bouton-secondaire" type="submit" name="sens" value="haut" disabled={i === 0} aria-label="Monter {m.nom}">↑</button>
						<button
							class="bouton-secondaire"
							type="submit"
							name="sens"
							value="bas"
							disabled={i === data.medias.length - 1}
							aria-label="Descendre {m.nom}">↓</button
						>
					</form>
					<form method="POST" action="?/supprimer" class="ml-auto">
						<input type="hidden" name="id" value={m.id} />
						<button class="bouton-danger" type="submit">Supprimer</button>
					</form>
				</div>

				<details class="mt-3" open={idEnErreur === m.id}>
					<summary class="cursor-pointer text-sm font-semibold text-brand">Modifier</summary>
					<form method="POST" action="?/modifier" enctype="multipart/form-data" class="mt-3 space-y-3">
						{#if idEnErreur === m.id}<p role="alert" class="alerte">{form?.erreur}</p>{/if}
						<input type="hidden" name="id" value={m.id} />
						{@render champs(m, `m${m.id}`)}
						<button class="bouton" type="submit">Enregistrer</button>
					</form>
				</details>
			</li>
		{/each}
	</ul>
{:else}
	<p class="carte mt-6 text-sm text-ink-soft">Aucun média pour le moment : la page Médias et la section de l’accueil sont masquées.</p>
{/if}

<h2 class="mt-8 text-lg font-extrabold text-ink">Ajouter un média</h2>
<form method="POST" action="?/ajouter" enctype="multipart/form-data" class="carte mt-3 space-y-3">
	{@render champs(null, 'nouveau')}
	<button class="bouton" type="submit">Ajouter</button>
</form>

{#snippet champs(m: PageData['medias'][number] | null, prefixe: string)}
	<div class="grid gap-3 sm:grid-cols-2">
		<div>
			<label class="etiquette" for="{prefixe}-nom">Nom</label>
			<input id="{prefixe}-nom" name="nom" class="champ" required maxlength="80" value={m?.nom ?? ''} />
		</div>
		<div>
			<label class="etiquette" for="{prefixe}-format">Format</label>
			<select id="{prefixe}-format" name="format" class="champ">
				{#each FORMATS as f (f.id)}
					<option value={f.id} selected={m?.format === f.id}>{f.titre}</option>
				{/each}
			</select>
		</div>
	</div>
	<div>
		<label class="etiquette" for="{prefixe}-lien">Lien</label>
		<input id="{prefixe}-lien" name="lien" type="url" class="champ" required maxlength="500" placeholder="https://" value={m?.lien ?? ''} />
	</div>
	<div>
		<label class="etiquette" for="{prefixe}-description">Pourquoi on le recommande</label>
		<textarea id="{prefixe}-description" name="description" class="champ" rows="2" maxlength="300">{m?.description ?? ''}</textarea>
		<p class="aide">Une phrase qui dit pourquoi, pas seulement ce que c’est.</p>
	</div>
	<div>
		<label class="etiquette" for="{prefixe}-logo">Logo{m?.logo ? ' (laisser vide pour garder l’actuel)' : ''}</label>
		<input id="{prefixe}-logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="champ" />
		<p class="aide">
			Une image carrée (160 pixels suffisent) : l’image de partage ou l’icône du site du média, enregistrée puis
			envoyée ici. Jamais un lien vers son site.
		</p>
	</div>
	<label class="flex items-center gap-2 text-sm text-ink">
		<input type="checkbox" name="accueil" value="1" checked={m?.accueil ?? false} />
		Afficher aussi sur l’accueil
	</label>
{/snippet}

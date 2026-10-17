<script lang="ts">
	import Histogramme, { type Colonne } from '$lib/components/Histogramme.svelte';
	import { compte, formatHeure, formatRelative } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Pic = PageData['pics'][number];

	// Le serveur tourne en UTC : les heures sont toujours affichées à l'heure
	// de Paris, quel que soit l'endroit où la page est calculée.
	const PARIS = 'Europe/Paris';
	const nombre = new Intl.NumberFormat('fr-FR');

	/** « 2026-10-16T19:27 » (UTC) devient « 21 h 27 », heure de Paris. */
	function heure(minute: string): string {
		const texte = new Date(`${minute}Z`).toLocaleTimeString('fr-FR', {
			timeZone: PARIS,
			hour: '2-digit',
			minute: '2-digit'
		});
		return formatHeure(texte);
	}

	function date(minute: string, options: Intl.DateTimeFormatOptions): string {
		return new Date(`${minute}Z`).toLocaleDateString('fr-FR', { timeZone: PARIS, ...options });
	}

	const jours = $derived(data.trenteJours);
	const visiteursAujourdhui = $derived(jours.at(-1)?.visiteurs ?? 0);
	const visites7 = $derived(jours.slice(-7).reduce((total, j) => total + j.visiteurs, 0));
	const visites30 = $derived(jours.reduce((total, j) => total + j.visiteurs, 0));
	const pagesVues30 = $derived(jours.reduce((total, j) => total + j.pagesVues, 0));
	const robots30 = $derived(jours.reduce((total, j) => total + j.robots, 0));

	const colonnesJours: Colonne[] = $derived(
		jours.map((j, i) => {
			const midi = `${j.jour}T12:00`;
			return {
				quand: date(midi, { weekday: 'long', day: 'numeric', month: 'long' }),
				// Une étiquette par semaine, en partant d'aujourd'hui.
				axe: (jours.length - 1 - i) % 7 === 0 ? date(midi, { day: 'numeric', month: 'short' }) : '',
				valeur: j.visiteurs
			};
		})
	);

	const colonnesTrafic: Colonne[] = $derived(
		data.tranches.map((t) => {
			const fin = new Date(new Date(`${t.debut}Z`).getTime() + 30 * 60_000).toISOString().slice(0, 16);
			const pleineHeure = t.debut.endsWith(':00');
			const heureParis = Number(heure(t.debut).split(' ')[0]);
			return {
				quand: `${date(t.debut, { weekday: 'short', day: 'numeric', month: 'short' })}, de ${heure(t.debut)} à ${heure(fin)}`,
				axe: pleineHeure && heureParis % 3 === 0 ? heure(t.debut) : '',
				valeur: t.servies,
				alerte: t.bloquees
			};
		})
	);

	function duree(pic: Pic): string {
		const minutes = Math.round((new Date(`${pic.fin}Z`).getTime() - new Date(`${pic.debut}Z`).getTime()) / 60_000) + 1;
		return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
	}

	const tuiles = $derived([
		{ libelle: 'Visiteurs aujourd’hui', valeur: visiteursAujourdhui },
		{ libelle: 'Visites sur 7 jours', valeur: visites7 },
		{ libelle: 'Visites sur 30 jours', valeur: visites30 },
		{ libelle: 'Pages vues sur 30 jours', valeur: pagesVues30 }
	]);
</script>

<svelte:head><title>Fréquentation - Administration</title></svelte:head>

<header class="border-b border-line pb-4">
	<h1 class="text-2xl font-extrabold text-ink">Fréquentation</h1>
	<p class="mt-1 max-w-2xl text-sm text-ink-soft">
		Ce que le site compte lui-même, sans cookie ni service extérieur, et sans conserver aucune adresse
		IP : seulement des totaux.
	</p>
</header>

{#if data.maintenant.picEnCours}
	<p class="alerte mt-5">
		Pic de trafic en cours : {compte(data.maintenant.picEnCours.requetes, 'requête')} en une minute, dont
		{compte(data.maintenant.picEnCours.bloquees, 'bloquée')}. Le site se défend seul ; rechargez la page pour suivre
		l’évolution.
	</p>
{/if}

<div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each tuiles as tuile (tuile.libelle)}
		<div class="carte">
			<p class="text-3xl font-extrabold text-ink">{nombre.format(tuile.valeur)}</p>
			<p class="mt-1 text-xs text-ink-faint">{tuile.libelle}</p>
		</div>
	{/each}
</div>

<section class="mt-8">
	<h2 class="text-lg font-extrabold text-ink">Visiteurs par jour</h2>
	<p class="mt-1 max-w-2xl text-sm text-ink-soft">
		Les trente derniers jours. Une personne qui revient trois jours de suite compte pour trois visites ; les
		robots ({compte(robots30, 'passage')} sur la période, surtout des moteurs de recherche) et les
		administrateurs connectés ne sont pas comptés.
	</p>
	<Histogramme titre="Visiteurs par jour, trente derniers jours" colonnes={colonnesJours} serie="visiteurs" etiquetterMax />
</section>

<!-- min-w-0 : sans lui, une adresse de page très longue élargit la colonne au-delà de l'écran. -->
<div class="mt-8 grid gap-8 lg:grid-cols-2">
	<section class="min-w-0">
		<h2 class="text-lg font-extrabold text-ink">Pages les plus lues</h2>
		<p class="mt-1 text-sm text-ink-soft">Sur les trente derniers jours.</p>
		{#if data.pages.length}
			<ol class="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
				{#each data.pages as page (page.chemin)}
					<li class="flex items-baseline gap-3 px-4 py-2">
						<div class="min-w-0 flex-1">
							{#if page.chemin === '(autres)'}
								<span class="text-ink-soft">Autres pages</span>
							{:else}
								<a class="font-semibold break-words text-ink hover:text-brand" href={page.chemin}>
									{page.titre ?? page.chemin}
								</a>
								{#if page.titre}<span class="block truncate text-xs text-ink-faint">{page.chemin}</span>{/if}
							{/if}
						</div>
						<span class="text-ink tabular-nums">{nombre.format(page.vues)}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="carte mt-5 text-sm text-ink-soft">Aucune page vue pour l’instant.</p>
		{/if}
	</section>

	<section class="min-w-0">
		<h2 class="text-lg font-extrabold text-ink">D’où viennent les visiteurs</h2>
		<p class="mt-1 text-sm text-ink-soft">Le site sur lequel ils ont cliqué pour arriver ici.</p>
		{#if data.provenances.length}
			<ol class="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
				{#each data.provenances as provenance (provenance.provenance)}
					<li class="flex items-baseline gap-3 px-4 py-2">
						<span class="min-w-0 flex-1 break-words {provenance.provenance ? 'font-semibold text-ink' : 'text-ink-soft'}">
							{#if provenance.provenance === ''}
								Accès direct, favori ou application
							{:else if provenance.provenance === '(autres)'}
								Autres sites
							{:else}
								{provenance.provenance}
							{/if}
						</span>
						<span class="text-ink tabular-nums">{nombre.format(provenance.arrivees)}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="carte mt-5 text-sm text-ink-soft">Aucune arrivée enregistrée pour l’instant.</p>
		{/if}
	</section>
</div>

<section class="mt-8 border-t border-line pt-8">
	<h2 class="text-lg font-extrabold text-ink">Surveillance</h2>
	<p class="mt-1 max-w-2xl text-sm text-ink-soft">
		Toutes les requêtes reçues par le site, images comprises, par demi-heure sur les dernières 24 heures. Les
		requêtes bloquées viennent d’adresses qui en envoient beaucoup trop, trop vite : le site les refuse sans
		calculer la page.
	</p>

	<dl class="mt-5 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
		<div class="carte">
			<dt class="text-xs text-ink-faint">Cette minute</dt>
			<dd class="mt-1 font-bold text-ink">{compte(data.maintenant.requetesMinute, 'requête')}</dd>
		</div>
		<div class="carte">
			<dt class="text-xs text-ink-faint">Adresses bloquées en ce moment</dt>
			<dd class="mt-1 font-bold text-ink">{nombre.format(data.maintenant.adressesBloquees)}</dd>
		</div>
		<div class="carte">
			<dt class="text-xs text-ink-faint">Dernier redémarrage du site</dt>
			<dd class="mt-1 font-bold text-ink">{formatRelative(data.maintenant.enLigneDepuis)}</dd>
		</div>
		<div class="carte">
			<dt class="text-xs text-ink-faint">Mémoire utilisée par le site</dt>
			<dd class="mt-1 font-bold text-ink">{data.maintenant.memoireMo} Mo</dd>
		</div>
	</dl>

	<Histogramme
		titre="Requêtes reçues par demi-heure, dernières 24 heures"
		colonnes={colonnesTrafic}
		serie="servies"
		serieAlerte="bloquées"
	/>

	<h3 class="mt-8 text-base font-extrabold text-ink">Pics de trafic des 90 derniers jours</h3>
	<p class="mt-1 max-w-2xl text-sm text-ink-soft">
		Une minute compte comme un pic au-delà de {nombre.format(data.seuilPic)} requêtes, soit dix par seconde ;
		d’habitude, le site en reçoit quelques dizaines par minute. «&nbsp;Attaque probable&nbsp;»&nbsp;: beaucoup de
		requêtes bloquées, ou des adresses qui en envoient chacune bien plus qu’un lecteur. «&nbsp;Forte
		affluence&nbsp;»&nbsp;: beaucoup de visiteurs différents, comme lorsqu’un article circule.
	</p>
	{#if data.pics.length}
		<ul class="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
			{#each data.pics as pic (pic.debut)}
				<li class="px-4 py-3">
					<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<span class="font-semibold text-ink">
							{date(pic.debut, { weekday: 'long', day: 'numeric', month: 'long' })}, {heure(pic.debut)}
						</span>
						<span class="text-ink-faint">{duree(pic)}</span>
						{#if pic.attaque}
							<span class="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">Attaque probable</span>
						{:else}
							<span class="rounded bg-surface-alt px-1.5 py-0.5 text-xs font-semibold text-ink-soft">Forte affluence</span>
						{/if}
					</div>
					<p class="mt-1 text-ink-soft">
						{compte(pic.requetes, 'requête')}, jusqu’à {nombre.format(pic.parMinute)} par minute ·
						{compte(pic.bloquees, 'bloquée')} · {compte(pic.adresses, 'adresse')} au plus fort{#if pic.erreurs}
							· {compte(pic.erreurs, 'erreur')}{/if}
					</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="carte mt-5 text-sm text-ink-soft">Aucun pic de trafic sur la période.</p>
	{/if}

	<p class="mt-5 max-w-2xl text-xs text-ink-faint">
		Ces chiffres ne voient que ce qui atteint le site. Quand une vague est trop forte, Caddy, le serveur placé
		devant, refuse lui-même une partie des requêtes : elles n’apparaissent pas ici, mais le site reste debout.
	</p>
</section>

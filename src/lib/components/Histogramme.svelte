<script lang="ts" module>
	export type Colonne = {
		/** Ce que représente la colonne, en toutes lettres : « lundi 12 octobre ». */
		quand: string;
		/** Texte sous l'axe, pour une colonne sur plusieurs seulement. */
		axe?: string;
		valeur: number;
		/** Seconde série, empilée au-dessus de la première. */
		alerte?: number;
	};
</script>

<script lang="ts">
	/**
	 * Un graphique en colonnes pour l'administration : une série, ou deux
	 * empilées (les requêtes servies et, par-dessus, celles qui ont été
	 * bloquées).
	 *
	 * Des boîtes HTML plutôt qu'un dessin SVG : les colonnes suivent la largeur
	 * de l'écran sans que le texte rapetisse sur un téléphone. Les chiffres
	 * d'une colonne s'affichent au survol, ou au clavier avec les flèches, et
	 * le tableau dépliable du dessous les donne tous sans rien survoler.
	 */
	let {
		titre,
		colonnes,
		serie,
		serieAlerte,
		etiquetterMax = false
	}: {
		titre: string;
		colonnes: Colonne[];
		serie: string;
		serieAlerte?: string;
		etiquetterMax?: boolean;
	} = $props();

	let actif = $state<number | null>(null);

	const nombre = new Intl.NumberFormat('fr-FR');
	const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

	const totaux = $derived(colonnes.map((c) => c.valeur + (c.alerte ?? 0)));
	const maximum = $derived(Math.max(0, ...totaux));

	/** Un pas de graduation « rond » (1, 2 ou 5 fois une puissance de dix), pour quatre traits environ. */
	const pas = $derived.by(() => {
		const brut = Math.max(1, maximum) / 4;
		const puissance = 10 ** Math.floor(Math.log10(brut));
		const rapport = brut / puissance;
		return Math.max(1, (rapport <= 1 ? 1 : rapport <= 2 ? 2 : rapport <= 5 ? 5 : 10) * puissance);
	});
	const plafond = $derived(Math.max(pas, Math.ceil(maximum / pas) * pas));
	const graduations = $derived(Array.from({ length: Math.round(plafond / pas) + 1 }, (_, i) => i * pas));
	const indiceMax = $derived(totaux.indexOf(maximum));

	function hauteur(total: number): number {
		return (total / plafond) * 100;
	}

	/** Les noms de série sont donnés au pluriel (« visiteurs ») ; zéro et un prennent le singulier. */
	function accorder(n: number, pluriel: string): string {
		return n > 1 ? pluriel : pluriel.replace(/s$/, '');
	}

	function texte(i: number): string {
		const c = colonnes[i];
		const alerte = serieAlerte ? `, ${nombre.format(c.alerte ?? 0)} ${accorder(c.alerte ?? 0, serieAlerte)}` : '';
		return `${c.quand} : ${nombre.format(c.valeur)} ${accorder(c.valeur, serie)}${alerte}`;
	}

	function clavier(evenement: KeyboardEvent) {
		const n = colonnes.length;
		const i = actif ?? n - 1;
		const cible: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1 };
		if (!(evenement.key in cible)) return;
		evenement.preventDefault();
		actif = Math.min(n - 1, Math.max(0, cible[evenement.key]));
	}

	/** L'infobulle est centrée sur sa colonne, sauf près des bords où elle déborderait. */
	const placement = $derived.by(() => {
		if (actif === null) return '';
		const n = colonnes.length;
		const position = (actif + 0.5) / n;
		if (position < 0.15) return `left: ${(actif / n) * 100}%`;
		if (position > 0.85) return `left: ${((actif + 1) / n) * 100}%; transform: translateX(-100%)`;
		return `left: ${position * 100}%; transform: translateX(-50%)`;
	});
</script>

<figure class="mt-5">
	{#if maximum === 0}
		<p class="carte text-sm text-ink-soft">
			Rien à afficher pour l'instant : les chiffres apparaissent au fil des visites.
		</p>
	{:else}
		{#if serieAlerte}
			<figcaption class="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
				<span class="flex items-center gap-1.5"><span class="size-3 rounded-sm bg-graphe"></span>{serie}</span>
				<span class="flex items-center gap-1.5">
					<span class="size-3 rounded-sm bg-graphe-alerte"></span>{serieAlerte}
				</span>
			</figcaption>
		{/if}

		<div class="flex gap-2 {etiquetterMax ? 'pt-5' : 'pt-2'}">
			<!-- Graduations -->
			<div class="relative h-48 w-10 shrink-0 text-right text-xs text-ink-faint tabular-nums" aria-hidden="true">
				{#each graduations as graduation (graduation)}
					<span class="absolute right-0 translate-y-1/2" style="bottom: {hauteur(graduation)}%">
						{compact.format(graduation)}
					</span>
				{/each}
			</div>

			<div class="min-w-0 flex-1">
				<div class="relative h-48">
					{#each graduations as graduation (graduation)}
						<div class="absolute inset-x-0 border-t border-line" style="bottom: {hauteur(graduation)}%"></div>
					{/each}

					<!--
						Au clavier, le graphique se parcourt comme un curseur : les
						flèches passent d'une colonne à l'autre, et le lecteur d'écran
						annonce la date et les chiffres de la colonne atteinte.
					-->
					<div
						role="slider"
						tabindex="0"
						aria-label="{titre}. Flèches gauche et droite pour parcourir les colonnes ; tous les chiffres sont aussi dans le tableau en dessous."
						aria-valuemin={0}
						aria-valuemax={colonnes.length - 1}
						aria-valuenow={actif ?? colonnes.length - 1}
						aria-valuetext={texte(actif ?? colonnes.length - 1)}
						class="absolute inset-0 flex items-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
						onkeydown={clavier}
						onfocus={() => (actif ??= colonnes.length - 1)}
						onblur={() => (actif = null)}
						onpointerleave={() => (actif = null)}
					>
						{#each colonnes as colonne, i (i)}
							<div
								class="relative flex h-full min-w-0 flex-1 items-end justify-center px-px transition-opacity
									{actif !== null && actif !== i ? 'opacity-60' : ''}"
								onpointerenter={() => (actif = i)}
								aria-hidden="true"
							>
								<div class="flex w-full max-w-6 flex-col gap-[2px]" style="height: {hauteur(totaux[i])}%">
									{#if colonne.alerte}
										<div class="min-h-px rounded-t-[4px] bg-graphe-alerte" style="flex: {colonne.alerte} 1 0"></div>
									{/if}
									{#if colonne.valeur}
										<div
											class="min-h-px bg-graphe {colonne.alerte ? '' : 'rounded-t-[4px]'}"
											style="flex: {colonne.valeur} 1 0"
										></div>
									{/if}
								</div>
								{#if etiquetterMax && i === indiceMax}
									<span
										class="absolute left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-ink-soft tabular-nums"
										style="bottom: calc({hauteur(totaux[i])}% + 2px)"
									>
										{nombre.format(totaux[i])}
									</span>
								{/if}
							</div>
						{/each}
					</div>

					{#if actif !== null}
						{@const colonne = colonnes[actif]}
						<div
							class="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-64 rounded border border-line-forte bg-carte px-3 py-2 text-xs"
							style={placement}
						>
							<p class="flex items-center gap-2">
								{#if serieAlerte}<span class="h-0.5 w-3 bg-graphe"></span>{/if}
								<strong class="text-sm text-ink tabular-nums">{nombre.format(colonne.valeur)}</strong>
								<span class="text-ink-soft">{accorder(colonne.valeur, serie)}</span>
							</p>
							{#if serieAlerte}
								<p class="mt-0.5 flex items-center gap-2">
									<span class="h-0.5 w-3 bg-graphe-alerte"></span>
									<strong class="text-sm text-ink tabular-nums">{nombre.format(colonne.alerte ?? 0)}</strong>
									<span class="text-ink-soft">{accorder(colonne.alerte ?? 0, serieAlerte)}</span>
								</p>
							{/if}
							<p class="mt-1 text-ink-faint">{colonne.quand}</p>
						</div>
					{/if}
				</div>

				<!-- Axe des dates : centrées sous leur colonne, sauf aux extrémités, où
				     elles dépasseraient du graphique et feraient défiler la page de côté. -->
				<div class="mt-1 flex text-xs text-ink-faint" aria-hidden="true">
					{#each colonnes as colonne, i (i)}
						<span class="relative h-5 min-w-0 flex-1">
							{#if colonne.axe}
								<span
									class="absolute top-0 whitespace-nowrap
										{i === 0 ? 'left-0' : i === colonnes.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}"
								>
									{colonne.axe}
								</span>
							{/if}
						</span>
					{/each}
				</div>
			</div>
		</div>

		<details class="mt-3">
			<summary class="cursor-pointer text-xs font-semibold text-brand">Voir les chiffres en tableau</summary>
			<div class="mt-2 max-h-80 overflow-y-auto rounded border border-line">
				<table class="w-full text-sm">
					<caption class="sr-only">{titre}</caption>
					<thead class="sticky top-0 bg-surface-alt text-left text-xs text-ink-soft">
						<tr>
							<th class="px-3 py-1.5 font-semibold">Quand</th>
							<th class="px-3 py-1.5 text-right font-semibold">{serie}</th>
							{#if serieAlerte}<th class="px-3 py-1.5 text-right font-semibold">{serieAlerte}</th>{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each colonnes as colonne, i (i)}
							<tr>
								<td class="px-3 py-1.5 text-ink-soft">{colonne.quand}</td>
								<td class="px-3 py-1.5 text-right text-ink tabular-nums">{nombre.format(colonne.valeur)}</td>
								{#if serieAlerte}
									<td class="px-3 py-1.5 text-right text-ink tabular-nums">{nombre.format(colonne.alerte ?? 0)}</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}
</figure>

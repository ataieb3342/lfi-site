<script lang="ts">
	/**
	 * Les boutons pour faire circuler une publication : WhatsApp, Facebook,
	 * Telegram, Bluesky, X, l'e-mail et la copie du lien.
	 *
	 * Ce sont de simples liens vers la page de partage de chaque réseau : rien
	 * n'est chargé depuis ces réseaux tant que le visiteur n'a pas cliqué. Les
	 * boutons « officiels » qu'ils fournissent sont des scripts et des iframes
	 * qui leur signalent chaque lecteur de l'article, qu'il partage ou non. La
	 * politique de sécurité les refuserait de toute façon (règle n° 2 de
	 * CLAUDE.md), et le site promet de n'utiliser aucun service tiers.
	 *
	 * Les icônes sont les logos des réseaux, recopiés de Simple Icons (domaine
	 * public) : des SVG écrits dans le code et relus, comme le logo du site.
	 *
	 * Deux boutons n'apparaissent qu'une fois le script actif, puisqu'ils ne
	 * fonctionnent pas sans lui : « Copier le lien », et « Autres applications »,
	 * qui ouvre le menu de partage du téléphone (Signal, Instagram, SMS… tout ce
	 * qui y est installé). Sans script, les liens suffisent.
	 *
	 * Pour retirer un réseau ou en ajouter un, il suffit de modifier `reseaux`.
	 */
	let { titre, adresse }: { titre: string; adresse: string } = $props();

	// Raccourci pour tenir, adresse comprise, dans un message sur X (280 signes)
	// ou Bluesky (300) : l'adresse d'une publication dépasse rarement 120 signes.
	const titreCourt = $derived(titre.length > 150 ? `${titre.slice(0, 149)}…` : titre);
	const message = $derived(`${titreCourt} ${adresse}`);

	const reseaux = $derived([
		{
			nom: 'WhatsApp',
			lien: `https://wa.me/?text=${encodeURIComponent(message)}`,
			icone:
				'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'
		},
		{
			nom: 'Facebook',
			lien: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adresse)}`,
			icone:
				'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
		},
		{
			nom: 'Telegram',
			lien: `https://t.me/share/url?url=${encodeURIComponent(adresse)}&text=${encodeURIComponent(titreCourt)}`,
			icone:
				'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'
		},
		{
			nom: 'Bluesky',
			lien: `https://bsky.app/intent/compose?text=${encodeURIComponent(message)}`,
			icone:
				'M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026'
		},
		{
			nom: 'X',
			lien: `https://x.com/intent/tweet?text=${encodeURIComponent(titreCourt)}&url=${encodeURIComponent(adresse)}`,
			icone:
				'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z'
		}
	]);

	const courriel = $derived(`mailto:?subject=${encodeURIComponent(titre)}&body=${encodeURIComponent(adresse)}`);

	// Les deux boutons qui ont besoin du script n'apparaissent qu'une fois
	// celui-ci actif (le motif `scriptActif` de FormulairePublication).
	let scriptActif = $state(false);
	let peutPartager = $state(false);
	$effect(() => {
		scriptActif = true;
		peutPartager = typeof navigator.share === 'function';
	});

	let copie = $state<'' | 'faite' | 'impossible'>('');
	let minuteur: ReturnType<typeof setTimeout> | undefined;

	async function copier() {
		let reussi = true;
		try {
			await navigator.clipboard.writeText(adresse);
		} catch {
			reussi = copierALAncienne(adresse);
		}
		copie = reussi ? 'faite' : 'impossible';
		clearTimeout(minuteur);
		minuteur = setTimeout(() => (copie = ''), 2500);
	}

	/**
	 * Certains navigateurs refusent l'accès direct au presse-papiers : ceux qui
	 * s'ouvrent à l'intérieur de Facebook ou d'Instagram, par exemple. On passe
	 * alors par l'ancienne méthode, une zone de texte invisible sélectionnée le
	 * temps de la copie.
	 */
	function copierALAncienne(texte: string): boolean {
		const bouton = document.activeElement as HTMLElement | null;
		const zone = document.createElement('textarea');
		zone.value = texte;
		zone.readOnly = true;
		zone.style.position = 'fixed';
		zone.style.opacity = '0';
		document.body.append(zone);
		zone.select();
		try {
			return document.execCommand('copy');
		} catch {
			return false;
		} finally {
			zone.remove();
			// La sélection a déplacé le focus : on le rend au bouton.
			bouton?.focus();
		}
	}

	async function partager() {
		try {
			await navigator.share({ title: titre, url: adresse });
		} catch {
			// Le visiteur a refermé le menu sans choisir : rien à signaler.
		}
	}
</script>

<!-- Les liens s'ouvrent dans un nouvel onglet : on garde l'article sous la main. -->
<section aria-labelledby="partage-titre" class="mt-8">
	<h2 id="partage-titre" class="text-sm font-bold text-ink">Partager</h2>
	<ul class="mt-3 flex flex-wrap gap-2">
		{#each reseaux as reseau (reseau.nom)}
			<li>
				<a class="bouton-secondaire" href={reseau.lien} target="_blank" rel="noopener noreferrer">
					<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d={reseau.icone} />
					</svg>
					<span><span class="sr-only">Partager sur</span> {reseau.nom}</span>
				</a>
			</li>
		{/each}
		<li>
			<a class="bouton-secondaire" href={courriel}>
				<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<path d="m3 7 9 6 9-6" />
				</svg>
				<span><span class="sr-only">Envoyer par</span> E-mail</span>
			</a>
		</li>
		{#if scriptActif}
			<li>
				<button type="button" class="bouton-secondaire" onclick={copier}>
					<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						{#if copie === 'faite'}
							<path d="m5 12 5 5 9-10" />
						{:else}
							<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
							<path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
						{/if}
					</svg>
					<!-- Annoncé aux lecteurs d'écran quand le texte change. -->
					<span aria-live="polite">{copie === 'faite' ? 'Lien copié' : copie === 'impossible' ? 'Copie impossible' : 'Copier le lien'}</span>
				</button>
			</li>
		{/if}
		{#if peutPartager}
			<li>
				<button type="button" class="bouton-secondaire" onclick={partager}>
					<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M12 3v12" />
						<path d="m7 8 5-5 5 5" />
						<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
					</svg>
					<span>Autres applications</span>
				</button>
			</li>
		{/if}
	</ul>
</section>

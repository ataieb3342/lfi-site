<script lang="ts">
	/**
	 * Vérification anti-robot par preuve de travail.
	 *
	 * Le navigateur cherche, par force brute, le nombre dont l'empreinte
	 * SHA-256 correspond au défi envoyé par le serveur. C'est instantané pour
	 * une personne qui rédige un commentaire, mais coûteux pour un robot qui
	 * voudrait en publier des milliers.
	 *
	 * Rien à cliquer, aucune image à déchiffrer, aucun service tiers contacté :
	 * c'est accessible aux lecteurs d'écran et respectueux de la vie privée.
	 */
	type Defi = { salt: string; challenge: string; maxnumber: number; expires: number; signature: string };

	let { defi }: { defi: Defi } = $props();

	let solution = $state('');
	let etat = $state<'attente' | 'encours' | 'ok' | 'echec'>('attente');

	async function empreinte(texte: string): Promise<string> {
		const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
		return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	async function resoudre() {
		etat = 'encours';
		const LOT = 400; // on teste par paquets pour ne pas figer l'interface
		for (let debut = 0; debut <= defi.maxnumber; debut += LOT) {
			const nombres = Array.from({ length: Math.min(LOT, defi.maxnumber - debut + 1) }, (_, i) => debut + i);
			const empreintes = await Promise.all(nombres.map((n) => empreinte(defi.salt + n)));
			const trouve = empreintes.indexOf(defi.challenge);
			if (trouve !== -1) {
				solution = btoa(
					JSON.stringify({
						salt: defi.salt,
						number: nombres[trouve],
						expires: defi.expires,
						signature: defi.signature
					})
				);
				etat = 'ok';
				return;
			}
		}
		etat = 'echec';
	}

	$effect(() => {
		if (typeof crypto?.subtle?.digest === 'function') resoudre();
		else etat = 'echec';
	});
</script>

<input type="hidden" name="preuve" value={solution} />

<p class="text-xs text-ink-faint" aria-live="polite">
	{#if etat === 'ok'}
		✓ Vérification anti-robot effectuée.
	{:else if etat === 'encours' || etat === 'attente'}
		Vérification anti-robot en cours…
	{:else}
		Vérification anti-robot indisponible : votre message sera relu avant publication.
	{/if}
</p>

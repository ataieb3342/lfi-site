<script lang="ts">
	import type { PublicationVue } from '$lib/types';
	import { formatDateLongue, formatPlageHoraire } from '$lib/format';

	type Champs = {
		kind?: string;
		title?: string;
		summary?: string;
		body?: string;
		authorName?: string;
		authorAdminId?: string;
		status?: string;
		eventAt?: string;
		eventCategory?: string;
		actionCategory?: string;
		eventStartTime?: string;
		eventEndTime?: string;
		eventLocation?: string;
		eventMeetingPoint?: string;
		eventAddress?: string;
		eventLocationUrl?: string;
		eventManagers?: string;
		eventManagerAdminIds?: number[];
		eventSignupUrl?: string;
		eventMapEmbed?: string;
		commentsOpen?: boolean;
		pinned?: boolean;
	};

	let {
		publication = null,
		valeurs = {},
		erreur = '',
		libelleValider = 'Enregistrer',
		apercu = '',
		admins = []
	}: {
		publication?: PublicationVue | null;
		valeurs?: Champs;
		erreur?: string;
		libelleValider?: string;
		/** Texte rendu en HTML par le serveur après un clic sur « Aperçu ». */
		apercu?: string;
		admins?: { id: number; name: string; profilePublic: boolean }[];
	} = $props();

	/*
	 * Barre d'outils du texte. Chaque bouton insère la syntaxe Markdown à
	 * l'endroit du curseur, ou autour du passage sélectionné : on n'a plus à
	 * connaître la syntaxe par cœur. Elle n'apparaît que lorsque le script est
	 * chargé, puisqu'elle ne sert à rien sans lui.
	 */
	let zone = $state<HTMLTextAreaElement | null>(null);
	let scriptActif = $state(false);
	$effect(() => {
		scriptActif = true;
	});

	/** Entoure la sélection (ou un mot d'exemple) de `avant` et `apres`. */
	function entourer(avant: string, apres = avant, exemple = 'texte') {
		if (!zone) return;
		const debut = zone.selectionStart;
		const fin = zone.selectionEnd;
		const selection = zone.value.slice(debut, fin) || exemple;
		zone.setRangeText(avant + selection + apres, debut, fin, 'select');
		corps = zone.value;
		zone.setSelectionRange(debut + avant.length, debut + avant.length + selection.length);
		zone.focus();
	}

	/** Place `prefixe` au début de chaque ligne de la sélection. */
	function prefixerLignes(prefixe: string) {
		if (!zone) return;
		const fin = zone.selectionEnd;
		const debutLigne = zone.value.lastIndexOf('\n', zone.selectionStart - 1) + 1;
		const bloc = zone.value.slice(debutLigne, fin);
		const nouveau = bloc
			.split('\n')
			.map((ligne) => prefixe + ligne)
			.join('\n');
		zone.setRangeText(nouveau, debutLigne, fin, 'end');
		corps = zone.value;
		zone.focus();
	}

	const outils = [
		{ label: 'Gras', titre: 'Mettre en gras', action: () => entourer('**') },
		{ label: 'Italique', titre: 'Mettre en italique', action: () => entourer('*') },
		{ label: 'Titre', titre: 'Transformer la ligne en titre', action: () => prefixerLignes('## ') },
		{ label: 'Lien', titre: 'Insérer un lien', action: () => entourer('[', '](https://)', 'texte du lien') },
		{ label: 'Image', titre: 'Insérer une image (adresse à copier depuis la page Images)', action: () => entourer('![', '](/media/nom-du-fichier.jpg)', "description de l'image") },
		{ label: 'Citation', titre: 'Transformer en citation', action: () => prefixerLignes('> ') },
		{ label: 'Liste', titre: 'Transformer en liste', action: () => prefixerLignes('- ') }
	];

	// Les valeurs renvoyées après une erreur de validation ont la priorité,
	// pour ne pas faire perdre son texte à la personne qui rédige.
	function typeDepuisPublication() {
		return (
			valeurs.kind ??
			(publication?.kind === 'actu' && ['action', 'reunion', 'formation'].includes(publication.eventCategory)
				? publication.eventCategory
				: publication?.kind) ??
			'article'
		);
	}
	let typeSelectionne = $state(typeDepuisPublication());

	const modelesAction = {
		'porte-a-porte': {
			nom: 'Porte-à-porte',
			accroche:
				'Allons à la rencontre des habitantes et habitants du quartier pour échanger sur leurs préoccupations et présenter nos propositions.',
			texte:
				'Nous organisons un porte-à-porte dans le quartier. Venez avec nous rencontrer les habitantes et habitants, écouter leurs préoccupations et présenter nos propositions.\n\nAucune expérience n’est nécessaire : les nouvelles personnes sont les bienvenues.'
		},
		tractage: {
			nom: 'Tractage',
			accroche:
				'Retrouvons-nous pour diffuser nos propositions et échanger avec les passantes et les passants.',
			texte:
				'Nous nous retrouvons pour distribuer des tracts et échanger avec les passantes et les passants. Le matériel est fourni et les nouvelles personnes sont les bienvenues.'
		},
		collage: {
			nom: 'Collage d’affiches',
			accroche: 'Rendez-vous pour une soirée de collage d’affiches.',
			texte:
				'Nous nous retrouvons pour une soirée de collage d’affiches.\n\nLes secteurs de collage seront définis sur place en fonction des groupes d’action présents, afin de répartir les équipes et de concentrer le collage sur les différents secteurs.\n\nN’hésitez pas à nous rejoindre !'
		},
	} as const;

	type CategorieAction = keyof typeof modelesAction;
	function categorieActionInitiale(): CategorieAction {
		const categorie = valeurs.actionCategory ?? publication?.actionCategory ?? 'porte-a-porte';
		return categorie in modelesAction ? (categorie as CategorieAction) : 'porte-a-porte';
	}
	function resumeInitial() {
		return valeurs.summary ?? publication?.summary ?? '';
	}
	function titreInitial() {
		return valeurs.title ?? publication?.title ?? '';
	}
	function corpsInitial() {
		return valeurs.body ?? '';
	}
	function dateInitiale() {
		return valeurs.eventAt ?? publication?.eventAt ?? '';
	}
	function heureDebutInitiale() {
		return valeurs.eventStartTime ?? publication?.eventStartTime ?? '';
	}
	function heureFinInitiale() {
		return valeurs.eventEndTime ?? publication?.eventEndTime ?? '';
	}
	function lieuInitial() {
		return valeurs.eventLocation ?? publication?.eventLocation ?? '';
	}
	function pointRendezVousInitial() {
		return valeurs.eventMeetingPoint ?? publication?.eventMeetingPoint ?? '';
	}
	function auteurInitial() {
		return (
			valeurs.authorAdminId ??
			(publication?.authorAdminId ? String(publication.authorAdminId) : publication?.authorName ? 'other' : '')
		);
	}
	function carteIntegreeInitiale() {
		return valeurs.eventMapEmbed ?? publication?.eventMapEmbedUrl ?? '';
	}
	function extraireAdresseCarte(brut: string) {
		const attributSrc = brut.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
		let adresse = (attributSrc ?? brut).trim();
		const lienMarkdown = adresse.match(/\]\((https:\/\/[^)]+)\)/i);
		if (lienMarkdown) adresse = lienMarkdown[1];
		adresse = adresse.replaceAll('&amp;', '&');
		try {
			const url = new URL(adresse);
			return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/embed')
				? url.href
				: '';
		} catch {
			return '';
		}
	}

	let categorieActionSelectionnee = $state<CategorieAction>(categorieActionInitiale());
	let titre = $state(titreInitial());
	let resume = $state(resumeInitial());
	let corps = $state(corpsInitial());
	let dateRendezVous = $state(dateInitiale());
	let heureDebut = $state(heureDebutInitiale());
	let heureFin = $state(heureFinInitiale());
	let lieu = $state(lieuInitial());
	let pointRendezVous = $state(pointRendezVousInitial());
	let auteurChoisi = $state(auteurInitial());
	let carteIntegree = $state(carteIntegreeInitiale());
	let dernierModele = $state<CategorieAction | null>(null);
	let dernierTitreAutomatique = $state('');
	let dernierChapoAutomatique = $state('');

	function textesAutomatiques(categorie = categorieActionSelectionnee) {
		const modele = modelesAction[categorie];
		const nouveauTitre = lieu ? `${modele.nom} à ${lieu}` : modele.nom;
		const date = dateRendezVous ? `Le ${formatDateLongue(dateRendezVous)}` : '';
		const horaire = formatPlageHoraire(heureDebut, heureFin);
		const moment = [date, horaire].filter(Boolean).join(', ');
		const informations = [
			moment ? `${moment}.` : '',
			lieu ? `Lieu : ${lieu}.` : '',
			pointRendezVous ? `Point de rendez-vous : ${pointRendezVous}.` : ''
		].filter(Boolean);
		const nouveauChapo = [...informations, modele.accroche].join('\n');
		return { titre: nouveauTitre, chapo: nouveauChapo };
	}

	function actualiserTitreEtChapo(categorie = categorieActionSelectionnee) {
		const automatique = textesAutomatiques(categorie);
		if (!titre.trim() || titre === dernierTitreAutomatique) titre = automatique.titre;
		if (!resume.trim() || resume === dernierChapoAutomatique) resume = automatique.chapo;
		dernierTitreAutomatique = automatique.titre;
		dernierChapoAutomatique = automatique.chapo;
	}

	function choisirCategorieAction(categorie: CategorieAction) {
		const precedent = dernierModele ? modelesAction[dernierModele] : null;
		const suivant = modelesAction[categorie];
		if (!corps.trim() || corps === precedent?.texte) corps = suivant.texte;
		categorieActionSelectionnee = categorie;
		dernierModele = categorie;
		actualiserTitreEtChapo(categorie);
	}

	function choisirType(type: string) {
		typeSelectionne = type;
		if (type === 'action') choisirCategorieAction(categorieActionSelectionnee);
	}

	const v = $derived({
		kind: typeSelectionne,
		title: titre,
		summary: valeurs.summary ?? publication?.summary ?? '',
		body: valeurs.body ?? '',
		authorName: valeurs.authorName ?? publication?.authorName ?? '',
		status: valeurs.status ?? publication?.status ?? 'draft',
		commentsOpen: valeurs.commentsOpen ?? publication?.commentsOpen ?? true,
		pinned: valeurs.pinned ?? publication?.pinned ?? false,
		eventAt: dateRendezVous,
		eventCategory: valeurs.eventCategory ?? publication?.eventCategory ?? 'autre',
		actionCategory: categorieActionSelectionnee,
		eventStartTime: heureDebut,
		eventEndTime: heureFin,
		eventLocation: lieu,
		eventMeetingPoint: pointRendezVous,
		eventAddress: valeurs.eventAddress ?? publication?.eventAddress ?? '',
		eventLocationUrl: valeurs.eventLocationUrl ?? publication?.eventLocationUrl ?? '',
		eventManagers: valeurs.eventManagers ?? publication?.eventManagers ?? '',
		eventSignupUrl:
			valeurs.eventSignupUrl || publication?.eventSignupUrl ||
			(typeSelectionne === 'action' ? 'https://actionpopulaire.fr' : ''),
		eventMapEmbed: carteIntegree
	});

	const estRendezVous = $derived(['action', 'reunion', 'formation', 'apero'].includes(typeSelectionne));
	const apercuCarteIntegree = $derived(extraireAdresseCarte(carteIntegree));
</script>

{#if erreur}
	<p role="alert" class="alerte">{erreur}</p>
{/if}

<div class="grid gap-6 lg:grid-cols-[1fr_16rem]">
	<div class="space-y-4">
		<div>
			<label class="etiquette" for="title">Titre</label>
			<input id="title" name="title" class="champ text-lg font-semibold" required maxlength="200" bind:value={titre} />
		</div>

		<div>
			<label class="etiquette" for="summary">Chapô</label>
			<textarea id="summary" name="summary" class="champ" rows="2" maxlength="500" bind:value={resume}></textarea>
			<p class="aide">Une ou deux phrases affichées dans les listes et lors d'un partage.</p>
		</div>

		<div>
			<label class="etiquette" for="body">Texte</label>
			{#if scriptActif}
				<div class="mb-1 flex flex-wrap gap-1" role="toolbar" aria-label="Mise en forme du texte" aria-controls="body">
					{#each outils as outil (outil.label)}
						<button
							type="button"
							class="rounded border border-line-forte bg-carte px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-alt"
							title={outil.titre}
							onclick={outil.action}>{outil.label}</button
						>
					{/each}
				</div>
			{/if}
			<textarea id="body" name="body" class="champ font-mono text-sm" rows="22" bind:this={zone} bind:value={corps}></textarea>
			<p class="aide">
				Mise en forme au format Markdown : <code>## Titre</code>, <code>**gras**</code>,
				<code>*italique*</code>, <code>[lien](https://…)</code>, <code>&gt; citation</code>, une
				liste avec des tirets. Le HTML n'est pas interprété, c'est volontaire.
			</p>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<!-- L'aperçu est rendu par le serveur, avec exactement le code qui
				     affiche les pages publiques : ce qu'on voit est ce qu'on aura.
				     formnovalidate : un titre encore vide ne doit pas l'empêcher. -->
				<button class="bouton-secondaire" type="submit" formaction="?/apercu" formnovalidate>Aperçu du texte</button>
				<p class="aide mt-0">Affiche le texte tel qu'il apparaîtra sur le site, sans rien enregistrer.</p>
			</div>
		</div>

		{#if apercu}
			<section id="apercu" class="carte" aria-labelledby="apercu-titre">
				<h2 id="apercu-titre" class="text-sm font-bold tracking-wide text-ink-faint uppercase">Aperçu du texte</h2>
				<!-- HTML produit par markdown.ts (html: false) : aucune balise brute
				     saisie dans le texte n'est interprétée. -->
				<div class="contenu mt-4">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html apercu}
				</div>
			</section>
		{/if}
	</div>

	<aside class="space-y-4">
		<div class="carte space-y-4">
			<div>
				<label class="etiquette" for="kind">Type</label>
				<select
					id="kind"
					name="kind"
					class="champ"
					value={typeSelectionne}
					onchange={(event) => choisirType(event.currentTarget.value)}
				>
					<option value="article">Article</option>
					<option value="actu">Actualité</option>
					<option value="action">Action</option>
					<option value="reunion">Événement</option>
					<option value="formation">Formation</option>
					<option value="apero">Apéro thématique</option>
					<option value="revue">Revue de presse</option>
				</select>
				<p class="aide">
					Un seul choix suffit. Les champs utiles apparaissent automatiquement pour une action,
					un événement, une formation ou un apéro.
				</p>
			</div>

			<div>
				<label class="etiquette" for="status">État</label>
				<select id="status" name="status" class="champ">
					<option value="draft" selected={v.status === 'draft'}>Brouillon</option>
					<option value="published" selected={v.status === 'published'}>Publié</option>
				</select>
				<p class="aide">Un brouillon n'est visible que par les administrateurs connectés.</p>
			</div>


			{#if !estRendezVous}
				<div>
					<label class="etiquette" for="authorAdminId">Auteur</label>
					<select id="authorAdminId" name="authorAdminId" class="champ" bind:value={auteurChoisi}>
						<option value="">Aucun auteur</option>
						{#each admins as admin (admin.id)}
							<option value={String(admin.id)}>{admin.name}{admin.profilePublic ? ' · fiche publique' : ''}</option>
						{/each}
						<option value="other">Autre nom…</option>
					</select>
					{#if auteurChoisi === 'other'}
						<label class="sr-only" for="authorName">Nom de l’auteur</label>
						<input id="authorName" name="authorName" class="champ mt-2" maxlength="120" value={v.authorName} placeholder="Nom à afficher" />
					{/if}
					<p class="aide">Les noms avec une fiche publique seront cliquables sur le site.</p>
				</div>
			{/if}

			{#if estRendezVous}
				<div class="rounded-lg border border-brand/25 bg-brand-soft/40 p-3 space-y-3">
					<p class="text-sm font-bold text-brand">Informations pratiques</p>

					{#if typeSelectionne === 'action'}
						<div>
							<label class="etiquette" for="actionCategory">Type d’action</label>
							<select
								id="actionCategory"
								name="actionCategory"
								class="champ"
								value={categorieActionSelectionnee}
								onchange={(event) => choisirCategorieAction(event.currentTarget.value as CategorieAction)}
							>
								<option value="collage">Collage d’affiches</option>
								<option value="porte-a-porte">Porte-à-porte</option>
								<option value="tractage">Tractage / distribution</option>
							</select>
						<p class="aide">Le titre et le chapô sont calculés avec la date, les horaires et le lieu. Tout reste modifiable.</p>
						</div>
					{/if}

					<div>
						<label class="etiquette" for="eventAt">Date</label>
						<input id="eventAt" name="eventAt" type="date" class="champ" required value={dateRendezVous} onchange={(event) => { dateRendezVous = event.currentTarget.value; actualiserTitreEtChapo(); }} />
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="etiquette" for="eventStartTime">Début</label>
							<input id="eventStartTime" name="eventStartTime" type="time" class="champ" value={heureDebut} onchange={(event) => { heureDebut = event.currentTarget.value; actualiserTitreEtChapo(); }} />
						</div>
						<div>
							<label class="etiquette" for="eventEndTime">Fin</label>
							<input id="eventEndTime" name="eventEndTime" type="time" class="champ" value={heureFin} onchange={(event) => { heureFin = event.currentTarget.value; actualiserTitreEtChapo(); }} />
						</div>
					</div>

					<div>
						<label class="etiquette" for="eventLocation">Lieu</label>
						<input id="eventLocation" name="eventLocation" class="champ" maxlength="200" value={lieu} placeholder="Place Charlie Chaplin" oninput={(event) => { lieu = event.currentTarget.value; actualiserTitreEtChapo(); }} />
					</div>
					<div>
						<label class="etiquette" for="eventMeetingPoint">Point de rendez-vous <span class="font-normal text-ink-faint">(facultatif)</span></label>
						<input id="eventMeetingPoint" name="eventMeetingPoint" class="champ" maxlength="300" value={pointRendezVous} placeholder="Devant l’entrée principale" oninput={(event) => { pointRendezVous = event.currentTarget.value; actualiserTitreEtChapo(); }} />
					</div>
					<div>
						<label class="etiquette" for="eventAddress">Adresse</label>
						<textarea id="eventAddress" name="eventAddress" class="champ" rows="2" maxlength="300" placeholder="21000 Dijon">{v.eventAddress}</textarea>
					</div>
					<div>
						<label class="etiquette" for="eventLocationUrl">Lien vers le lieu</label>
						<input id="eventLocationUrl" name="eventLocationUrl" type="url" class="champ" maxlength="500" value={v.eventLocationUrl} placeholder="https://maps.app.goo.gl/…" />
					</div>

					{#if typeSelectionne === 'action'}
						<div class="space-y-2 rounded border border-line bg-carte p-2.5">
							<label class="etiquette" for="eventMapEmbed">Carte Google Maps intégrée <span class="font-normal text-ink-faint">(facultatif)</span></label>
							<textarea id="eventMapEmbed" name="eventMapEmbed" class="champ font-mono text-xs" rows="4" maxlength="8000" placeholder="Collez ici le code <iframe …></iframe> fourni par Google Maps" bind:value={carteIntegree}></textarea>
							<p class="aide">Vous pouvez coller le code iframe complet ou seulement son lien. Seule l’adresse sécurisée de la carte sera conservée.</p>
							{#if apercuCarteIntegree}
								<iframe
									src={apercuCarteIntegree}
									title="Aperçu de la carte du lieu"
									class="aspect-video w-full rounded border border-line"
									loading="lazy"
									referrerpolicy="strict-origin-when-cross-origin"
									allowfullscreen
								></iframe>
							{:else if carteIntegree.trim()}
								<p class="text-xs font-semibold text-accent">Le code collé ne contient pas encore une adresse Google Maps intégrable.</p>
							{/if}
						</div>
						<div class="space-y-2 rounded border border-line bg-carte p-2.5">
							<p class="etiquette mb-0">Capture de la carte <span class="font-normal text-ink-faint">(solution de repli)</span></p>
							{#if publication?.eventMap}
								<img src={publication.eventMap.url} alt={publication.eventMap.alt} class="aspect-video w-full rounded object-cover" />
								<label class="flex items-start gap-2 text-xs text-ink">
									<input type="checkbox" name="retirerCarte" value="1" class="mt-0.5" />
									<span>Retirer cette capture</span>
								</label>
							{/if}
							<label class="sr-only" for="eventMap">Ajouter une capture de la carte</label>
							<input id="eventMap" name="eventMap" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="champ" />
							<label class="sr-only" for="eventMapAlt">Description de la carte</label>
							<input id="eventMapAlt" name="eventMapAlt" class="champ" maxlength="300" value={publication?.eventMap?.alt ?? ''} placeholder="Carte du point de rendez-vous" />
							<p class="aide">L’image est conservée sur le site. Au clic, elle ouvre le lien vers le lieu.</p>
						</div>
						<div>
							<label class="etiquette" for="eventSignupUrl">Lien pour prévenir de sa venue</label>
							<input id="eventSignupUrl" name="eventSignupUrl" type="url" class="champ" maxlength="500" value={v.eventSignupUrl} placeholder="https://actionpopulaire.fr/evenements/…" />
							<p class="aide">La fiche invitera les personnes à signaler leur venue sur ce lien.</p>
						</div>
					{/if}

					<fieldset class="rounded border border-line bg-carte p-2.5">
						<legend class="etiquette px-1">Responsable{admins.length > 1 ? 's' : ''}</legend>
						{#if admins.length}
							<div class="space-y-2">
								{#each admins as admin (admin.id)}
									<label class="flex items-start gap-2 text-sm text-ink">
										<input
											type="checkbox"
											name="eventManagerAdminIds"
											value={admin.id}
											checked={(valeurs.eventManagerAdminIds ?? publication?.eventManagerAdminIds ?? []).includes(admin.id)}
											class="mt-0.5"
										/>
										<span>{admin.name}{admin.profilePublic ? ' · fiche publique' : ''}</span>
									</label>
								{/each}
							</div>
						{/if}
						<label class="etiquette mt-3" for="eventManagers">Autre nom ou équipe</label>
						<input id="eventManagers" name="eventManagers" class="champ" maxlength="300" value={v.eventManagers} placeholder="Nom à afficher" />
						<p class="aide">Les responsables ayant une fiche publique seront cliquables.</p>
					</fieldset>
				</div>
			{/if}

			<label class="flex items-start gap-2 text-sm text-ink">
				<input type="checkbox" name="commentsOpen" value="1" checked={v.commentsOpen} class="mt-0.5" />
				<span>Autoriser les commentaires</span>
			</label>

			<label class="flex items-start gap-2 text-sm text-ink">
				<input type="checkbox" name="pinned" value="1" checked={v.pinned} class="mt-0.5" />
				<span>Épingler en haut des listes</span>
			</label>
		</div>

		<div class="carte space-y-3">
			<p class="etiquette mb-0">Image de couverture</p>

			{#if publication?.cover}
				<img src={publication.cover.url} alt={publication.cover.alt} class="w-full rounded" />
				<label class="flex items-start gap-2 text-sm text-ink">
					<input type="checkbox" name="retirerCouverture" value="1" class="mt-0.5" />
					<span>Retirer cette image</span>
				</label>
			{/if}

			<div>
				<label class="etiquette" for="cover">
					{publication?.cover ? 'Remplacer par' : 'Ajouter une image'}
				</label>
				<input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="champ" />
				<p class="aide">JPEG, PNG, WebP, GIF ou AVIF. 5 Mo maximum.</p>
			</div>

			<div>
				<label class="etiquette" for="coverAlt">Description de l'image</label>
				<input id="coverAlt" name="coverAlt" class="champ" maxlength="300" value={publication?.cover?.alt ?? ''} />
				<p class="aide">Lue par les personnes non voyantes. Décrivez ce que montre l'image.</p>
			</div>
		</div>

		<button class="bouton w-full justify-center" type="submit">{libelleValider}</button>
	</aside>
</div>

<script lang="ts">
	import Metadonnees from '$lib/components/Metadonnees.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<!-- Hors index : ces pages sont obligatoires, pas destinées aux moteurs. -->
<Metadonnees
	titre="Confidentialité — {data.settings.siteName}"
	description="Ce site n'utilise aucun traceur publicitaire et ne conserve aucune adresse IP en clair. Certaines pages peuvent intégrer une carte Google Maps."
	indexable={false}
/>

<header class="border-b border-line pb-4">
	<h1 class="text-3xl font-extrabold text-ink sm:text-4xl">Confidentialité</h1>
	<p class="mt-2 max-w-2xl text-ink-soft">
		Ce site est conçu pour en savoir le moins possible sur vous.
	</p>
</header>

<div class="contenu mt-5 max-w-2xl">
	<h2>Ce que ce site ne fait pas</h2>
	<ul>
		<li>Le site lui-même ne dépose aucun cookie chez les visiteurs.</li>
		<li>Aucun outil de mesure d'audience, aucun traceur publicitaire, aucune police d'écriture distante.</li>
		<li>Aucun compte n'est nécessaire pour lire ou commenter.</li>
		<li>Les données confiées au site ne sont ni vendues ni utilisées à des fins publicitaires.</li>
	</ul>

	<h2>Cartes Google Maps</h2>
	<p>
		Certaines fiches d’action peuvent afficher une carte intégrée fournie par Google Maps. Lorsque cette
		carte est chargée, le navigateur contacte les serveurs de Google, qui applique alors sa propre
		politique de confidentialité. Le reste du contenu de la fiche demeure lisible sans interagir avec la carte.
	</p>

	<h2>Quand vous publiez un commentaire</h2>
	<p>Sont enregistrés :</p>
	<ul>
		<li>le texte de votre message et le pseudonyme facultatif que vous choisissez ;</li>
		<li>la date d'envoi ;</li>
		<li>
			une <strong>empreinte cryptographique de votre adresse IP</strong>, et non l'adresse
			elle-même. Cette empreinte sert uniquement à limiter le spam et à bloquer un envoi massif.
			Elle est irréversible : elle ne permet pas de retrouver votre adresse IP.
		</li>
	</ul>
	<p>
		Choisissez un pseudonyme qui ne vous identifie pas si vous souhaitez rester anonyme, et évitez
		de mentionner dans votre message des informations personnelles vous concernant ou concernant
		des tiers.
	</p>

	<h2>Journaux techniques</h2>
	<p>
		L'hébergeur conserve des journaux de connexion, comme l'impose la réglementation française. Le
		site lui-même ne conserve pas d'adresse IP en clair.
	</p>

	<h2>Durées de conservation</h2>
	<ul>
		<li>Commentaires publiés : jusqu'à leur suppression par l'équipe ou à votre demande.</li>
		<li>Commentaires refusés : supprimés régulièrement.</li>
		<li>Compteurs anti-spam : 24 heures.</li>
	</ul>

	<h2>Vos droits</h2>
	<p>
		Vous pouvez demander la suppression d'un commentaire que vous avez publié en écrivant à
		l'adresse de contact du site{data.settings.contactEmail ? ` (${data.settings.contactEmail})` : ''}.
		Indiquez l'adresse de la page et le contenu du message afin que nous puissions l'identifier.
	</p>

	<h2>Administration du site</h2>
	<p>
		Les personnes qui administrent le site disposent d'un compte protégé par un mot de passe et une
		double authentification. Un cookie de session, strictement nécessaire au fonctionnement, est
		déposé uniquement sur leur navigateur après connexion.
	</p>
</div>

<script lang="ts">
 import { enhance } from '$app/forms';
 import Metadonnees from '$lib/components/Metadonnees.svelte';
 import PreuveDeTravail from '$lib/components/PreuveDeTravail.svelte';
 import type { PageData, ActionData } from './$types';
 let { data, form }: { data: PageData; form: ActionData } = $props();
 let sending = $state(false);
 const values = $derived(form?.values ?? {});
</script>
<Metadonnees titre="Proposer un dessin - {data.settings.siteName}" description="Proposez votre dessin ou caricature à la galerie collaborative. Chaque envoi est vérifié avant publication." />
<a class="text-sm font-semibold text-brand hover:underline" href="/dessins">← La galerie</a>
<header class="mt-6 border-b border-line pb-4">
 <p class="text-xs font-bold tracking-[0.2em] text-brand uppercase">La galerie collaborative</p>
 <h1 class="titre-affiche mt-2 text-3xl text-ink sm:text-4xl">Proposer un dessin</h1>
 <p class="mt-3 max-w-2xl text-lg text-ink-soft">Partagez vos dessins et caricatures, sans créer de compte. L’équipe les vérifie avant leur publication dans la galerie.</p>
</header>
{#if form?.success}
 <section class="carte mt-6" role="status"><h2 class="text-xl font-bold text-ink">Merci pour votre proposition !</h2><p class="mt-3 text-ink-soft">Votre dessin a été envoyé à l’équipe. Il restera privé tant qu’il n’aura pas été accepté. Il apparaîtra dans la galerie après validation.</p><a class="bouton-secondaire mt-5" href="/dessins">Retour à la galerie</a></section>
{:else}
 <form class="mt-6 max-w-2xl space-y-5" method="POST" enctype="multipart/form-data" use:enhance={() => { sending = true; return async ({ update }) => { try { await update({ reset: false }); } finally { sending = false; } }; }}>
  {#if form?.error}<p class="alerte" role="alert">{form.error}</p>{/if}
  <div><label class="etiquette" for="title">Titre du dessin</label><input id="title" name="title" value={values.title ?? ''} class="champ" required maxlength="180" /></div>
  <div><label class="etiquette" for="author">Votre nom ou pseudonyme</label><input id="author" name="author" value={values.author ?? ''} class="champ" required maxlength="120" /><p class="aide">Ce nom sera affiché avec votre dessin. Aucun compte ni adresse e-mail n’est nécessaire.</p></div>
  <div><label class="etiquette" for="image">Votre dessin ou caricature</label><input id="image" name="image" type="file" class="champ" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required /><p class="aide">JPEG, PNG, WebP, GIF ou AVIF, 5 Mo maximum. Gardez votre signature dans l’image.</p></div>
  <div><label class="etiquette" for="alt">Décrivez le dessin</label><textarea id="alt" name="alt" class="champ" required maxlength="300" rows="3">{values.alt ?? ''}</textarea><p class="aide">Cette description permet aux personnes qui ne voient pas l’image de la comprendre.</p></div>
  <div><label class="etiquette" for="caption">Une légende ou un mot de contexte (facultatif)</label><textarea id="caption" name="caption" class="champ" maxlength="2000" rows="3">{values.caption ?? ''}</textarea></div>
  <div><label class="etiquette" for="rights">Quelles utilisations autorisez-vous ?</label><textarea id="rights" name="rights" class="champ" required maxlength="500" rows="2" placeholder="Par exemple : partage autorisé avec mon nom, sans modification et sans utilisation commerciale.">{values.rights ?? ''}</textarea><p class="aide">Ces conditions seront affichées avec le dessin. Après validation, les visiteurs pourront télécharger l’image originale.</p></div>
  <label class="flex items-start gap-3 text-sm text-ink-soft"><input class="mt-1" type="checkbox" name="permission" required />Je suis l’auteur de ce dessin ou j’ai son autorisation pour sa publication et son téléchargement selon les conditions indiquées.</label>
  <div class="hidden" aria-hidden="true"><label for="site">Votre site</label><input id="site" name="site" autocomplete="off" tabindex="-1" /></div>
  <PreuveDeTravail defi={data.challenge} />
  <p class="text-sm text-ink-soft">Les propositions sont relues par l’équipe. Elles ne sont jamais publiées automatiquement. <a class="text-brand underline" href="/confidentialite">Confidentialité</a></p>
  <button class="bouton" type="submit" disabled={sending}>{sending ? 'Envoi en cours…' : 'Envoyer à l’équipe'}</button>
 </form>
{/if}

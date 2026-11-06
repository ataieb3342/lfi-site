<script lang="ts">
 import { enhance } from '$app/forms';
 type DrawingValues = { id: number; title: string; author: string; caption: string; alt: string; rights: string; published: boolean };
 let { drawing = null }: { drawing?: DrawingValues | null } = $props();
 const prefix = $derived(`drawing-${drawing?.id ?? 'new'}`);
</script>
<form use:enhance method="POST" action="?/save" enctype="multipart/form-data" class="space-y-5">
 {#if drawing}<input type="hidden" name="id" value={drawing.id} />{/if}
 <div><label class="etiquette" for="{prefix}-title">Titre</label><input class="champ" id="{prefix}-title" name="title" required maxlength="180" value={drawing?.title ?? ''} /></div>
 <div><label class="etiquette" for="{prefix}-author">Auteur ou pseudonyme</label><input class="champ" id="{prefix}-author" name="author" required maxlength="120" value={drawing?.author ?? ''} /></div>
 <div><label class="etiquette" for="{prefix}-image">{drawing ? 'Remplacer l’image (facultatif)' : 'Dessin'}</label><input class="champ" type="file" id="{prefix}-image" name="image" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required={!drawing} /><p class="mt-1 text-sm text-ink-faint">JPEG, PNG, WebP, GIF ou AVIF, 5 Mo maximum. L’image reste entière et sans modification.</p></div>
 <div><label class="etiquette" for="{prefix}-alt">Description du dessin pour les personnes qui ne voient pas l’image</label><textarea class="champ" id="{prefix}-alt" name="alt" required maxlength="300" rows="3">{drawing?.alt ?? ''}</textarea></div>
 <div><label class="etiquette" for="{prefix}-caption">Légende (facultative)</label><textarea class="champ" id="{prefix}-caption" name="caption" maxlength="2000" rows="3">{drawing?.caption ?? ''}</textarea></div>
 <div><label class="etiquette" for="{prefix}-rights">Conditions de partage convenues avec l’auteur</label><textarea class="champ" id="{prefix}-rights" name="rights" required maxlength="500" rows="2" placeholder="Précisez les mentions à conserver et les utilisations autorisées.">{drawing?.rights ?? ''}</textarea></div>
 <label class="flex items-start gap-3 text-sm text-ink-soft"><input class="mt-1" type="checkbox" name="permission" required />Je dispose de l’autorisation de l’auteur pour publier ce dessin et proposer son téléchargement.</label>
 <label class="flex items-center gap-3 font-semibold text-ink"><input type="checkbox" name="published" checked={drawing?.published ?? false} />Afficher dans la galerie publique</label>
 <button class="bouton" type="submit">{drawing ? 'Enregistrer les modifications' : 'Ajouter le dessin'}</button>
</form>

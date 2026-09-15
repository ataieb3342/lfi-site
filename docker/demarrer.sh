#!/bin/sh
# Point d'entrée du conteneur.
#
# ORIGIN est l'adresse publique du site, indispensable à SvelteKit pour
# accepter les formulaires. En production elle vient de .env. Sur Render (site
# de démonstration), elle n'est pas connue à l'avance : Render la fournit dans
# RENDER_EXTERNAL_URL, on la reprend si ORIGIN est vide.
if [ -z "$ORIGIN" ] && [ -n "$RENDER_EXTERNAL_URL" ]; then
	export ORIGIN="$RENDER_EXTERNAL_URL"
fi

exec node build/index.js

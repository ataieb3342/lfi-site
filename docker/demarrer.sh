#!/bin/sh
# Point d'entrée du conteneur.
#
# ORIGIN, l'adresse publique du site indispensable à SvelteKit pour accepter
# les formulaires, vient de .env. (Le site de démonstration sur Render, qui la
# lisait dans RENDER_EXTERNAL_URL, a été retiré en novembre 2026.)
exec node build/index.js

#!/bin/sh
# Restauration d'une sauvegarde.
#
#     ./scripts/restauration.sh sauvegardes/site-2026-09-03_04h30.tar.gz
#
# Le site est arrêté le temps de la restauration, les données actuelles sont
# mises de côté (et non supprimées) avant d'être remplacées.

set -eu

if [ $# -ne 1 ]; then
	echo "Usage : $0 <archive.tar.gz>" >&2
	exit 1
fi

ARCHIVE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f $RACINE/docker/compose.yml"
HORODATAGE="$(date +%Y-%m-%d_%Hh%M)"

[ -f "$ARCHIVE" ] || { echo "Archive introuvable : $ARCHIVE" >&2; exit 1; }

echo "→ Arrêt du site…"
$COMPOSE stop site

if [ -d "$RACINE/data" ]; then
	echo "→ Mise de côté des données actuelles dans data.avant-$HORODATAGE…"
	mv "$RACINE/data" "$RACINE/data.avant-$HORODATAGE"
fi

mkdir -p "$RACINE/data"
tar -xzf "$ARCHIVE" -C "$RACINE/data"

echo "→ Redémarrage…"
$COMPOSE start site

echo "✓ Restauration terminée."
echo
echo "Si SECRET_KEY a changé depuis cette sauvegarde, les codes de double"
echo "authentification ne fonctionneront plus : remettez l'ancienne valeur"
echo "dans .env, ou réinitialisez la 2FA depuis un compte responsable."

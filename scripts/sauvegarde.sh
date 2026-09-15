#!/bin/sh
# Sauvegarde du site : base de données + images, dans une archive datée.
#
# À lancer depuis la racine du projet, sur le serveur :
#     ./scripts/sauvegarde.sh
#
# Pour une sauvegarde quotidienne automatique, ajoutez au crontab (crontab -e) :
#     30 4 * * * cd /srv/lfi-site && ./scripts/sauvegarde.sh >> /var/log/sauvegarde-site.log 2>&1
#
# IMPORTANT : copier data/site.db à la main ne suffit PAS. En mode WAL, les
# écritures récentes vivent dans un fichier séparé et la copie serait
# incomplète. `VACUUM INTO` produit un instantané cohérent, sans interrompre
# le site.

set -eu

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f $RACINE/docker/compose.yml"
DESTINATION="${DESTINATION:-$RACINE/sauvegardes}"
JOURS_CONSERVES="${JOURS_CONSERVES:-30}"
HORODATAGE="$(date +%Y-%m-%d_%Hh%M)"

mkdir -p "$DESTINATION"
mkdir -p "$RACINE/data/uploads" "$RACINE/data/bibliotheque"

echo "→ Instantané cohérent de la base…"
$COMPOSE exec -T site node -e "
  const { DatabaseSync } = require('node:sqlite');
  const fs = require('node:fs');
  fs.rmSync('/app/data/.instantane.db', { force: true });
  const base = new DatabaseSync(process.env.DATABASE_PATH);
  base.exec(\"vacuum into '/app/data/.instantane.db'\");
  base.close();
"

echo "→ Archivage de la base, des images et des PDF…"
tar -czf "$DESTINATION/site-$HORODATAGE.tar.gz" \
	-C "$RACINE/data" \
	--transform 's|^\.instantane\.db$|site.db|' \
	.instantane.db uploads bibliotheque

rm -f "$RACINE/data/.instantane.db"
chmod 600 "$DESTINATION/site-$HORODATAGE.tar.gz"

echo "→ Suppression des sauvegardes de plus de $JOURS_CONSERVES jours…"
find "$DESTINATION" -name 'site-*.tar.gz' -mtime "+$JOURS_CONSERVES" -delete

echo "✓ $DESTINATION/site-$HORODATAGE.tar.gz ($(du -h "$DESTINATION/site-$HORODATAGE.tar.gz" | cut -f1))"
echo
echo "Pensez à copier cette archive AILLEURS que sur le serveur."
echo "Une sauvegarde qui vit sur la machine sauvegardée ne protège de rien."

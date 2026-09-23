#!/bin/sh
# Déploiement du site : récupère ce qui a été poussé sur `main` et redémarre.
#
# Lancé toutes les cinq minutes par /etc/cron.d/deploiement-site, et
# utilisable à la main :
#     ssh lfi '/srv/lfi-site/scripts/deployer.sh'
#
# S'il n'y a rien de neuf, il ne fait rien et ne dit rien — il peut donc
# tourner en boucle sans remplir le journal ni sauvegarder pour rien.

set -eu

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f $RACINE/docker/compose.yml"
cd "$RACINE"

# Un seul déploiement à la fois : une compilation dure plusieurs minutes, et
# cron relance le script avant qu'elle ne soit finie. Sans ce verrou, deux
# `git pull` et deux compilations se marchent dessus.
exec 9>/var/lock/deploiement-site.lock
if ! flock -n 9; then
	exit 0
fi

git fetch -q origin main

AVANT="$(git rev-parse HEAD)"
APRES="$(git rev-parse origin/main)"
if [ "$AVANT" = "$APRES" ]; then
	exit 0
fi

echo "=== $(date '+%Y-%m-%d %H:%M') — déploiement $(echo "$AVANT" | cut -c1-7) → $(echo "$APRES" | cut -c1-7) ==="

# La sauvegarde d'abord : une migration de base ne se rejoue pas à l'envers.
"$RACINE/scripts/sauvegarde.sh"

# --ff-only : si quelqu'un a modifié le serveur à la main, on s'arrête au lieu
# d'inventer une fusion. Le déploiement échoue bruyamment, ce qui est voulu.
git pull --ff-only origin main

# Le Caddyfile est monté comme fichier dans le conteneur : `git pull` le
# remplace par un nouveau fichier, que le conteneur en cours ne voit pas. Il
# faut le recréer, sinon la configuration servie reste l'ancienne.
if git diff --name-only "$AVANT" HEAD | grep -q '^docker/Caddyfile$'; then
	CADDY_A_RECREER=1
else
	CADDY_A_RECREER=0
fi

# Si la compilation échoue, `up` s'interrompt et les conteneurs en place
# continuent de servir l'ancienne version. Un commit cassé ne coupe pas le site.
$COMPOSE up -d --build

if [ "$CADDY_A_RECREER" = 1 ]; then
	echo "→ Caddyfile modifié : on recrée le conteneur caddy."
	$COMPOSE up -d --force-recreate caddy
fi

echo "✓ en ligne : $(git log --oneline -1)"

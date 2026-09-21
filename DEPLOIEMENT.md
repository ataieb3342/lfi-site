# Mise en production

Cible : un VPS français chez **OVH** ou **Scaleway** (environ 5 €/mois, la plus
petite offre suffit largement). Les deux incluent une protection anti-déni de
service en amont, ce qui est le point important pour un site politique : la
majorité des « attaques » subies par les sites militants sont des saturations,
pas des piratages.

## 1. Préparer le serveur

**Debian 13**, en root. Sur une image OVH, on se connecte d'abord avec
l'utilisateur `debian`, puis `sudo -i` — le mot de passe initial est envoyé par
courriel et le système impose de le changer à la première connexion.

Le nom du paquet Compose change d'une distribution à l'autre : c'est
`docker-compose` sur Debian 13 (Compose v2, greffon `docker compose`),
`docker-compose-v2` sur Ubuntu 24.04. **Debian 12 ne convient pas** : elle n'a
que Compose v1, abandonné depuis 2023.

```bash
apt update && DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt upgrade -y
apt install -y docker.io docker-compose git ufw unattended-upgrades

# Vérification : doit afficher « Docker Compose version v2.… »
docker compose version

# Mises à jour de sécurité automatiques
dpkg-reconfigure -plow unattended-upgrades

# Pare-feu : rien d'ouvert sauf SSH et le web
ufw default deny incoming
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Durcir l'accès SSH — dans `/etc/ssh/sshd_config` :

```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

puis `systemctl restart ssh`. **Vérifiez que votre clé SSH fonctionne dans un
second terminal avant de fermer le premier.**

## 2. Faire pointer le nom de domaine

Chez votre registrar, créez un enregistrement `A` (et `AAAA` si vous avez une
IPv6) vers l'adresse du serveur. Attendez que `dig +short votre-domaine.fr`
renvoie la bonne adresse avant de continuer : Caddy a besoin que le domaine
résolve pour obtenir le certificat HTTPS.

## 3. Installer le site

```bash
mkdir -p /srv && cd /srv
git clone <adresse-du-dépôt> lfi-site
cd lfi-site

cp .env.example .env
```

Éditez `.env` :

```bash
# Générez la clé et collez-la :  openssl rand -base64 48
SECRET_KEY=…

ORIGIN=https://votre-domaine.fr
SITE_DOMAIN=votre-domaine.fr
ADMIN_EMAIL=contact@votre-domaine.fr

DATABASE_PATH=/app/data/site.db
UPLOADS_PATH=/app/data/uploads
BIBLIOTHEQUE_PATH=/app/data/bibliotheque
ADDRESS_HEADER=X-Forwarded-For
XFF_DEPTH=1
BODY_SIZE_LIMIT=60M
PORT=3000
NODE_ENV=production
```

Deux variables méritent une explication :

- **`SECRET_KEY`** protège les sessions, les secrets de double authentification
  et la pseudonymisation des adresses IP. Sauvegardez-la avec vos données : la
  perdre invalide toutes les 2FA. La changer déconnecte tout le monde.
- **`ORIGIN`** doit correspondre exactement à l'adresse publique. Sans elle,
  SvelteKit rejette tous les envois de formulaire (protection anti-CSRF).

Puis :

```bash
chmod 600 .env
docker compose -f docker/compose.yml up -d --build
```

## 4. Créer le premier compte

```bash
docker compose -f docker/compose.yml logs site | grep -A2 "AUCUN COMPTE"
```

Le jeton d'installation s'affiche. Ouvrez `https://votre-domaine.fr/admin/installation`,
saisissez-le, créez votre compte, activez la double authentification.

Cette page se ferme définitivement dès que le premier compte existe.

## 5. Sauvegardes

```bash
crontab -e
```

```
30 4 * * * cd /srv/lfi-site && ./scripts/sauvegarde.sh >> /var/log/sauvegarde-site.log 2>&1
```

**Copiez les archives ailleurs.** Une sauvegarde qui ne vit que sur la machine
sauvegardée ne protège de rien. Un `rsync` nocturne vers un poste du groupe, ou
vers un espace de stockage chez un autre hébergeur, suffit.

Pour restaurer : `./scripts/restauration.sh sauvegardes/site-….tar.gz`

## 6. Mettre à jour le site

```bash
cd /srv/lfi-site
./scripts/sauvegarde.sh          # d'abord une sauvegarde
git pull
docker compose -f docker/compose.yml up -d --build
```

Les migrations de base de données s'appliquent toutes seules au démarrage.

## Ce que ce dispositif protège — et ce qu'il ne protège pas

**Protégé :** injection de script (CSP stricte, HTML non interprété), injection
SQL (requêtes préparées partout), CSRF (contrôle d'origine de SvelteKit),
force brute sur les mots de passe (verrouillage + double authentification),
spam de commentaires (preuve de travail, quotas, pré-modération), lecture de
fichiers arbitraires (les images sont servies depuis la base), fuite de données
personnelles (aucune IP en clair, secrets 2FA chiffrés).

**Non protégé par le code :**

- **La saturation réseau.** C'est l'anti-DDoS de l'hébergeur qui joue ce rôle.
  En cas d'attaque sérieuse, mettre le site derrière un service de filtrage est
  la seule réponse efficace.
- **Un ordinateur d'administrateur compromis.** Aucune protection côté serveur
  ne survit à un poste infecté.
- **L'hameçonnage.** La double authentification par code élève beaucoup la
  barre mais ne l'élimine pas : ne saisissez jamais vos identifiants depuis un
  lien reçu par message, tapez toujours l'adresse vous-même.

**Trois habitudes qui comptent plus que le reste :** un mot de passe unique et
long par personne, la 2FA active partout, et une sauvegarde vérifiée ailleurs
qu'sur le serveur.

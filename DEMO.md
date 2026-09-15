# Site de démonstration

Pour faire tester le site avant la vraie mise en production, sans serveur à
payer : un hébergement gratuit chez **Render**, une adresse en
`https://….onrender.com`, et des contenus fictifs chargés automatiquement.

## Ce que fait le mode démonstration

Le site démarre avec la variable `MODE_DEMO=1`. Au premier chargement, si la
base est vide :

- des articles, des actualités (dont trois actions à venir, pour voir le
  carrousel et le tri « agenda ») et quelques commentaires fictifs sont créés ;
- un compte administrateur `demo` est créé, double authentification comprise ;
- la page `/admin/connexion` affiche l'identifiant, le mot de passe et le code
  à 6 chiffres du moment : **n'importe qui peut essayer l'administration**.

Un bandeau jaune en haut de chaque page rappelle que tout est fictif, et le
site demande aux moteurs de recherche de ne pas l'indexer.

## Les limites de l'offre gratuite

- **Le site s'endort après 15 minutes sans visite.** La première personne qui
  arrive ensuite attend 30 à 60 secondes que le site se réveille. C'est normal.
- **Tout est effacé à chaque réveil et à chaque redéploiement.** Les articles
  écrits par les testeurs, les commentaires, les images envoyées : tout
  disparaît, et les contenus fictifs sont rechargés. C'est un terrain de jeu,
  pas un site.
- Le serveur est à Francfort. Pour la vraie mise en production, voir
  `DEPLOIEMENT.md` (hébergeur français).

## Mise en place

### 1. Mettre le code sur GitHub

Render lit le code depuis un dépôt Git. Créez un dépôt **privé** sur
https://github.com (compte gratuit), puis dans le dossier du projet :

```bash
git init -b main
git add .
git commit -m "Site LFI Dijon"
git remote add origin https://github.com/VOTRE-COMPTE/lfi-site.git
git push -u origin main
```

Le fichier `.gitignore` exclut déjà `.env`, `data/` et les bases SQLite :
aucun secret ni aucune donnée ne part sur GitHub.

### 2. Créer le service sur Render

1. Créez un compte sur https://render.com (l'inscription avec le compte GitHub
   est la plus simple, aucune carte bancaire n'est demandée).
2. Tableau de bord → **New** → **Blueprint**.
3. Choisissez le dépôt `lfi-site`. Render lit `render.yaml` et propose un
   service `lfi-dijon-demo` sur l'offre gratuite. Validez.
4. Le premier déploiement prend 3 à 5 minutes (construction de l'image Docker).

À la fin, Render affiche l'adresse du site, du type
`https://lfi-dijon-demo.onrender.com`. Si le nom est déjà pris, Render ajoute
un suffixe : ça ne change rien, l'adresse est lue automatiquement.

### 3. Vérifier

- Ouvrez l'adresse : le bandeau jaune et les contenus fictifs doivent être là.
- Ouvrez `/admin` : les identifiants s'affichent sur la page de connexion.

### Mettre à jour la démo

Chaque `git push` sur `main` redéploie automatiquement. Les contenus fictifs
sont rechargés à cette occasion.

### Changer le mot de passe du compte de test

Dans Render → le service → **Environment**, ajoutez `DEMO_MOT_DE_PASSE` (12
caractères minimum). Il reste affiché sur la page de connexion : ce n'est pas
une protection, juste un moyen d'éviter le mot de passe par défaut.

## Tester en local

```bash
MODE_DEMO=1 npm run dev
```

Pour repartir de zéro : arrêtez le serveur, supprimez `data/site.db` (et les
fichiers `site.db-wal`, `site.db-shm` s'ils existent), relancez.

## Arrêter la démo

Render → le service → **Settings** → **Delete Web Service**. Le site disparaît
immédiatement, rien n'est facturé.

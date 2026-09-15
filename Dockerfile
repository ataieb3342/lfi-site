# ---------------------------------------------------------------- compilation
FROM node:24-alpine AS build

WORKDIR /app

# Les dépendances d'abord : cette couche est mise en cache tant que
# package-lock.json ne change pas, les reconstructions sont donc rapides.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ------------------------------------------------------------------ exécution
FROM node:24-alpine

# `node:sqlite` (base de données) et `crypto.scrypt` (mots de passe) font partie
# de Node : aucune bibliothèque native à compiler, donc aucune mise à jour de
# Node ne peut casser l'installation.

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/site.db
ENV UPLOADS_PATH=/app/data/uploads

# Le site ne tourne jamais en root : si une faille permettait d'exécuter du
# code, celui-ci n'aurait pas les droits d'écrire ailleurs que dans /app/data.
RUN addgroup -S site && adduser -S -G site site

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

RUN mkdir -p /app/data/uploads && chown -R site:site /app/data
USER site

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "build/index.js"]

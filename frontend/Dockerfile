# syntax=docker/dockerfile:1.7

# ---------- build ----------
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app

# Vite/Rollup necesitan devDependencies (react, vite). NODE_ENV=production las omite en npm ci.
ENV CI=true
ENV NODE_ENV=development

COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --no-audit --no-fund \
 && node -e " \
  for (const p of ['@dnd-kit/utilities','motion-utils','recharts','classcat','zustand','vite']) { \
    require.resolve(p); \
  } \
  console.log('deps ok'); \
  " \
 && npm cache clean --force \
 && rm -rf node_modules/recharts/umd node_modules/recharts/lib \
 && find node_modules -type f \( -name '*.md' -o -name '*.map' \) -delete 2>/dev/null || true

# Solo fuentes y config de build (no re-copiar package*.json para no desincronizar node_modules)
COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build \
 && rm -rf node_modules \
 && npm cache clean --force

# ---------- runtime ----------
FROM docker.io/library/nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/sprintops.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

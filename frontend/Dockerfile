# syntax=docker/dockerfile:1.7

# ---------- build ----------
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app
ENV CI=true

# package-lock + .npmrc (install-strategy=hoisted) para que Vite/Rollup resuelva deps hermanas
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund \
 && test -f node_modules/@dnd-kit/utilities/package.json \
 && test -f node_modules/motion-utils/package.json

COPY . .
# /api por defecto (mismo origen, nginx hace proxy). Se puede sobrescribir con --build-arg.
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# ---------- runtime ----------
FROM docker.io/library/nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/sprintops.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

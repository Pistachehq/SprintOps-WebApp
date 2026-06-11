#!/usr/bin/env bash
# Build de imagenes Docker para backend y frontend, push a OCIR.
# Compatible con Cloud Shell (que usa podman aliasado a docker).

set -e

source "$SPRINTOPS_HOME/utils/state-functions.sh"

REGION="$(state_get REGION)"
NAMESPACE="$(state_get OCIR_NAMESPACE)"
USER_NAME="$(state_get USER_NAME)"
BACKEND_REPO="$(state_get OCIR_BACKEND_REPO)"
FRONTEND_REPO="$(state_get OCIR_FRONTEND_REPO)"

OCIR_HOST="${REGION}.ocir.io"
OCIR_BACKEND_IMAGE="${OCIR_HOST}/${NAMESPACE}/${BACKEND_REPO}:latest"
OCIR_FRONTEND_IMAGE="${OCIR_HOST}/${NAMESPACE}/${FRONTEND_REPO}:latest"

# ---------------------------------------------------------------------------
# 1) Login a OCIR
# ---------------------------------------------------------------------------
if ! state_done OCIR_LOGGED_IN; then
  echo "Login a OCIR ($OCIR_HOST). Necesitas un Auth Token (User Settings > Auth Tokens)."
  read -s -r -p "Pega tu Auth Token: " TOKEN
  echo

  # Probamos varios formatos de username (Identity Domain hace esto un desastre)
  CANDIDATES=(
    "${NAMESPACE}/${USER_NAME}"
    "${NAMESPACE}/oracleidentitycloudservice/${USER_NAME}"
  )
  if [[ -n "${OCI_DOMAIN:-}" ]]; then
    CANDIDATES+=("${NAMESPACE}/${OCI_DOMAIN}/${USER_NAME}")
  fi

  LOGGED_IN=false
  for U in "${CANDIDATES[@]}"; do
    if echo "$TOKEN" | docker login -u "$U" --password-stdin "$OCIR_HOST" 2>/dev/null; then
      state_set OCIR_USERNAME "$U"
      LOGGED_IN=true
      break
    fi
  done
  if ! $LOGGED_IN; then
    echo "ERROR: docker login fallo con todos los formatos. Detalles:"
    for U in "${CANDIDATES[@]}"; do
      echo "  - $U"
    done
    echo "Verifica el Auth Token, namespace y el username en OCI Console."
    exit 1
  fi
  state_set_done OCIR_LOGGED_IN
fi

# ---------------------------------------------------------------------------
# 2) Build backend
# ---------------------------------------------------------------------------
# Tras git pull, fuerza rebuild: FORCE_REBUILD=1 ./deploy/oke-pro/utils/java-builds.sh
if [[ "${FORCE_REBUILD:-}" == "1" ]]; then
  rm -f "$(state_file BACKEND_BUILT)" "$(state_file FRONTEND_BUILT)" 2>/dev/null || true
fi
if ! state_done BACKEND_BUILT; then
  echo "Building backend image $OCIR_BACKEND_IMAGE ..."
  cd "$SPRINTOPS_REPO_ROOT/backend"
  docker build --platform linux/amd64 -t "$OCIR_BACKEND_IMAGE" .
  docker push "$OCIR_BACKEND_IMAGE"
  state_set BACKEND_IMAGE "$OCIR_BACKEND_IMAGE"
  state_set_done BACKEND_BUILT
else
  echo "Backend: omitiendo build (ya marcado BACKEND_BUILT). Usa FORCE_REBUILD=1 para reconstruir."
fi

# ---------------------------------------------------------------------------
# 3) Build frontend
# ---------------------------------------------------------------------------
if ! state_done FRONTEND_BUILT; then
  echo "Building frontend image $OCIR_FRONTEND_IMAGE ..."
  bash "$SPRINTOPS_HOME/utils/disk-free.sh"

  cd "$SPRINTOPS_REPO_ROOT/frontend"
  export CI=true NODE_ENV=development

  # Cloud Shell suele quedarse sin disco al commitear capas con node_modules (~400+ MB).
  # Preferimos vite build en el host y solo empaquetar dist/ en nginx (~pocos MB).
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "Frontend: npm run build en host + Dockerfile.prebuilt (ahorra disco) ..."
    rm -rf dist node_modules
    npm ci --include=dev --no-audit --no-fund
    VITE_API_BASE=/api npm run build
    rm -rf node_modules
    npm cache clean --force 2>/dev/null || true
    test -f dist/index.html
    docker build --platform linux/amd64 -f Dockerfile.prebuilt -t "$OCIR_FRONTEND_IMAGE" .
    rm -rf dist
  else
    echo "Frontend: build completo dentro de Docker (requiere mas disco) ..."
    docker build --no-cache --platform linux/amd64 \
      --build-arg VITE_API_BASE=/api \
      -t "$OCIR_FRONTEND_IMAGE" .
  fi

  docker push "$OCIR_FRONTEND_IMAGE"
  state_set FRONTEND_IMAGE "$OCIR_FRONTEND_IMAGE"
  state_set_done FRONTEND_BUILT
fi

echo "Imagenes pusheadas:"
echo "  $(state_get BACKEND_IMAGE)"
echo "  $(state_get FRONTEND_IMAGE)"

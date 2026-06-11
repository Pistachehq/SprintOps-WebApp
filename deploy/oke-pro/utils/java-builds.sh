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

ocir_read_token() {
  if [[ -n "${OCIR_AUTH_TOKEN:-}" ]]; then
    printf '%s' "$OCIR_AUTH_TOKEN"
    return 0
  fi
  if [[ -f "$HOME/.ocir-token" ]]; then
    tr -d '\n' < "$HOME/.ocir-token"
    return 0
  fi
  read -s -r -p "Pega tu Auth Token (User Settings > Auth Tokens): " TOKEN
  echo
  printf '%s' "$TOKEN"
}

ocir_login() {
  local token
  token="$(ocir_read_token)"
  if [[ -z "$token" ]]; then
    echo "ERROR: Auth Token vacio."
    exit 1
  fi

  docker logout "$OCIR_HOST" >/dev/null 2>&1 || true

  local candidates=()
  if [[ -n "${OCIR_DOCKER_USER:-}" ]]; then
    candidates+=("$OCIR_DOCKER_USER")
  fi
  candidates+=(
    "${NAMESPACE}/${USER_NAME}"
    "${NAMESPACE}/Default/${USER_NAME}"
    "${NAMESPACE}/oracleidentitycloudservice/${USER_NAME}"
  )
  if [[ -n "${OCI_DOMAIN:-}" ]]; then
    candidates+=("${NAMESPACE}/${OCI_DOMAIN}/${USER_NAME}")
  fi

  local u logged_in=false
  for u in "${candidates[@]}"; do
    echo "  · docker login como $u"
    if echo "$token" | docker login "$OCIR_HOST" -u "$u" --password-stdin 2>&1 | grep -q "Login Succeeded"; then
      state_set OCIR_USERNAME "$u"
      state_set_done OCIR_LOGGED_IN
      echo "  ✓ Login OK ($u)"
      logged_in=true
      break
    fi
  done
  if ! $logged_in; then
    echo "ERROR: docker login fallo. Prueba a mano:"
    echo "  docker logout $OCIR_HOST"
    echo "  echo \"<TOKEN>\" | docker login $OCIR_HOST -u \"${NAMESPACE}/${USER_NAME}\" --password-stdin"
    exit 1
  fi
}

ocir_push() {
  local image="$1"
  local attempt
  for attempt in 1 2; do
    if docker push "$image"; then
      return 0
    fi
    if [[ "$attempt" -eq 1 ]]; then
      echo "WARN: push fallo (a veces 403 por credenciales viejas en Cloud Shell). Re-login y reintento..."
      ocir_login
    fi
  done
  echo "ERROR: docker push fallo para $image"
  echo "Prueba manual:"
  echo "  docker logout $OCIR_HOST"
  echo "  echo \"<TOKEN>\" | docker login $OCIR_HOST -u \"${NAMESPACE}/${USER_NAME}\" --password-stdin"
  echo "  docker push $image"
  exit 1
}

# ---------------------------------------------------------------------------
# 1) Login a OCIR (siempre logout+login; evita 403 en push con podman)
# ---------------------------------------------------------------------------
if [[ "${OCIR_FORCE_LOGIN:-}" == "1" ]] || ! state_done OCIR_LOGGED_IN; then
  echo "Login a OCIR ($OCIR_HOST) ..."
  ocir_login
else
  echo "OCIR: reutilizando sesion (OCIR_FORCE_LOGIN=1 para forzar re-login)."
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
  ocir_push "$OCIR_BACKEND_IMAGE"
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

  ocir_push "$OCIR_FRONTEND_IMAGE"
  state_set FRONTEND_IMAGE "$OCIR_FRONTEND_IMAGE"
  state_set_done FRONTEND_BUILT
fi

echo "Imagenes pusheadas:"
echo "  $(state_get BACKEND_IMAGE)"
echo "  $(state_get FRONTEND_IMAGE)"

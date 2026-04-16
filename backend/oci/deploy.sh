#!/usr/bin/env bash
# Genera manifiesto con envsubst (sin Secrets de K8s) y aplica en namespace sprintops.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND"

if [ -z "${DOCKER_REGISTRY:-}" ] && command -v state_get >/dev/null 2>&1; then
  export DOCKER_REGISTRY="$(state_get DOCKER_REGISTRY)"
fi

required=(DOCKER_REGISTRY SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD GROQ_API_KEY APP_TELEGRAM_BOT_TOKEN APP_TELEGRAM_BOT_USERNAME APP_FRONTEND_BASE_URL)
for v in "${required[@]}"; do
  if [ -z "${!v:-}" ]; then
    echo "Error: exporta la variable obligatoria: $v"
    exit 1
  fi
done

export OCI_REGION="${OCI_REGION:-}"

if ! command -v envsubst >/dev/null 2>&1; then
  echo "Instala gettext (envsubst). En Cloud Shell: sudo yum install -y gettext || sudo apt-get install -y gettext-base"
  exit 1
fi

CURRENTTIME="$(date '+%F_%H-%M-%S')"
SRC="$SCRIPT_DIR/k8s/sprintops-backend.yaml"
OUT="$BACKEND/sprintops-backend-$CURRENTTIME.yaml"

# Solo sustituye estas variables (evita que envsubst borre $ en otros sitios)
envsubst '$DOCKER_REGISTRY$SPRING_DATASOURCE_URL$SPRING_DATASOURCE_USERNAME$SPRING_DATASOURCE_PASSWORD$OCI_REGION$GROQ_API_KEY$APP_TELEGRAM_BOT_TOKEN$APP_TELEGRAM_BOT_USERNAME$APP_FRONTEND_BASE_URL' \
  <"$SRC" >"$OUT"

echo "Aplicando $OUT (namespace sprintops)"
kubectl apply -f "$OUT"

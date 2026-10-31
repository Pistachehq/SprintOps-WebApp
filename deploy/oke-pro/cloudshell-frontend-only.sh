#!/usr/bin/env bash
# Build + push SOLO frontend y reinicia el deployment (no toca backend).
#
# Uso en Cloud Shell:
#   export OCIR_AUTH_TOKEN='tu-token'   # o ~/.ocir-token
#   bash deploy/oke-pro/cloudshell-frontend-only.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

git pull origin Features-extra

if [[ -f "$HOME/.ocir-token" ]]; then
  export OCIR_AUTH_TOKEN="$(tr -d '\n\r' < "$HOME/.ocir-token")"
fi
if [[ -z "${OCIR_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: define OCIR_AUTH_TOKEN o ~/.ocir-token"
  exit 1
fi

export OCIR_DOCKER_USER="${OCIR_DOCKER_USER:-axf5izecp5nx/a00838462@tec.mx}"
export OCIR_FORCE_LOGIN=1

source deploy/oke-pro/env.sh

rm -f "${SPRINTOPS_STATE_HOME}/state/FRONTEND_BUILT"
# BACKEND_BUILT se mantiene → java-builds.sh omite el backend

bash deploy/oke-pro/utils/java-builds.sh

echo "== Reiniciando solo frontend en K8s =="
kubectl -n sprintops rollout restart deploy/frontend
kubectl -n sprintops rollout status deploy/frontend --timeout=180s

APP_IP="$(kubectl -n sprintops get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo ""
echo "Frontend actualizado: http://${APP_IP}"
echo "(Haz hard refresh en el navegador: Cmd+Shift+R)"

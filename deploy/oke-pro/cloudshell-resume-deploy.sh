#!/usr/bin/env bash
# Reanuda deploy en OCI Cloud Shell (infra ya creada: OKE + ADB + OCIR).
# NO guardes el Auth Token en este repo. Ponlo solo en ~/.ocir-token en Cloud Shell.
#
# Uso:
#   printf '%s' 'TU_AUTH_TOKEN' > ~/.ocir-token && chmod 600 ~/.ocir-token
#   bash deploy/oke-pro/cloudshell-resume-deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
git pull origin Features-extra 2>/dev/null || true

# Valores de tu tenancy (mx-queretaro-1 / TEC)
export TENANCY="${TENANCY:-ocid1.tenancy.oc1..aaaaaaaa4l5rcivkufulzarehzrxa3epwhc5jucmmecqsdwzujohxk5kyfwq}"
export USER_ID="${USER_ID:-ocid1.user.oc1..aaaaaaaakkodyc2h5mq36ro5roatv65ggvirijnyl6qucll7gwmfrspupaqa}"
export OCIR_DOCKER_USER="${OCIR_DOCKER_USER:-axf5izecp5nx/a00838462@tec.mx}"
export REGION="${REGION:-mx-queretaro-1}"

if [[ -f "$HOME/.ocir-token" ]]; then
  export OCIR_AUTH_TOKEN="$(tr -d '\n\r' < "$HOME/.ocir-token")"
elif [[ -n "${OCIR_AUTH_TOKEN:-}" ]]; then
  printf '%s' "$OCIR_AUTH_TOKEN" > "$HOME/.ocir-token"
  chmod 600 "$HOME/.ocir-token"
else
  echo "ERROR: Falta Auth Token."
  echo "  printf '%s' 'TU_TOKEN' > ~/.ocir-token && chmod 600 ~/.ocir-token"
  exit 1
fi

TOKEN_LEN="${#OCIR_AUTH_TOKEN}"
if [[ "$TOKEN_LEN" -lt 10 || "$TOKEN_LEN" -gt 120 ]]; then
  echo "ERROR: Token con longitud rara (${TOKEN_LEN} chars). Debe ser ~20-80."
  echo "Copia SOLO con el boton Copy del dialogo Generate token."
  exit 1
fi

echo "== Token OK (${TOKEN_LEN} caracteres) =="

echo "== IAM OCIR (idempotente) =="
oci iam policy create \
  --compartment-id "$TENANCY" \
  --name "sprintops-ocir-$(date +%s)" \
  --description "Push/pull OCIR SprintOps" \
  --statements "[\"Allow user ${USER_ID} to manage repos in tenancy\"]" \
  2>/dev/null || echo "(politica ya existe o sin permiso para crear; sigue si ya la tienes)"

sleep 30

export OCIR_FORCE_LOGIN=1
export FORCE_REBUILD=1

source deploy/oke-pro/env.sh

bash deploy/oke-pro/utils/disk-free.sh

STATE_DIR="${SPRINTOPS_STATE_HOME}/state"
rm -f "$STATE_DIR"/OCIR_LOGGED_IN \
      "$STATE_DIR"/IMAGES_PUSHED \
      "$STATE_DIR"/BACKEND_BUILT \
      "$STATE_DIR"/FRONTEND_BUILT \
      "$STATE_DIR"/SETUP_VERIFIED

echo "== Build + push imagenes =="
bash deploy/oke-pro/utils/java-builds.sh

echo "== Secrets K8s (wallet, DB, ocir-pull) =="
bash deploy/oke-pro/utils/db-setup.sh

echo "== Deploy manifests =="
bash deploy/oke-pro/utils/k8s-deploy.sh

APP_IP="$(kubectl -n sprintops get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo ""
echo "============================================="
echo "  SprintOps desplegado"
echo "  URL: http://${APP_IP}"
echo "============================================="
curl -sS "http://${APP_IP}/api/proyectos" | head -c 300 || true
echo ""

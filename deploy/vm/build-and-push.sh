#!/usr/bin/env bash
# Construye y sube las imagenes a OCIR para usarlas desde la VM de docker-compose.
# Corre dentro de OCI Cloud Shell. No toca Kubernetes.
#
# Uso:
#   bash deploy/vm/build-and-push.sh
#
# Variables que puedes setear antes para sobrescribir defaults:
#   IMAGE_TAG="20260520-x"   (default: timestamp actual)
#   OCIR_AUTH_TOKEN=...      (si no esta en ~/.ocir-token, lo pide)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

NAMESPACE_APP="sprintops"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"

green()  { printf "\033[1;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[1;33m%s\033[0m\n" "$*"; }
red()    { printf "\033[1;31m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[1;36m> %s\033[0m\n" "$*"; }

require_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { red "Falta: $c (estas en Cloud Shell?)"; exit 1; }
  done
}
require_cmd oci docker

# 1. Detectar tenancy/region/usuario para armar la URL de OCIR
step "Detectando identidad OCI"
USER_OCID="$(oci iam user list --query 'data[0].id' --raw-output)"
RAW_USER_NAME="$(oci iam user get --user-id "$USER_OCID" --query 'data.name' --raw-output)"
REGION="${OCI_REGION:-$(grep -E '^region=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || true)}"
REGION="${REGION:-mx-queretaro-1}"
REGION_KEY="$(oci iam region list --query "data[?name=='${REGION}'].key | [0]" --raw-output 2>/dev/null || true)"
[[ -z "$REGION_KEY" ]] && REGION_KEY="$(echo "$REGION" | awk -F- '{print toupper(substr($1,1,3))}')"
OCIR_NAMESPACE="$(oci os ns get --query 'data' --raw-output)"
OCIR_REGISTRY="${REGION_KEY,,}.ocir.io"

green "Region:         $REGION"
green "Tenancy ns:     $OCIR_NAMESPACE"
green "OCIR registry:  $OCIR_REGISTRY"
green "Usuario:        $RAW_USER_NAME"

# 2. Auth token (reutiliza el que ya tenias guardado del intento de OKE)
if [[ -z "${OCIR_AUTH_TOKEN:-}" && -f "$HOME/.ocir-token" ]]; then
  OCIR_AUTH_TOKEN="$(cat "$HOME/.ocir-token")"
fi
if [[ -z "${OCIR_AUTH_TOKEN:-}" ]]; then
  yellow "Necesito un Auth Token para hacer docker login a OCIR."
  yellow "Generalo en: Consola OCI -> My profile -> Auth Tokens -> Generate Token."
  read -r -s -p "Pega el token aqui: " OCIR_AUTH_TOKEN
  echo
  printf '%s' "$OCIR_AUTH_TOKEN" > "$HOME/.ocir-token"
  chmod 600 "$HOME/.ocir-token"
fi

# 3. Probar los formatos de username de OCIR
step "docker login a OCIR"
CANDIDATE_USERS=()
if [[ -n "${OCIR_DOCKER_USER:-}" ]]; then
  CANDIDATE_USERS+=("$OCIR_DOCKER_USER")
fi
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/${RAW_USER_NAME}")
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/Default/${RAW_USER_NAME}")
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/oracleidentitycloudservice/${RAW_USER_NAME}")

LOGIN_OK=false
for candidate in "${CANDIDATE_USERS[@]}"; do
  echo "  - Intentando $candidate"
  if echo "$OCIR_AUTH_TOKEN" | docker login "$OCIR_REGISTRY" \
        --username "$candidate" --password-stdin 2>/dev/null | grep -q "Login Succeeded"; then
    OCIR_DOCKER_USER="$candidate"
    LOGIN_OK=true
    green "  OK: $OCIR_DOCKER_USER"
    break
  fi
done
$LOGIN_OK || { red "docker login fallo en todos los formatos."; exit 1; }

BACKEND_IMAGE="$OCIR_REGISTRY/$OCIR_NAMESPACE/${NAMESPACE_APP}-backend:$IMAGE_TAG"
FRONTEND_IMAGE="$OCIR_REGISTRY/$OCIR_NAMESPACE/${NAMESPACE_APP}-frontend:$IMAGE_TAG"

# 4. Asegurar que los repos de OCIR existen
COMPARTMENT_OCID="$(grep -E '^tenancy=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || true)"
if [[ -z "$COMPARTMENT_OCID" ]]; then
  COMPARTMENT_OCID="$(oci iam compartment list --compartment-id-in-subtree true --all --query 'data[?"compartment-id"==null].id | [0]' --raw-output 2>/dev/null || true)"
fi
for repo in "${NAMESPACE_APP}-backend" "${NAMESPACE_APP}-frontend"; do
  oci artifacts container repository create \
    --compartment-id "$COMPARTMENT_OCID" \
    --display-name "$repo" \
    --is-public true 2>/dev/null || true
done

# 5. Construir y subir (amd64 nativo, sin emulacion)
step "Build backend (linux/amd64) -> $BACKEND_IMAGE"
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" "$REPO_DIR/backend"
docker push "$BACKEND_IMAGE"

step "Build frontend (linux/amd64) -> $FRONTEND_IMAGE"
docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" "$REPO_DIR/frontend"
docker push "$FRONTEND_IMAGE"

# 6. Generar archivo .env para la VM
MYSQL_ROOT_PASSWORD="$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-24)"
MYSQL_PASSWORD="$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-24)"
ENV_FILE="$HOME/sprintops-vm.env"

cat > "$ENV_FILE" <<EOF
# Generado por build-and-push.sh el $(date)
# Copia este archivo a la VM como /opt/sprintops/.env (lo hace bootstrap.sh)

BACKEND_IMAGE=$BACKEND_IMAGE
FRONTEND_IMAGE=$FRONTEND_IMAGE

MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=sprintops_db
MYSQL_USER=sprintops
MYSQL_PASSWORD=$MYSQL_PASSWORD

# Se rellena despues con la IP publica de la VM
FRONTEND_BASE_URL=http://CHANGE_ME

# OCIR auth para pull de imagenes en la VM
OCIR_REGISTRY=$OCIR_REGISTRY
OCIR_DOCKER_USER=$OCIR_DOCKER_USER
OCIR_AUTH_TOKEN=$OCIR_AUTH_TOKEN

# Opcionales: rellena si quieres OAuth, Groq, Telegram
GROQ_API_KEY=${GROQ_API_KEY:-}
GROQ_MODEL=${GROQ_MODEL:-llama-3.3-70b-versatile}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME:-}
EOF
chmod 600 "$ENV_FILE"

green "════════════════════════════════════════════"
green "  Imagenes construidas y subidas a OCIR"
green ""
green "  Backend:  $BACKEND_IMAGE"
green "  Frontend: $FRONTEND_IMAGE"
green ""
green "  .env generado en: $ENV_FILE"
green "════════════════════════════════════════════"
yellow ""
yellow "Siguiente paso (ver deploy/vm/README.md):"
yellow "  1. Crea VM E2.1.Micro en OCI Console pegando tu pubkey de Cloud Shell"
yellow "       cat ~/.ssh/id_rsa.pub"
yellow "  2. Copia archivos a la VM (Cloud Shell ya tiene la priv key):"
yellow "       VM_IP=X.X.X.X"
yellow "       scp $ENV_FILE $SCRIPT_DIR/docker-compose.yml $SCRIPT_DIR/bootstrap.sh opc@\$VM_IP:/tmp/"
yellow "       ssh opc@\$VM_IP 'mv /tmp/sprintops-vm.env /tmp/.env'"
yellow "  3. SSH y ejecuta el bootstrap:"
yellow "       ssh opc@\$VM_IP 'sudo bash /tmp/bootstrap.sh'"

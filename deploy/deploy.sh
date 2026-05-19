#!/usr/bin/env bash
# Despliegue de SprintOps en OKE (Oracle Kubernetes Engine).
# Pensado para correr DENTRO de OCI Cloud Shell, donde ya hay oci CLI, kubectl, docker, jq.
#
# Uso:
#   bash deploy/deploy.sh                  # despliega/actualiza todo
#   bash deploy/deploy.sh --skip-build     # solo reaplicar manifests
#   bash deploy/deploy.sh --destroy        # borra el namespace sprintops (no toca el cluster)
#
# Antes de la primera corrida:
#   - Crea el cluster con "Quick Create" en la consola de OKE (lo más rápido).
#     OCI Console → Developer Services → Kubernetes Clusters → Create cluster → Quick create.
#     Sirve cualquier shape, ARM A1.Flex con 2 nodos es lo recomendado en Always Free.
#   - Listo. Esta es la única acción manual; lo demás lo hace el script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s"
STATE_FILE="$HOME/.sprintops-deploy-state"

NAMESPACE="sprintops"
APP_PREFIX="sprintops"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
PLATFORMS="${PLATFORMS:-linux/arm64}"   # cambia a linux/amd64 si tu pool es AMD

SKIP_BUILD=false
DESTROY=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --destroy)    DESTROY=true ;;
    -h|--help)
      sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

green()  { printf "\033[1;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[1;33m%s\033[0m\n" "$*"; }
red()    { printf "\033[1;31m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }

require_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { red "Falta el comando: $c (no estás en Cloud Shell?)"; exit 1; }
  done
}

require_cmd oci kubectl docker jq base64 sed

# -----------------------------------------------------------------------------
# 0) Cargar/persistir estado para no preguntar dos veces
# -----------------------------------------------------------------------------
if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$STATE_FILE"
fi

save_state() {
  cat > "$STATE_FILE" <<EOF
TENANCY_OCID="${TENANCY_OCID}"
USER_OCID="${USER_OCID}"
COMPARTMENT_OCID="${COMPARTMENT_OCID}"
REGION="${REGION}"
REGION_KEY="${REGION_KEY}"
CLUSTER_OCID="${CLUSTER_OCID}"
OCIR_NAMESPACE="${OCIR_NAMESPACE}"
OCIR_USER="${OCIR_USER}"
EOF
  chmod 600 "$STATE_FILE"
}

step "Detectando identidad y región (OCI CLI)"
TENANCY_OCID="${TENANCY_OCID:-$(oci iam compartment list --compartment-id-in-subtree true --all --query 'data[0]."compartment-id"' --raw-output 2>/dev/null || true)}"
TENANCY_OCID="${TENANCY_OCID:-$(grep -E '^tenancy=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || true)}"
USER_OCID="${USER_OCID:-$(oci iam user list --query 'data[0].id' --raw-output 2>/dev/null || true)}"
REGION="${REGION:-${OCI_REGION:-$(grep -E '^region=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || true)}}"
REGION="${REGION:-mx-queretaro-1}"
REGION_KEY="$(oci iam region list --query "data[?name=='${REGION}'].key | [0]" --raw-output 2>/dev/null || true)"
[[ -z "$REGION_KEY" ]] && REGION_KEY="$(echo "$REGION" | awk -F- '{print toupper(substr($1,1,3))}')"

if [[ -z "${COMPARTMENT_OCID:-}" ]]; then
  green "Compartimentos disponibles:"
  oci iam compartment list --compartment-id-in-subtree true --all --query 'data[].{name:name,id:id,lifecycle:"lifecycle-state"}' --output table || true
  read -r -p "Pega el OCID del compartimento donde está el cluster (Enter = tenancy raíz): " input_comp || true
  COMPARTMENT_OCID="${input_comp:-$TENANCY_OCID}"
fi

green "Tenancy:     $TENANCY_OCID"
green "Usuario:     $USER_OCID"
green "Región:      $REGION  (key: $REGION_KEY)"
green "Compartimento: $COMPARTMENT_OCID"

# -----------------------------------------------------------------------------
# 1) Localizar el cluster de OKE y configurar kubectl
# -----------------------------------------------------------------------------
step "Buscando cluster de Kubernetes en ese compartimento"
if [[ -z "${CLUSTER_OCID:-}" ]]; then
  CLUSTER_OCID="$(oci ce cluster list --compartment-id "$COMPARTMENT_OCID" --lifecycle-state ACTIVE --query 'data[0].id' --raw-output 2>/dev/null || true)"
fi
if [[ -z "$CLUSTER_OCID" ]]; then
  red "No encontré un cluster ACTIVE en ese compartimento."
  red "Crea uno con 'Quick Create' en la consola de OKE y vuelve a correr el script."
  exit 1
fi
green "Cluster: $CLUSTER_OCID"

step "Generando kubeconfig"
mkdir -p "$HOME/.kube"
oci ce cluster create-kubeconfig \
  --cluster-id "$CLUSTER_OCID" \
  --file "$HOME/.kube/config" \
  --region "$REGION" \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT >/dev/null
export KUBECONFIG="$HOME/.kube/config"
kubectl config use-context "$(kubectl config current-context)" >/dev/null

green "Nodos:"
kubectl get nodes -o wide

if $DESTROY; then
  step "Borrando namespace $NAMESPACE"
  kubectl delete namespace "$NAMESPACE" --ignore-not-found
  green "Listo. Cluster e infraestructura siguen vivos."
  exit 0
fi

# -----------------------------------------------------------------------------
# 2) Detectar tenancy namespace de OCIR + auth token para docker login
# -----------------------------------------------------------------------------
step "Preparando registro de contenedores (OCIR)"
OCIR_NAMESPACE="${OCIR_NAMESPACE:-$(oci os ns get --query 'data' --raw-output)}"
OCIR_REGISTRY="${REGION_KEY,,}.ocir.io"
OCIR_USER="${OCIR_USER:-$(oci iam user get --user-id "$USER_OCID" --query 'data.name' --raw-output)}"
green "OCIR registry: $OCIR_REGISTRY/$OCIR_NAMESPACE/${APP_PREFIX}-*"

if [[ -z "${OCIR_AUTH_TOKEN:-}" && -f "$HOME/.ocir-token" ]]; then
  OCIR_AUTH_TOKEN="$(cat "$HOME/.ocir-token")"
fi
if [[ -z "${OCIR_AUTH_TOKEN:-}" ]]; then
  yellow "Necesito un Auth Token de tu usuario para hacer docker login a OCIR."
  yellow "Intento crearlo automáticamente (necesita permiso 'manage user-credentials')..."
  set +e
  OCIR_AUTH_TOKEN="$(oci iam auth-token create --user-id "$USER_OCID" --description "sprintops-deploy-$(date +%s)" --query 'data.token' --raw-output 2>/dev/null)"
  set -e
  if [[ -z "$OCIR_AUTH_TOKEN" ]]; then
    yellow "No pude crearlo automáticamente."
    yellow "Genera uno en: Consola OCI → My profile → Auth Tokens → Generate Token."
    read -r -s -p "Pega el token aquí (no se muestra al escribir): " OCIR_AUTH_TOKEN
    echo
  fi
  printf '%s' "$OCIR_AUTH_TOKEN" > "$HOME/.ocir-token"
  chmod 600 "$HOME/.ocir-token"
fi

step "docker login a OCIR"
echo "$OCIR_AUTH_TOKEN" | docker login "$OCIR_REGISTRY" \
  --username "${OCIR_NAMESPACE}/${OCIR_USER}" --password-stdin

# Repos en OCIR (si no existen, se crean al primer push, pero los creamos explícitos para hacerlos públicos del lado de OKE vía imagePullSecret más abajo)
for repo in "${APP_PREFIX}-backend" "${APP_PREFIX}-frontend"; do
  oci artifacts container repository create \
    --compartment-id "$COMPARTMENT_OCID" \
    --display-name "$repo" \
    --is-public false 2>/dev/null || true
done

BACKEND_IMAGE="$OCIR_REGISTRY/$OCIR_NAMESPACE/${APP_PREFIX}-backend:$IMAGE_TAG"
FRONTEND_IMAGE="$OCIR_REGISTRY/$OCIR_NAMESPACE/${APP_PREFIX}-frontend:$IMAGE_TAG"

# -----------------------------------------------------------------------------
# 3) Construir y subir imágenes (multi-arch usando buildx)
# -----------------------------------------------------------------------------
if ! $SKIP_BUILD; then
  step "Preparando buildx (cross-compile para $PLATFORMS)"
  docker buildx inspect sprintops-builder >/dev/null 2>&1 || \
    docker buildx create --name sprintops-builder --use --bootstrap >/dev/null
  docker buildx use sprintops-builder >/dev/null

  step "Build & push backend → $BACKEND_IMAGE"
  docker buildx build \
    --platform "$PLATFORMS" \
    --tag "$BACKEND_IMAGE" \
    --push \
    "$REPO_DIR/backend"

  step "Build & push frontend → $FRONTEND_IMAGE"
  docker buildx build \
    --platform "$PLATFORMS" \
    --tag "$FRONTEND_IMAGE" \
    --push \
    "$REPO_DIR/frontend"
else
  yellow "--skip-build activo: usando tag '$IMAGE_TAG' tal cual."
fi

# -----------------------------------------------------------------------------
# 4) Aplicar manifests
# -----------------------------------------------------------------------------
step "Aplicando manifests"
kubectl apply -f "$K8S_DIR/00-namespace.yaml"

# Secret para que el cluster pueda jalar las imágenes privadas de OCIR
kubectl -n "$NAMESPACE" create secret docker-registry ocir-pull \
  --docker-server="$OCIR_REGISTRY" \
  --docker-username="${OCIR_NAMESPACE}/${OCIR_USER}" \
  --docker-password="$OCIR_AUTH_TOKEN" \
  --docker-email="${OCIR_USER}@oracle.local" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "$NAMESPACE" patch serviceaccount default \
  -p '{"imagePullSecrets":[{"name":"ocir-pull"}]}' || true

# Secret de MySQL: si no existe, genera una contraseña aleatoria y la persiste
if ! kubectl -n "$NAMESPACE" get secret mysql-credentials >/dev/null 2>&1; then
  step "Generando credenciales aleatorias de MySQL"
  MYSQL_ROOT_PASSWORD="$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-24)"
  MYSQL_APP_PASSWORD="$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-24)"
  kubectl -n "$NAMESPACE" create secret generic mysql-credentials \
    --from-literal=rootPassword="$MYSQL_ROOT_PASSWORD" \
    --from-literal=database="sprintops_db" \
    --from-literal=username="sprintops" \
    --from-literal=password="$MYSQL_APP_PASSWORD"
  green "Contraseña root de MySQL guardada como Secret 'mysql-credentials' (no se imprime)."
else
  yellow "Secret 'mysql-credentials' ya existe — se conserva."
fi

# Secret de backend (opcional, se llena si seteas las env vars antes de correr)
step "Aplicando secrets de backend (placeholders vacíos por defecto)"
kubectl -n "$NAMESPACE" create secret generic backend-secrets \
  --from-literal=groqApiKey="${GROQ_API_KEY:-}" \
  --from-literal=googleClientId="${GOOGLE_CLIENT_ID:-}" \
  --from-literal=googleClientSecret="${GOOGLE_CLIENT_SECRET:-}" \
  --from-literal=githubClientId="${GITHUB_CLIENT_ID:-}" \
  --from-literal=githubClientSecret="${GITHUB_CLIENT_SECRET:-}" \
  --from-literal=telegramBotToken="${TELEGRAM_BOT_TOKEN:-}" \
  --from-literal=telegramBotUsername="${TELEGRAM_BOT_USERNAME:-}" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f "$K8S_DIR/10-mysql.yaml"

# Sustituir placeholders en los manifests con yaml temporal
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
# FRONTEND_BASE_URL provisional; se reemplaza al final cuando ya hay IP del LB
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://pending}"

sed -e "s|__BACKEND_IMAGE__|$BACKEND_IMAGE|g" \
    -e "s|__FRONTEND_BASE_URL__|$FRONTEND_BASE_URL|g" \
    "$K8S_DIR/20-backend.yaml" > "$tmpdir/20-backend.yaml"
sed -e "s|__FRONTEND_IMAGE__|$FRONTEND_IMAGE|g" \
    "$K8S_DIR/30-frontend.yaml" > "$tmpdir/30-frontend.yaml"

kubectl apply -f "$tmpdir/20-backend.yaml"
kubectl apply -f "$tmpdir/30-frontend.yaml"

step "Esperando a que MySQL esté listo"
kubectl -n "$NAMESPACE" rollout status statefulset/mysql --timeout=10m

step "Esperando a que el backend esté listo"
kubectl -n "$NAMESPACE" rollout status deploy/backend --timeout=10m || true

step "Esperando IP pública del LoadBalancer del frontend (puede tomar 1-3 min)"
EXT_IP=""
for i in {1..60}; do
  EXT_IP="$(kubectl -n "$NAMESPACE" get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
  if [[ -n "$EXT_IP" ]]; then break; fi
  sleep 5
  printf "."
done
echo

if [[ -z "$EXT_IP" ]]; then
  red "El LoadBalancer aún no expone IP. Revisa: kubectl -n $NAMESPACE get svc frontend"
  exit 1
fi

# Reescribir FRONTEND_BASE_URL ahora que conocemos la IP
FRONTEND_BASE_URL="http://$EXT_IP"
sed -i "s|http://pending|$FRONTEND_BASE_URL|g" "$tmpdir/20-backend.yaml"
kubectl apply -f "$tmpdir/20-backend.yaml"
kubectl -n "$NAMESPACE" rollout restart deploy/backend
kubectl -n "$NAMESPACE" rollout status deploy/backend --timeout=10m || true

save_state

green "════════════════════════════════════════════"
green "  SprintOps desplegado"
green "  URL: $FRONTEND_BASE_URL"
green "════════════════════════════════════════════"
yellow "Comandos útiles:"
echo "  kubectl -n $NAMESPACE get pods,svc"
echo "  kubectl -n $NAMESPACE logs deploy/backend -f"
echo "  kubectl -n $NAMESPACE logs deploy/frontend -f"
echo "  bash deploy/deploy.sh --destroy   # quitar todo dejando el cluster vivo"

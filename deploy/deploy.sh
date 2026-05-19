#!/usr/bin/env bash
# Despliegue de SprintOps en OKE (Oracle Kubernetes Engine).
# Pensado para correr DENTRO de OCI Cloud Shell, donde ya hay oci CLI, kubectl, docker, jq.
#
# Uso:
#   bash deploy/deploy.sh                  # despliega/actualiza todo (estrategia automatica)
#   bash deploy/deploy.sh --kaniko         # fuerza build en cluster (Kaniko)
#   bash deploy/deploy.sh --local-build    # fuerza build local con docker
#   bash deploy/deploy.sh --skip-build     # solo reaplicar manifests (asume imagenes ya en OCIR)
#   bash deploy/deploy.sh --destroy        # borra el namespace sprintops (no toca el cluster)
#
# Estrategia de build:
#   - auto (default): si el host es x86 y los nodos del cluster son ARM (o viceversa)
#     y estamos en Cloud Shell, usamos Kaniko (los nodos compilan las imagenes nativamente).
#   - kaniko: corre Jobs de Kaniko en el cluster que leen el codigo desde tu repo
#     publico de GitHub (rama actual). Tienes que tener tus cambios en GitHub.
#   - local: docker build + push desde la maquina actual (necesita docker real o QEMU).
#
# Antes de la primera corrida:
#   - Crea el cluster con "Quick Create" en la consola de OKE (lo mas rapido).
#     OCI Console -> Developer Services -> Kubernetes Clusters -> Create cluster -> Quick create.
#     Sirve cualquier shape, ARM A1.Flex con 2 nodos es lo recomendado en Always Free.
#   - Listo. Esta es la unica accion manual; lo demas lo hace el script.

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
BUILD_STRATEGY="${BUILD_STRATEGY:-auto}"   # auto | local | kaniko
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --destroy)    DESTROY=true ;;
    --kaniko)     BUILD_STRATEGY="kaniko" ;;
    --local-build) BUILD_STRATEGY="local" ;;
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

# Detectar el repo de git para que Kaniko pueda usarlo como contexto de build.
# Si tus cambios no estan en GitHub, Kaniko construira la version vieja.
detect_git_context() {
  GIT_BRANCH="${GIT_BRANCH:-$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
  local raw="${GIT_REPO_URL:-$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || true)}"
  if [[ -z "$raw" ]]; then
    KANIKO_GIT_CONTEXT=""
    return 1
  fi
  case "$raw" in
    git@*)
      local hp="${raw#git@}"
      hp="${hp/://}"
      raw="$hp"
      ;;
    https://*) raw="${raw#https://}" ;;
    http://*)  raw="${raw#http://}"  ;;
  esac
  [[ "$raw" == *.git ]] || raw="${raw}.git"
  KANIKO_GIT_CONTEXT="git://${raw}#refs/heads/${GIT_BRANCH}"
}
detect_git_context || true

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

# El username para hacer docker login a OCIR varía según cómo esté configurada
# la identidad de la cuenta. En vez de adivinar, probamos varios formatos.
RAW_USER_NAME="$(oci iam user get --user-id "$USER_OCID" --query 'data.name' --raw-output 2>/dev/null || true)"
IDENTITY_PROVIDER_ID="$(oci iam user get --user-id "$USER_OCID" --query 'data."identity-provider-id"' --raw-output 2>/dev/null || true)"

OCIR_USER="$RAW_USER_NAME"
green "OCIR registry: $OCIR_REGISTRY/$OCIR_NAMESPACE/${APP_PREFIX}-*"
green "OCIR username (raw): $RAW_USER_NAME"

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

step "docker login a OCIR (probando formatos comunes)"
# Lista de candidatos en orden de probabilidad. Permite forzar el correcto con OCIR_DOCKER_USER.
CANDIDATE_USERS=()
if [[ -n "${OCIR_DOCKER_USER:-}" ]]; then
  CANDIDATE_USERS+=("$OCIR_DOCKER_USER")
fi
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/${RAW_USER_NAME}")
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/Default/${RAW_USER_NAME}")
CANDIDATE_USERS+=("${OCIR_NAMESPACE}/oracleidentitycloudservice/${RAW_USER_NAME}")

LOGIN_OK=false
for candidate in "${CANDIDATE_USERS[@]}"; do
  echo "  · Intentando $candidate"
  if echo "$OCIR_AUTH_TOKEN" | docker login "$OCIR_REGISTRY" \
        --username "$candidate" --password-stdin 2>/dev/null | grep -q "Login Succeeded"; then
    OCIR_DOCKER_USER="$candidate"
    LOGIN_OK=true
    green "  ✓ OK con: $OCIR_DOCKER_USER"
    break
  fi
done

if ! $LOGIN_OK; then
  red "Ninguno de los formatos de username funcionó."
  red "Verifica el token (regenéralo si dudas) y vuelve a correr."
  red "También puedes forzar el username manualmente:"
  red "  OCIR_DOCKER_USER='${OCIR_NAMESPACE}/<DOMAIN>/${RAW_USER_NAME}' bash deploy/deploy.sh"
  exit 1
fi

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
# 3) Decidir estrategia de build (local docker vs Kaniko en el cluster)
# -----------------------------------------------------------------------------
ensure_namespace_and_pull_secret() {
  kubectl apply -f "$K8S_DIR/00-namespace.yaml" >/dev/null
  kubectl -n "$NAMESPACE" create secret docker-registry ocir-pull \
    --docker-server="$OCIR_REGISTRY" \
    --docker-username="$OCIR_DOCKER_USER" \
    --docker-password="$OCIR_AUTH_TOKEN" \
    --docker-email="${RAW_USER_NAME}@oracle.local" \
    --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  kubectl -n "$NAMESPACE" patch serviceaccount default \
    -p '{"imagePullSecrets":[{"name":"ocir-pull"}]}' >/dev/null 2>&1 || true
}

wait_for_one_node() {
  step "Esperando a que al menos un worker node este listo"
  for i in $(seq 1 120); do
    if kubectl get nodes --no-headers 2>/dev/null | grep -q " Ready "; then
      green "Nodos listos."
      return 0
    fi
    sleep 5
    printf "."
  done
  echo
  red "Pasaron 10 min y no hay nodos Ready. Revisa el Node Pool en la consola de OKE."
  return 1
}

build_with_kaniko() {
  local subpath="$1"
  local image="$2"
  shift 2
  local extra_args=("$@")

  local short_tag
  short_tag="$(echo "${IMAGE_TAG}" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9-' | head -c 20)"
  local job_name="kaniko-${subpath}-${short_tag}"
  job_name="${job_name:0:60}"
  job_name="${job_name%-}"

  kubectl -n "$NAMESPACE" delete job "$job_name" --ignore-not-found >/dev/null 2>&1 || true

  local args_block=""
  args_block+="        - --dockerfile=Dockerfile"$'\n'
  args_block+="        - --context=${KANIKO_GIT_CONTEXT}"$'\n'
  args_block+="        - --context-sub-path=${subpath}"$'\n'
  args_block+="        - --destination=${image}"$'\n'
  args_block+="        - --snapshot-mode=redo"$'\n'
  args_block+="        - --use-new-run"$'\n'
  for ea in "${extra_args[@]}"; do
    args_block+="        - ${ea}"$'\n'
  done

  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: $job_name
  namespace: $NAMESPACE
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: 1800
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: kaniko
        image: gcr.io/kaniko-project/executor:v1.23.2
        args:
$args_block
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2"
            memory: "3Gi"
        volumeMounts:
        - name: docker-config
          mountPath: /kaniko/.docker
      volumes:
      - name: docker-config
        secret:
          secretName: ocir-pull
          items:
          - key: .dockerconfigjson
            path: config.json
EOF

  step "Esperando a que arranque el Job de Kaniko ($subpath)"
  local pod=""
  for i in $(seq 1 60); do
    pod="$(kubectl -n "$NAMESPACE" get pod -l job-name="$job_name" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
    [[ -n "$pod" ]] && break
    sleep 2
  done
  if [[ -z "$pod" ]]; then
    red "El Job $job_name no creo pod."
    kubectl -n "$NAMESPACE" describe job "$job_name" || true
    return 1
  fi

  green "Pod: $pod (sigueme los logs)"
  kubectl -n "$NAMESPACE" logs -f "$pod" --tail=-1 || true

  if kubectl -n "$NAMESPACE" wait --for=condition=complete --timeout=10s "job/$job_name" >/dev/null 2>&1; then
    green "Build de '${subpath}' OK → $image"
    kubectl -n "$NAMESPACE" delete job "$job_name" --ignore-not-found >/dev/null 2>&1 || true
    return 0
  fi
  red "Build de '${subpath}' fallo. Detalles:"
  kubectl -n "$NAMESPACE" describe pod "$pod" || true
  return 1
}

if ! $SKIP_BUILD; then
  IS_PODMAN=false
  docker --version 2>/dev/null | grep -qi podman && IS_PODMAN=true

  HOST_ARCH="$(uname -m)"
  TARGET_ARCH="${PLATFORMS##*/}"
  case "$TARGET_ARCH" in
    arm64|aarch64) HOST_MATCH_FOR_TARGET="aarch64" ;;
    amd64|x86_64)  HOST_MATCH_FOR_TARGET="x86_64"  ;;
    *)             HOST_MATCH_FOR_TARGET="$TARGET_ARCH" ;;
  esac
  CROSS_ARCH=false
  [[ "$HOST_ARCH" != "$HOST_MATCH_FOR_TARGET" ]] && CROSS_ARCH=true

  if [[ "$BUILD_STRATEGY" == "auto" ]]; then
    if $CROSS_ARCH && $IS_PODMAN; then
      yellow "Cloud Shell ($HOST_ARCH) + nodos $TARGET_ARCH → estrategia: kaniko (build en el cluster)."
      BUILD_STRATEGY="kaniko"
    else
      BUILD_STRATEGY="local"
    fi
  fi
  green "Estrategia de build: $BUILD_STRATEGY"

  if [[ "$BUILD_STRATEGY" == "kaniko" ]]; then
    if [[ -z "${KANIKO_GIT_CONTEXT:-}" ]]; then
      red "No pude detectar la URL del repo de git (origin)."
      red "Setea GIT_REPO_URL=https://github.com/usuario/repo.git y vuelve a correr."
      exit 1
    fi
    green "Contexto Kaniko: $KANIKO_GIT_CONTEXT"
    yellow "OJO: Kaniko construye desde GitHub. Asegurate de que '$GIT_BRANCH' este al dia (git push)."

    ensure_namespace_and_pull_secret
    wait_for_one_node

    step "Build backend con Kaniko → $BACKEND_IMAGE"
    build_with_kaniko "backend" "$BACKEND_IMAGE"

    step "Build frontend con Kaniko → $FRONTEND_IMAGE"
    build_with_kaniko "frontend" "$FRONTEND_IMAGE" "--build-arg=VITE_API_BASE=/api"
  else
    USE_BUILDX=false
    if ! $IS_PODMAN && docker buildx version >/dev/null 2>&1; then
      USE_BUILDX=true
      green "Docker con buildx detectado."
    fi

    if $CROSS_ARCH; then
      step "Verificando QEMU para emular $PLATFORMS (host es $HOST_ARCH)"
      if ! docker run --rm --platform "$PLATFORMS" docker.io/library/alpine:3.20 uname -m 2>/dev/null | grep -qi "$HOST_MATCH_FOR_TARGET"; then
        red "El host no puede emular $PLATFORMS y --local-build esta activo."
        red "Instala QEMU o quita --local-build (para que el script use Kaniko)."
        exit 1
      fi
      green "QEMU responde."
    fi

    if $USE_BUILDX; then
      step "Preparando buildx"
      docker buildx inspect sprintops-builder >/dev/null 2>&1 || \
        docker buildx create --name sprintops-builder --use --bootstrap >/dev/null
      docker buildx use sprintops-builder >/dev/null
      step "Build & push backend → $BACKEND_IMAGE"
      docker buildx build --platform "$PLATFORMS" --tag "$BACKEND_IMAGE" --push "$REPO_DIR/backend"
      step "Build & push frontend → $FRONTEND_IMAGE"
      docker buildx build --platform "$PLATFORMS" --tag "$FRONTEND_IMAGE" --push "$REPO_DIR/frontend"
    else
      step "Build backend (platform=$PLATFORMS) → $BACKEND_IMAGE"
      docker build --platform "$PLATFORMS" -t "$BACKEND_IMAGE" "$REPO_DIR/backend"
      docker push "$BACKEND_IMAGE"
      step "Build frontend (platform=$PLATFORMS) → $FRONTEND_IMAGE"
      docker build --platform "$PLATFORMS" -t "$FRONTEND_IMAGE" "$REPO_DIR/frontend"
      docker push "$FRONTEND_IMAGE"
    fi
  fi
else
  yellow "--skip-build activo: usando tag '$IMAGE_TAG' tal cual (asume imagenes en OCIR)."
fi

# -----------------------------------------------------------------------------
# 4) Aplicar manifests
# -----------------------------------------------------------------------------
step "Aplicando manifests"
kubectl apply -f "$K8S_DIR/00-namespace.yaml"

# Secret para que el cluster pueda jalar las imágenes privadas de OCIR
kubectl -n "$NAMESPACE" create secret docker-registry ocir-pull \
  --docker-server="$OCIR_REGISTRY" \
  --docker-username="$OCIR_DOCKER_USER" \
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

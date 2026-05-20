#!/usr/bin/env bash
# Aplica los manifests K8s sustituyendo placeholders y espera la IP del LoadBalancer.

set -e

source "$SPRINTOPS_HOME/utils/state-functions.sh"

BACKEND_IMAGE="$(state_get BACKEND_IMAGE)"
FRONTEND_IMAGE="$(state_get FRONTEND_IMAGE)"
DB_NAME="$(state_get ADB_DB_NAME)"

if [[ -z "$BACKEND_IMAGE" || -z "$FRONTEND_IMAGE" || -z "$DB_NAME" ]]; then
  echo "ERROR: faltan estados (BACKEND_IMAGE / FRONTEND_IMAGE / ADB_DB_NAME). Corre las fases anteriores."
  exit 1
fi

TMPDIR="$(mktemp -d)"
cp "$SPRINTOPS_HOME"/k8s/*.yaml "$TMPDIR/"

# Sustituir placeholders. FRONTEND_BASE_URL la dejamos como "/" inicialmente; el script lo corrige
# despues de que aparezca la IP, con un kubectl set env.
sed -i.bak "s|__BACKEND_IMAGE__|$BACKEND_IMAGE|g"   "$TMPDIR"/20-backend.yaml
sed -i.bak "s|__FRONTEND_IMAGE__|$FRONTEND_IMAGE|g" "$TMPDIR"/30-frontend.yaml
sed -i.bak "s|__DB_TNS_NAME__|$DB_NAME|g"           "$TMPDIR"/20-backend.yaml
sed -i.bak "s|__FRONTEND_BASE_URL__|http://placeholder|g" "$TMPDIR"/20-backend.yaml
rm -f "$TMPDIR"/*.bak

kubectl apply -f "$TMPDIR/00-namespace.yaml"
kubectl apply -f "$TMPDIR/20-backend.yaml"
kubectl apply -f "$TMPDIR/30-frontend.yaml"

echo "Esperando IP publica del LoadBalancer del frontend..."
EXT_IP=""
ELAPSED=0
TIMEOUT=600
while [[ -z "$EXT_IP" ]]; do
  EXT_IP=$(kubectl get svc frontend -n sprintops -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  if [[ -n "$EXT_IP" ]]; then break; fi
  if [[ "$ELAPSED" -ge "$TIMEOUT" ]]; then
    echo "TIMEOUT esperando IP. Revisa: kubectl get svc -n sprintops"
    exit 1
  fi
  printf "."
  sleep 10
  ELAPSED=$((ELAPSED + 10))
done

state_set FRONTEND_IP "$EXT_IP"

# Corregir FRONTEND_BASE_URL ahora que sabemos la IP
kubectl -n sprintops set env deploy/backend FRONTEND_BASE_URL="http://$EXT_IP"

# Esperar a backend Ready (puede tardar por la conexion inicial a ADB)
echo ""
echo "Esperando backend Ready..."
kubectl -n sprintops rollout status deploy/backend --timeout=10m || {
  echo "Backend no esta Ready. Logs:"
  kubectl -n sprintops logs deploy/backend --tail=100
  exit 1
}

echo ""
echo "Frontend URL: http://$EXT_IP"

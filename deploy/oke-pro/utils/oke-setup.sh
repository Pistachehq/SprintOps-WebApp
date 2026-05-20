#!/usr/bin/env bash
# Configura ~/.kube/config para hablarle al cluster recien creado y espera nodos Ready.

set -e

source "$SPRINTOPS_HOME/utils/state-functions.sh"

CLUSTER_OCID="$(state_get CLUSTER_OCID)"
REGION="$(state_get REGION)"

if [[ -z "$CLUSTER_OCID" ]]; then
  echo "ERROR: CLUSTER_OCID vacio. Corre primero terraform.sh."
  exit 1
fi

mkdir -p "$HOME/.kube"

# Configurar kubeconfig usando exec plugin (tokens cortos, mas seguros)
oci ce cluster create-kubeconfig \
  --cluster-id "$CLUSTER_OCID" \
  --file "$HOME/.kube/config" \
  --region "$REGION" \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT

# Esperar a que al menos 1 nodo este Ready
echo "Esperando worker nodes (puede tardar 5-10 min)..."
TIMEOUT=900
ELAPSED=0
while true; do
  READY=$(kubectl get nodes --no-headers 2>/dev/null | awk '$2 == "Ready" { c++ } END { print c+0 }')
  if [[ "$READY" -ge 1 ]]; then
    echo "Nodos Ready: $READY"
    break
  fi
  if [[ "$ELAPSED" -ge "$TIMEOUT" ]]; then
    echo "TIMEOUT esperando nodos. Revisa: kubectl get nodes, oci ce node-pool list ..."
    exit 1
  fi
  printf "."
  sleep 15
  ELAPSED=$((ELAPSED + 15))
done

# Crear namespace
kubectl get ns sprintops >/dev/null 2>&1 || kubectl apply -f "$SPRINTOPS_HOME/k8s/00-namespace.yaml"

echo "kubectl listo. Contexto activo:"
kubectl config current-context

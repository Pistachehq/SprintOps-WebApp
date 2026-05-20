#!/usr/bin/env bash
# Tira todo. Primero el LoadBalancer (para que OCI lo libere), luego terraform destroy.

set -e

source "$SPRINTOPS_HOME/utils/state-functions.sh"

read -p "Esto BORRA cluster, ADB y datos. Escribe DESTROY para confirmar: " CONF
if [[ "$CONF" != "DESTROY" ]]; then
  echo "Cancelado."
  exit 0
fi

if kubectl get ns sprintops >/dev/null 2>&1; then
  echo "Borrando Service LoadBalancer (frontend) para liberar el LB de OCI..."
  kubectl -n sprintops delete svc frontend --ignore-not-found
  sleep 30
  kubectl delete ns sprintops --ignore-not-found
fi

cd "$SPRINTOPS_HOME/terraform"
terraform destroy -auto-approve

# Limpiar estado local
rm -rf "$SPRINTOPS_STATE_HOME/state"
rm -f "$SPRINTOPS_HOME/terraform/wallet.zip"
echo "Destroy completo."

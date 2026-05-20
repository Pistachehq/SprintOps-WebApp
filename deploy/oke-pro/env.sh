#!/usr/bin/env bash
# Setup de variables de entorno del deploy "estilo lab" de SprintOps.
# Uso:  source deploy/oke-pro/env.sh
# Requiere: oci CLI, terraform, kubectl, docker (Cloud Shell ya los trae).

if ! (return 0 2>/dev/null); then
  echo "ERROR: este archivo se debe cargar con 'source', no ejecutar."
  exit 1
fi

export SPRINTOPS_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
export SPRINTOPS_REPO_ROOT="$( cd "$SPRINTOPS_HOME/../.." &> /dev/null && pwd )"
export SPRINTOPS_STATE_HOME="${SPRINTOPS_STATE_HOME:-$HOME/.sprintops-oke-pro}"
export SPRINTOPS_LOG="$SPRINTOPS_STATE_HOME/log"

mkdir -p "$SPRINTOPS_LOG" "$SPRINTOPS_STATE_HOME/state"

# Cargar las funciones de estado
source "$SPRINTOPS_HOME/utils/state-functions.sh"

# Atajos utiles
alias k='kubectl'
alias kpods='kubectl get pods -n sprintops'
alias klogs='kubectl logs -n sprintops -f deploy/backend'

# Region: la lee de la variable de Cloud Shell, o de ~/.oci/config, o asume Queretaro.
export OCI_REGION="${OCI_REGION:-${OCI_CLI_REGION:-$(grep -E '^region=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || echo "")}}"
export OCI_REGION="${OCI_REGION:-mx-queretaro-1}"

# Tenancy: Cloud Shell la pasa en OCI_TENANCY; si no, la leemos del config.
export OCI_TENANCY="${OCI_TENANCY:-$(grep -E '^tenancy=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2 || echo "")}"

echo "SPRINTOPS_HOME:       $SPRINTOPS_HOME"
echo "SPRINTOPS_STATE_HOME: $SPRINTOPS_STATE_HOME"
echo "OCI_REGION:           $OCI_REGION"

export PATH="$PATH:$SPRINTOPS_HOME/utils"

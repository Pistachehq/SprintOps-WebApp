#!/usr/bin/env bash
# Tira todo lo que setup.sh creo: cluster, VCN, ADB, OCIR repos, manifests.
# Uso:  source deploy/oke-pro/destroy.sh   o   bash deploy/oke-pro/destroy.sh
# OJO: la ADB se borra con TODOS los datos.

set -e

if test -z "$SPRINTOPS_HOME"; then
  if (return 0 2>/dev/null); then
    source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
  else
    SPRINTOPS_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    export SPRINTOPS_STATE_HOME="${SPRINTOPS_STATE_HOME:-$HOME/.sprintops-oke-pro}"
    source "$SPRINTOPS_HOME/utils/state-functions.sh"
  fi
fi

bash "$SPRINTOPS_HOME/utils/main-destroy.sh"

#!/usr/bin/env bash
# Aplica los .tf de deploy/oke-pro/terraform/.
# Asume que main-setup.sh ya seteo los estados (TENANCY_OCID, COMPARTMENT_OCID, etc.).

set -e

if test -z "$SPRINTOPS_HOME"; then
  echo "ERROR: SPRINTOPS_HOME no esta seteado"
  exit 1
fi
source "$SPRINTOPS_HOME/utils/state-functions.sh"

cd "$SPRINTOPS_HOME/terraform"

# Exportar las variables que esperan los .tf
export TF_VAR_ociTenancyOcid="$(state_get TENANCY_OCID)"
export TF_VAR_ociUserOcid="$(state_get USER_OCID)"
export TF_VAR_ociCompartmentOcid="$(state_get COMPARTMENT_OCID)"
export TF_VAR_ociRegionIdentifier="$(state_get REGION)"
export TF_VAR_runName="${SPRINTOPS_RUN_NAME:-sprintops}"
export TF_VAR_adbAdminPassword="$(state_get ADB_ADMIN_PASSWORD)"
export TF_VAR_sshPublicKey="$(state_get SSH_PUBLIC_KEY)"

# Defaults sobre-escribibles: para Free Tier, exportar antes de correr setup.sh:
#   export SPRINTOPS_NODE_SHAPE=VM.Standard.A1.Flex   (Always Free, capacidad ARM lottery)
#   export SPRINTOPS_ADB_IS_FREE_TIER=true            (default)
[[ -n "${SPRINTOPS_NODE_SHAPE:-}" ]] && export TF_VAR_nodeShape="$SPRINTOPS_NODE_SHAPE"
[[ -n "${SPRINTOPS_NODE_OCPUS:-}" ]] && export TF_VAR_nodeOcpus="$SPRINTOPS_NODE_OCPUS"
[[ -n "${SPRINTOPS_NODE_MEMORY_GBS:-}" ]] && export TF_VAR_nodeMemoryGbs="$SPRINTOPS_NODE_MEMORY_GBS"
[[ -n "${SPRINTOPS_NODE_COUNT:-}" ]] && export TF_VAR_nodeCount="$SPRINTOPS_NODE_COUNT"
[[ -n "${SPRINTOPS_K8S_VERSION:-}" ]] && export TF_VAR_kubernetesVersion="$SPRINTOPS_K8S_VERSION"
[[ -n "${SPRINTOPS_ADB_IS_FREE_TIER:-}" ]] && export TF_VAR_adbIsFreeTier="$SPRINTOPS_ADB_IS_FREE_TIER"

# Init + apply
if ! terraform init -upgrade; then
  echo "ERROR: terraform init fallo"
  exit 1
fi

if ! terraform apply -auto-approve; then
  echo "ERROR: terraform apply fallo. Revisa $SPRINTOPS_LOG y los .tf."
  exit 1
fi

# Persistir outputs como estado para los pasos siguientes
state_set CLUSTER_OCID "$(terraform output -raw cluster_id)"
state_set OCIR_NAMESPACE "$(terraform output -raw ocir_namespace)"
state_set OCIR_BACKEND_REPO "$(terraform output -raw ocir_backend_repo)"
state_set OCIR_FRONTEND_REPO "$(terraform output -raw ocir_frontend_repo)"
state_set ADB_OCID "$(terraform output -raw adb_id)"
state_set ADB_DB_NAME "$(terraform output -raw adb_db_name)"
state_set WALLET_ZIP "$(terraform output -raw wallet_zip_path)"
state_set APP_LABEL "$(terraform output -raw app_label)"

echo "Terraform OK. Recursos creados:"
echo "  Cluster:   $(state_get CLUSTER_OCID)"
echo "  ADB name:  $(state_get ADB_DB_NAME)"
echo "  OCIR ns:   $(state_get OCIR_NAMESPACE)"

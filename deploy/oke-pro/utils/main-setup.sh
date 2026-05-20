#!/usr/bin/env bash
# Orquesta el deploy completo. Se llama desde setup.sh.
# Aplica fase por fase, guardando estado para que sea resumible.

set -e

if test -z "$SPRINTOPS_HOME"; then
  echo "ERROR: SPRINTOPS_HOME no esta seteado. Carga env.sh primero."
  exit 1
fi
source "$SPRINTOPS_HOME/utils/state-functions.sh"

green()  { printf "\033[1;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[1;33m%s\033[0m\n" "$*"; }
red()    { printf "\033[1;31m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[1;36m== %s ==\033[0m\n" "$*"; }

# ---------------------------------------------------------------------------
# 1. Detectar identidad: tenancy, user, region, compartimento
# ---------------------------------------------------------------------------
step "1) Identidad OCI"

while ! state_done TENANCY_OCID; do
  TENANCY_OCID="${OCI_TENANCY:-$(grep -E '^tenancy=' "$HOME/.oci/config" 2>/dev/null | head -1 | cut -d= -f2)}"
  if [[ -z "$TENANCY_OCID" ]]; then
    read -p "Pega el OCID de tu tenancy (Profile menu -> Tenancy): " TENANCY_OCID
  fi
  state_set TENANCY_OCID "$TENANCY_OCID"
done
green "TENANCY_OCID: $(state_get TENANCY_OCID)"

while ! state_done USER_OCID; do
  USER_OCID="$(oci iam user list --query 'data[0].id' --raw-output 2>/dev/null || true)"
  if [[ -z "$USER_OCID" ]]; then
    read -p "Pega el OCID de tu usuario OCI: " USER_OCID
  fi
  state_set USER_OCID "$USER_OCID"
done
green "USER_OCID: $(state_get USER_OCID)"

while ! state_done USER_NAME; do
  state_set USER_NAME "$(oci iam user get --user-id "$(state_get USER_OCID)" --query 'data.name' --raw-output 2>/dev/null || echo unknown)"
done

while ! state_done REGION; do
  state_set REGION "${OCI_REGION:-mx-queretaro-1}"
done
green "REGION: $(state_get REGION)"

while ! state_done COMPARTMENT_OCID; do
  oci iam compartment list --compartment-id-in-subtree true --all \
    --query 'data[].{name:name,id:id,state:"lifecycle-state"}' --output table 2>/dev/null || true
  echo
  read -p "Pega el OCID del compartimento (Enter = usar tenancy raiz): " COMPARTMENT_OCID
  COMPARTMENT_OCID="${COMPARTMENT_OCID:-$(state_get TENANCY_OCID)}"
  state_set COMPARTMENT_OCID "$COMPARTMENT_OCID"
done
green "COMPARTMENT_OCID: $(state_get COMPARTMENT_OCID)"

# ---------------------------------------------------------------------------
# 2. Recoger inputs: password de ADB, SSH key publica
# ---------------------------------------------------------------------------
step "2) Inputs sensibles"

while ! state_done ADB_ADMIN_PASSWORD; do
  echo
  echo "El password de ADMIN de la Autonomous DB debe cumplir:"
  echo "  - 12 a 30 caracteres"
  echo "  - al menos 1 mayuscula, 1 minuscula, 1 numero"
  echo "  - NO contener la palabra 'admin' ni el caracter \""
  while true; do
    read -s -r -p "Password de ADB ADMIN: " PW; echo
    if [[ ${#PW} -ge 12 && ${#PW} -le 30 && "$PW" =~ [A-Z] && "$PW" =~ [a-z] && "$PW" =~ [0-9] && "$PW" != *admin* && "$PW" != *'"'* ]]; then
      break
    else
      red "Password invalido, intentalo de nuevo."
    fi
  done
  state_set ADB_ADMIN_PASSWORD "$PW"
done

while ! state_done SSH_PUBLIC_KEY; do
  if [[ -f "$HOME/.ssh/id_rsa.pub" ]]; then
    state_set SSH_PUBLIC_KEY "$(cat "$HOME/.ssh/id_rsa.pub")"
  else
    yellow "No hay ~/.ssh/id_rsa.pub. Lo genero ahora con defaults."
    ssh-keygen -t rsa -b 4096 -N "" -f "$HOME/.ssh/id_rsa" >/dev/null
    state_set SSH_PUBLIC_KEY "$(cat "$HOME/.ssh/id_rsa.pub")"
  fi
done

# ---------------------------------------------------------------------------
# 3. Provisionar infraestructura con Terraform (cluster, VCN, ADB, OCIR repos)
# ---------------------------------------------------------------------------
step "3) Provisionar infra (Terraform)"
if ! state_done PROVISIONING; then
  bash "$SPRINTOPS_HOME/utils/terraform.sh"
  state_set_done PROVISIONING
fi

# ---------------------------------------------------------------------------
# 4. Configurar kubectl contra el cluster recien creado
# ---------------------------------------------------------------------------
step "4) Configurar kubectl"
if ! state_done KUBECTL_READY; then
  bash "$SPRINTOPS_HOME/utils/oke-setup.sh"
  state_set_done KUBECTL_READY
fi

# ---------------------------------------------------------------------------
# 5. Build + push de imagenes a OCIR
# ---------------------------------------------------------------------------
step "5) Build & push de imagenes"
if ! state_done IMAGES_PUSHED; then
  bash "$SPRINTOPS_HOME/utils/java-builds.sh"
  state_set_done IMAGES_PUSHED
fi

# ---------------------------------------------------------------------------
# 6. Setup de DB: wallet como Secret + secret de credenciales
# ---------------------------------------------------------------------------
step "6) Setup de DB y secrets"
if ! state_done DB_SETUP; then
  bash "$SPRINTOPS_HOME/utils/db-setup.sh"
  state_set_done DB_SETUP
fi

# ---------------------------------------------------------------------------
# 7. Aplicar manifests K8s y esperar IP del LoadBalancer
# ---------------------------------------------------------------------------
step "7) Deploy a Kubernetes"
if ! state_done APPS_DEPLOYED; then
  bash "$SPRINTOPS_HOME/utils/k8s-deploy.sh"
  state_set_done APPS_DEPLOYED
fi

# ---------------------------------------------------------------------------
# Cierre
# ---------------------------------------------------------------------------
state_set_done SETUP_VERIFIED

EXT_IP="$(state_get FRONTEND_IP)"
green ""
green "============================================="
green "  SprintOps desplegado"
green "  URL: http://$EXT_IP"
green "============================================="
yellow "Comandos utiles:"
echo "  kubectl -n sprintops get pods,svc"
echo "  kubectl -n sprintops logs deploy/backend -f"
echo "  source deploy/oke-pro/destroy.sh   # para tirar todo"

#!/usr/bin/env bash
# Crea los Secrets de Kubernetes: wallet de la ADB y credenciales de conexion.

set -e

source "$SPRINTOPS_HOME/utils/state-functions.sh"

WALLET_ZIP="$(state_get WALLET_ZIP)"
ADB_PW="$(state_get ADB_ADMIN_PASSWORD)"

if [[ ! -f "$WALLET_ZIP" ]]; then
  # terraform output dejo solo el nombre relativo; resolvemos
  WALLET_ZIP="$SPRINTOPS_HOME/terraform/wallet.zip"
fi

if [[ ! -f "$WALLET_ZIP" ]]; then
  echo "ERROR: no encuentro el wallet zip ($WALLET_ZIP). Re-ejecuta terraform apply."
  exit 1
fi

# Descomprimir a un directorio temporal
TMP_WALLET="$(mktemp -d)"
unzip -o -q "$WALLET_ZIP" -d "$TMP_WALLET"

# Crear/actualizar el Secret oracle-wallet con TODOS los archivos del wallet
kubectl -n sprintops delete secret oracle-wallet --ignore-not-found
kubectl -n sprintops create secret generic oracle-wallet \
  --from-file="$TMP_WALLET"

# Secret con el password de ADMIN
kubectl -n sprintops delete secret db-credentials --ignore-not-found
kubectl -n sprintops create secret generic db-credentials \
  --from-literal=adminPassword="$ADB_PW"

# Secret opcional con credenciales OAuth, Telegram, Groq (vacios por defecto)
kubectl -n sprintops delete secret backend-secrets --ignore-not-found
kubectl -n sprintops create secret generic backend-secrets \
  --from-literal=groqApiKey="${GROQ_API_KEY:-}" \
  --from-literal=googleClientId="${GOOGLE_CLIENT_ID:-}" \
  --from-literal=googleClientSecret="${GOOGLE_CLIENT_SECRET:-}" \
  --from-literal=githubClientId="${GITHUB_CLIENT_ID:-}" \
  --from-literal=githubClientSecret="${GITHUB_CLIENT_SECRET:-}" \
  --from-literal=telegramBotToken="${TELEGRAM_BOT_TOKEN:-}" \
  --from-literal=telegramBotUsername="${TELEGRAM_BOT_USERNAME:-}"

# Secret de pull de OCIR (necesario porque marcamos los repos como private)
USERNAME="$(state_get OCIR_USERNAME)"
NAMESPACE="$(state_get OCIR_NAMESPACE)"
REGION="$(state_get REGION)"
read -s -r -p "(Re)Pega tu Auth Token para crear el imagePullSecret de OCIR: " TOKEN
echo

kubectl -n sprintops delete secret ocir-pull --ignore-not-found
kubectl -n sprintops create secret docker-registry ocir-pull \
  --docker-server="${REGION}.ocir.io" \
  --docker-username="$USERNAME" \
  --docker-password="$TOKEN" \
  --docker-email="${USER_NAME:-noemail@example.com}"

# Patchear default ServiceAccount para que los pods hagan pull automaticamente
kubectl -n sprintops patch serviceaccount default \
  -p '{"imagePullSecrets":[{"name":"ocir-pull"}]}'

rm -rf "$TMP_WALLET"
echo "Secrets creados: oracle-wallet, db-credentials, backend-secrets, ocir-pull"

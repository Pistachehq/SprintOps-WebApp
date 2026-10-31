#!/usr/bin/env bash
# Actualiza groqApiKey en backend-secrets y reinicia el backend.
# Uso:
#   export GROQ_API_KEY='gsk_...'
#   bash deploy/oke-pro/utils/patch-groq-key.sh
# o guarda la key en ~/.groq-api-key (sin comillas ni saltos de línea extra).

set -euo pipefail

NS="${K8S_NAMESPACE:-sprintops}"

if [[ -z "${GROQ_API_KEY:-}" && -f "$HOME/.groq-api-key" ]]; then
  GROQ_API_KEY="$(tr -d '\n\r' < "$HOME/.groq-api-key")"
fi

if [[ -z "${GROQ_API_KEY:-}" ]]; then
  echo "ERROR: define GROQ_API_KEY o crea ~/.groq-api-key"
  echo "  Genera una clave nueva en https://console.groq.com/keys"
  exit 1
fi

GROQ_API_KEY="$(printf '%s' "$GROQ_API_KEY" | tr -d '\n\r' | sed -e 's/^["'\'']//' -e 's/["'\'']$//')"

if [[ ! "$GROQ_API_KEY" =~ ^gsk_ ]]; then
  echo "ERROR: la clave debe empezar con gsk_ (revisa que no esté truncada ni sea otro token)"
  exit 1
fi

echo "Probando la clave contra Groq…"
HTTP_CODE="$(curl -sS -o /tmp/groq-test.json -w '%{http_code}' \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"ping"}],"max_tokens":5}' \
  https://api.groq.com/openai/v1/chat/completions || true)"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "ERROR: Groq respondió HTTP $HTTP_CODE — la clave no es válida."
  head -c 400 /tmp/groq-test.json 2>/dev/null || true
  echo
  echo "Crea una clave nueva en https://console.groq.com/keys y vuelve a ejecutar este script."
  exit 1
fi
echo "Clave OK (HTTP 200)."

PATCH_JSON="$(python3 -c 'import json, os; print(json.dumps({"stringData":{"groqApiKey":os.environ["GROQ_API_KEY"]}}))')"
export GROQ_API_KEY

kubectl -n "$NS" patch secret backend-secrets --type merge -p "$PATCH_JSON"
kubectl -n "$NS" rollout restart deploy/backend
kubectl -n "$NS" rollout status deploy/backend --timeout=180s
echo "Listo: backend reiniciado con GROQ_API_KEY actualizada."

#!/usr/bin/env bash
# Verificación Reto D4 desde Cloud Shell o local.
set -euo pipefail

BASE_URL="${BASE_URL:-}"
if [[ -z "$BASE_URL" ]]; then
  IP=$(kubectl -n sprintops get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  if [[ -n "$IP" ]]; then
    BASE_URL="http://${IP}"
  else
    BASE_URL="http://127.0.0.1:8080"
  fi
fi
BASE_URL="${BASE_URL%/}"
PROJECT_ID="${LOAD_PROJECT_ID:-21}"

pass() { echo "OK  $*"; }
fail() { echo "FAIL $*"; exit 1; }

echo "=== Reto D4 verify ==="
echo "BASE_URL=$BASE_URL  projectId=$PROJECT_ID"

code=$(curl -sS -o /tmp/d4-status.json -w "%{http_code}" "${BASE_URL}/api/ai/status")
[[ "$code" == "200" ]] || fail "status HTTP $code"
python3 -c "import json; d=json.load(open('/tmp/d4-status.json')); assert d.get('chatModelConfigured') is True, d" \
  && pass "/api/ai/status chatModelConfigured" \
  || echo "WARN: Gemini no configurado (GOOGLE_GENAI_API_KEY). Resto de pruebas pueden fallar."

code=$(curl -sS -o /tmp/d4-gen.json -w "%{http_code}" \
  "${BASE_URL}/api/ai/generate?message=Di%20hola%20en%20una%20palabra")
[[ "$code" == "200" ]] && pass "/api/ai/generate ($code)" || fail "/api/ai/generate HTTP $code"

curl -sS -X POST "${BASE_URL}/api/rag/insights" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Verificación D4 proyecto ${PROJECT_ID}\",\"projectId\":${PROJECT_ID},\"done\":false}" \
  -o /tmp/d4-rag-post.json
grep -q '"insight"' /tmp/d4-rag-post.json && pass "POST /api/rag/insights" || fail "POST /api/rag/insights"

curl -sS "${BASE_URL}/api/rag/search?q=verificacion&projectId=${PROJECT_ID}&topK=2" -o /tmp/d4-search.json
grep -q '"hits"' /tmp/d4-search.json && pass "GET /api/rag/search" || fail "GET /api/rag/search"

code=$(curl -sS -o /tmp/d4-ragchat.json -w "%{http_code}" \
  "${BASE_URL}/api/ai/rag-chat?message=Que%20dice%20la%20verificacion&projectId=${PROJECT_ID}")
[[ "$code" == "200" ]] && pass "/api/ai/rag-chat ($code)" || fail "/api/ai/rag-chat HTTP $code"

echo ""
echo "=== D4 verify completado ==="
cat /tmp/d4-status.json
echo ""

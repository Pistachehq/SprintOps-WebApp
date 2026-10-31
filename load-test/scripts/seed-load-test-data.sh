#!/usr/bin/env bash
# Crea proyecto + sprint + issues de prueba para JMeter (entorno OKE o local).
# Uso:
#   export BASE_URL="http://163.192.154.208"
#   ./load-test/scripts/seed-load-test-data.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_URL="${BASE_URL%/}"
API="${BASE_URL}/api"

OWNER_EMAIL="${LOAD_OWNER_EMAIL:-sm@example.com}"
OWNER_PASSWORD="${LOAD_OWNER_PASSWORD:-123}"
PROJECT_NAME="${LOAD_PROJECT_NAME:-SprintOps Load Test}"
ISSUE_COUNT="${LOAD_ISSUE_COUNT:-40}"

json_post() {
  local path="$1"
  local body="$2"
  curl -sfS -X POST -H "Content-Type: application/json" -d "$body" "${API}${path}"
}

json_put() {
  local path="$1"
  local body="$2"
  curl -sfS -X PUT -H "Content-Type: application/json" -d "$body" "${API}${path}"
}

echo "=== Seed datos de carga SprintOps ==="
echo "API: ${API}"

LOGIN_BODY=$(printf '{"email":"%s","password":"%s"}' "$OWNER_EMAIL" "$OWNER_PASSWORD")
LOGIN_JSON=$(json_post "/auth/login" "$LOGIN_BODY")
OWNER_ID=$(echo "$LOGIN_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Usuario owner id=${OWNER_ID} (${OWNER_EMAIL})"

# Proyecto (si ya existe uno con el mismo nombre del owner, reutilizar)
PROJECTS_JSON=$(curl -sfS "${API}/proyectos/usuario/${OWNER_ID}")
EXISTING_ID=$(echo "$PROJECTS_JSON" | python3 -c "
import sys, json
name = '''${PROJECT_NAME}'''
for p in json.load(sys.stdin):
    if p.get('name') == name:
        print(p['id'])
        break
" 2>/dev/null || true)

if [[ -n "${EXISTING_ID:-}" ]]; then
  PROJECT_ID="$EXISTING_ID"
  echo "Reutilizando proyecto id=${PROJECT_ID}"
else
  TODAY=$(date +%Y-%m-%d)
  END=$(date -v+90d +%Y-%m-%d 2>/dev/null || date -d '+90 days' +%Y-%m-%d)
  PROJ_BODY=$(cat <<EOF
{"name":"${PROJECT_NAME}","description":"Datos para prueba de carga JMeter","start":"${TODAY}","end":"${END}","ownerId":${OWNER_ID}}
EOF
)
  PROJ_JSON=$(json_post "/proyectos" "$PROJ_BODY")
  PROJECT_ID=$(echo "$PROJ_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "Proyecto creado id=${PROJECT_ID}"
fi

# Rol Scrum Master para métricas / issues completos
json_put "/proyectos/${PROJECT_ID}/miembros/${OWNER_ID}/rol" '{"role":"Scrum Master"}' >/dev/null || true

# Sprint activo
SPRINTS_JSON=$(curl -sfS "${API}/sprints/proyecto/${PROJECT_ID}")
SPRINT_ID=$(echo "$SPRINTS_JSON" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
print(arr[0]['id'] if arr else '')
" 2>/dev/null || true)

if [[ -z "${SPRINT_ID:-}" ]]; then
  START=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '-7 days' +%Y-%m-%d)
  END_S=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d '+7 days' +%Y-%m-%d)
  SPRINT_BODY=$(cat <<EOF
{"projectId":${PROJECT_ID},"name":"Sprint carga","goal":"Prueba JMeter","status":"P","startDate":"${START}","endDate":"${END_S}","capacity":80}
EOF
)
  SPRINT_JSON=$(json_post "/sprints" "$SPRINT_BODY")
  SPRINT_ID=$(echo "$SPRINT_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "Sprint creado id=${SPRINT_ID}"
else
  echo "Reutilizando sprint id=${SPRINT_ID}"
fi

# Issues
EXISTING_ISSUES=$(curl -sfS "${API}/issues/proyecto/${PROJECT_ID}" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
NEED=$((ISSUE_COUNT - EXISTING_ISSUES))
if [[ "$NEED" -le 0 ]]; then
  echo "Ya hay ${EXISTING_ISSUES} issues (objetivo ${ISSUE_COUNT})"
else
  echo "Creando ${NEED} issues..."
  for i in $(seq 1 "$NEED"); do
    TITLE="Load issue ${EXISTING_ISSUES}+${i}"
    ISSUE_BODY=$(cat <<EOF
{"projectId":${PROJECT_ID},"sprintId":"${SPRINT_ID}","title":"${TITLE}","description":"seed jmeter","purpose":"","status":"todo","priority":"Medium","storyPoints":3,"assigneeIds":[${OWNER_ID}]}
EOF
)
    json_post "/issues" "$ISSUE_BODY" >/dev/null
  done
  echo "Issues listos (~${ISSUE_COUNT} en proyecto)"
fi

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/jmeter/load-target.env"
cat > "$ENV_FILE" <<EOF
# Generado por seed-load-test-data.sh — usar en JMeter (-J) o DevOps pipeline
LOAD_PROJECT_ID=${PROJECT_ID}
LOAD_SPRINT_ID=${SPRINT_ID}
LOAD_OWNER_ID=${OWNER_ID}
BASE_URL=${BASE_URL}
EOF

echo ""
echo "=== Valores para JMeter / DevOps ==="
echo "LOAD_PROJECT_ID=${PROJECT_ID}"
echo "LOAD_SPRINT_ID=${SPRINT_ID}"
echo "Guardado en: ${ENV_FILE}"

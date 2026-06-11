# Reto D4 — Spring AI + RAG (SprintOps)

Implementación alineada con `RetoOrcl_D4.pdf`: Gemini vía Spring AI, endpoints de chat, embeddings y columna **VECTOR** en Oracle ATP.

## Requisitos

1. API key de [Google AI Studio](https://aistudio.google.com/) (no uses la del PDF del curso; es de ejemplo).
2. Backend desplegado con perfil `oracle` (OKE).

## Configurar secret en OKE

```bash
# En Cloud Shell, antes de db-setup o patch manual:
export GOOGLE_GENAI_API_KEY="tu-api-key"

kubectl -n sprintops patch secret backend-secrets --type merge \
  -p "$(printf '{"stringData":{"googleGenaiApiKey":"%s"}}' "$GOOGLE_GENAI_API_KEY")"

# Activar perfil gemini (Spring AI solo arranca con API key + este perfil)
kubectl -n sprintops patch configmap backend-config --type merge \
  -p '{"data":{"SPRING_PROFILES_ACTIVE":"prod,oracle,gemini"}}'

kubectl -n sprintops rollout restart deploy/backend
kubectl -n sprintops rollout status deploy/backend --timeout=180s
```

O vuelve a correr `db-setup.sh` con `GOOGLE_GENAI_API_KEY` exportado y luego el patch del ConfigMap.

## Local (sin tumbar el arranque)

Sin API key el backend arranca **normal** (perfil default). Gemini solo con:

```bash
export GOOGLE_GENAI_API_KEY="tu-api-key"
mvn spring-boot:run -Dspring-boot.run.profiles=gemini
```

O en `application-local.properties`: `spring.profiles.active=gemini` y la variable de entorno.

## Redeploy solo backend

```bash
cd ~/SprintOps-WebApp
git pull
source deploy/oke-pro/setup.sh
./deploy/oke-pro/utils/java-builds.sh
./deploy/oke-pro/utils/k8s-deploy.sh
```

## Comprobaciones por terminal

```bash
export APP="http://$(kubectl -n sprintops get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"

# Estado Spring AI
curl -sS "${APP}/api/ai/status" | python3 -m json.tool

# Chat Gemini (PDF: /ai/generate → en SprintOps /api/ai/generate)
curl -sS "${APP}/api/ai/generate?message=Hola%20SprintOps" | python3 -m json.tool

# Indexar documento RAG
curl -sS -X POST "${APP}/api/rag/insights" \
  -H "Content-Type: application/json" \
  -d '{"description":"El sprint 21 tiene 40 issues de prueba de carga JMeter","projectId":21,"done":false}' \
  | python3 -m json.tool

# Búsqueda vectorial
curl -sS "${APP}/api/rag/search?q=JMeter&projectId=21&topK=3" | python3 -m json.tool

# Chat con contexto RAG
curl -sS "${APP}/api/ai/rag-chat?message=Cuántos%20issues%20de%20carga&projectId=21" | python3 -m json.tool
```

Script automático: `load-test/scripts/verify-d4-springai.sh` (misma IP y projectId).

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ai/status` | ¿Gemini y VECTOR activos? |
| GET | `/api/ai/generate?message=` | Chat síncrono |
| GET | `/api/ai/generateStream?message=` | Stream SSE |
| GET | `/api/ai/rag-chat?message=&projectId=` | RAG + Gemini |
| POST | `/api/rag/insights` | Indexar texto + embedding |
| GET | `/api/rag/search?q=` | Búsqueda por similitud |
| GET | `/api/rag/insights` | Listar indexados |

## Docker + LLM local (opcional, PDF)

Carpeta `deploy/d4-llama-local/` con `Dockerfile` de ejemplo (llama.cpp). No se despliega en OKE free; corre en tu PC:

```bash
cd deploy/d4-llama-local
# Coloca un .gguf en esta carpeta y descomenta COPY en Dockerfile
docker build -t sprintops-llm-local .
docker run --rm -p 8081:8080 sprintops-llm-local
```

## Local (MySQL)

Sin columna VECTOR: RAG guarda texto y búsqueda por `contains`. Con `GOOGLE_GENAI_API_KEY` en `application-local.properties` funcionan `/api/ai/*`.

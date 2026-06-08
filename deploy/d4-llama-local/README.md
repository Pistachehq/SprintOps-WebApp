# LLM local (Reto D4 — sección Docker)

No forma parte del despliegue OKE. Sirve para la captura del PDF (LM Studio / `docker run`).

1. Instala [LM Studio](https://lmstudio.ai/) o descarga un `.gguf` desde Hugging Face.
2. Copia el archivo a esta carpeta y descomenta `COPY` en `Dockerfile`.
3. `docker build -t sprintops-llm-local .`
4. `docker run --rm -p 8081:8080 sprintops-llm-local`
5. Prueba: `curl http://localhost:8081/v1/models` (según versión del server).

SprintOps en producción usa **Gemini** vía Spring AI (`/api/ai/*`), no este contenedor.

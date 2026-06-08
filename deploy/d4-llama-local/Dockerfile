# Reto D4 — LLM local con llama.cpp (opcional, en tu PC con GPU/CPU).
# 1) Descarga un modelo .gguf (LM Studio / Hugging Face).
# 2) Descomenta COPY y ajusta el nombre del archivo.
# 3) docker build -t sprintops-llm-local . && docker run --rm -p 8081:8080 sprintops-llm-local

FROM ghcr.io/ggml-org/llama.cpp:server

RUN mkdir -p /models

# COPY ./tu-modelo.Q4_K_S.gguf /models/model.gguf

EXPOSE 8080

# CPU: --n-gpu-layers 0   |   GPU: --n-gpu-layers 99
ENTRYPOINT ["/app/llama-server", "-m", "/models/model.gguf", "--host", "0.0.0.0", "--port", "8080", "--n-gpu-layers", "0", "--ctx-size", "4096"]

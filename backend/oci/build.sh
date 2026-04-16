#!/usr/bin/env bash
# Empaqueta el JAR y construye/pushea la imagen (misma idea que MtdrSpring/backend/build.sh del ZIP de práctica).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND"

export IMAGE_NAME="${IMAGE_NAME:-sprintops-backend}"
export IMAGE_VERSION="${IMAGE_VERSION:-0.1}"

if [ -z "${DOCKER_REGISTRY:-}" ] && command -v state_get >/dev/null 2>&1; then
  export DOCKER_REGISTRY="$(state_get DOCKER_REGISTRY)"
fi
if [ -z "${DOCKER_REGISTRY:-}" ]; then
  echo "Error: define DOCKER_REGISTRY (ej. phx.ocir.io/axxxxxx/nombre-repo)."
  exit 1
fi

export IMAGE="${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}"

mvn -B package -DskipTests
docker build -f Dockerfile -t "$IMAGE" .
docker push "$IMAGE"
if [ $? -eq 0 ]; then
  docker rmi "$IMAGE" || true
fi

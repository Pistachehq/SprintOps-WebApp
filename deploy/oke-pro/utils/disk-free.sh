#!/usr/bin/env bash
# Libera espacio en Cloud Shell antes de docker build (suele quedarse sin disco con node_modules).

set -e

echo "=== Espacio en disco (antes) ==="
df -h / /home 2>/dev/null || df -h

echo "Limpiando capas Docker/Podman antiguas..."
docker system prune -af 2>/dev/null || true
podman system prune -af 2>/dev/null || true

echo "Limpiando caches npm..."
rm -rf "${HOME}/.npm/_cacache" 2>/dev/null || true
rm -rf /tmp/npm-* 2>/dev/null || true

# Builds frontend previos en el repo (no van al contexto si estan en .gitignore, pero ocupan $HOME)
if [[ -n "${SPRINTOPS_REPO_ROOT:-}" && -d "${SPRINTOPS_REPO_ROOT}/frontend/node_modules" ]]; then
  echo "(Opcional) Borra frontend/node_modules manualmente si el build en host falla por espacio."
fi

echo "=== Espacio en disco (despues) ==="
df -h / /home 2>/dev/null || df -h

_avail_kb="$(df -k / 2>/dev/null | awk 'NR==2 {print $4}')"
if [[ -n "$_avail_kb" && "$_avail_kb" -lt 2097152 ]]; then
  echo "AVISO: menos de ~2 GB libres en /. Usa build en host (java-builds.sh lo intenta) o libera mas espacio."
fi

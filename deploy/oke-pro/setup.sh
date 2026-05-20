#!/usr/bin/env bash
# Entrypoint del deploy de SprintOps (estilo lab MtdrSpring).
# Uso:    source deploy/oke-pro/setup.sh
# Reanuda donde quedo si se cae a mitad (gracias al state machine).

if ! (return 0 2>/dev/null); then
  echo "ERROR: Usa 'source deploy/oke-pro/setup.sh' (no 'bash')."
  exit 1
fi

# Cargar env si todavia no se cargo
if test -z "$SPRINTOPS_HOME"; then
  source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
fi

if state_done SETUP_VERIFIED; then
  echo
  echo "El setup ya esta completado. Para volver a correrlo: borra $SPRINTOPS_STATE_HOME y reinicia."
  return 0 2>/dev/null || exit 0
fi

MAIN="$SPRINTOPS_HOME/utils/main-setup.sh"
if ps -ef | grep "$MAIN" | grep -v grep >/dev/null; then
  echo "Ya hay una corrida de $MAIN. Si quieres reiniciarla, matala primero (ps -ef | grep main-setup)."
  return 0 2>/dev/null || exit 0
fi

bash "$MAIN" 2>&1 | tee -a "$SPRINTOPS_LOG/main-setup.log"

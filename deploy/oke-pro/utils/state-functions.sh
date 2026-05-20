#!/usr/bin/env bash
# Maquina de estado simple en archivos. Misma idea que el lab MtdrSpring.
# Cada "estado" es un archivo en $SPRINTOPS_STATE_HOME/state/<NAME>.
# - state_set NAME VALUE   : escribe el valor (con un solo writer, evita races)
# - state_get NAME         : imprime el valor
# - state_done NAME        : returns 0 si el estado ya existe con valor no vacio
# - state_set_done NAME    : marca como hecho con valor "1"

if test -z "$SPRINTOPS_STATE_HOME"; then
  echo "state-functions.sh requiere SPRINTOPS_STATE_HOME"
  return 1 2>/dev/null || exit 1
fi

mkdir -p "$SPRINTOPS_STATE_HOME/state"

state_file() { echo "$SPRINTOPS_STATE_HOME/state/$1"; }

state_set() {
  local name="$1"
  shift
  local value="$*"
  echo "$value" > "$(state_file "$name")"
  echo "$(date '+%Y-%m-%d %H:%M:%S') $name=$value" >> "$SPRINTOPS_STATE_HOME/state.log"
}

state_set_done() {
  state_set "$1" "1"
}

state_get() {
  local f
  f="$(state_file "$1")"
  if [[ -f "$f" ]]; then
    tr -d '\n' < "$f"
  fi
}

state_done() {
  local v
  v="$(state_get "$1")"
  [[ -n "$v" ]]
}

export -f state_set state_set_done state_get state_done state_file

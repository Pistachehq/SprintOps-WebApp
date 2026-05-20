#!/usr/bin/env bash
# Bootstrap de SprintOps en una VM de OCI (Oracle Linux 8/9, AMD E2.1.Micro o cualquier shape).
# Corre DENTRO de la VM via SSH como root (sudo bash bootstrap.sh).
#
# Asume que en /tmp/ estan:
#   - docker-compose.yml
#   - .env (generado por build-and-push.sh en Cloud Shell)

set -euo pipefail

INSTALL_DIR="/opt/sprintops"
ENV_FILE="$INSTALL_DIR/.env"

green()  { printf "\033[1;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[1;33m%s\033[0m\n" "$*"; }
red()    { printf "\033[1;31m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[1;36m> %s\033[0m\n" "$*"; }

if [[ $EUID -ne 0 ]]; then
  red "Corre como root: sudo bash $0"
  exit 1
fi

# 1. Crear swap de 1GB si no existe (1GB de RAM se llena rapido al arrancar todo)
if ! swapon --show | grep -q '/swapfile'; then
  step "Creando swap de 1 GB (/swapfile) para que no muera la VM al arrancar Java"
  fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  green "Swap activo."
else
  green "Swap ya existe."
fi

# 2. Instalar docker + compose (Oracle Linux es RHEL-like, usa dnf)
if ! command -v docker >/dev/null 2>&1; then
  step "Instalando docker"
  dnf install -y dnf-plugins-core
  dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  green "docker instalado."
else
  green "docker ya esta instalado."
fi

# 3. Abrir el puerto 80 en el firewall local de la VM (firewalld de Oracle Linux)
if command -v firewall-cmd >/dev/null 2>&1; then
  step "Abriendo puerto 80 en firewalld"
  firewall-cmd --permanent --add-port=80/tcp >/dev/null || true
  firewall-cmd --reload >/dev/null || true
  green "Puerto 80 abierto en firewalld."
fi
# iptables tambien (Oracle Linux lo usa por debajo en algunas configuraciones)
if command -v iptables >/dev/null 2>&1; then
  iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
fi

# 4. Preparar directorio y copiar artefactos
step "Preparando $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp /tmp/docker-compose.yml "$INSTALL_DIR/docker-compose.yml"
cp /tmp/.env "$INSTALL_DIR/.env"
chmod 600 "$INSTALL_DIR/.env"

# 5. Sustituir FRONTEND_BASE_URL con la IP publica real de la VM
PUBLIC_IP="$(curl -s --max-time 5 http://169.254.169.254/opc/v1/vnics/ | grep -oE '"publicIp"\s*:\s*"[^"]+"' | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
if [[ -z "$PUBLIC_IP" ]]; then
  PUBLIC_IP="$(curl -s --max-time 5 https://ifconfig.me || true)"
fi
if [[ -n "$PUBLIC_IP" ]]; then
  sed -i "s|FRONTEND_BASE_URL=http://CHANGE_ME|FRONTEND_BASE_URL=http://$PUBLIC_IP|" "$ENV_FILE"
  green "IP publica detectada: $PUBLIC_IP"
else
  yellow "No pude detectar la IP publica, edita $ENV_FILE manualmente."
fi

# 6. docker login a OCIR usando las credenciales del .env
step "docker login a OCIR"
# shellcheck disable=SC1090
source "$ENV_FILE"
echo "$OCIR_AUTH_TOKEN" | docker login "$OCIR_REGISTRY" --username "$OCIR_DOCKER_USER" --password-stdin

# 7. Pull y up
step "Pull de imagenes"
docker compose -f "$INSTALL_DIR/docker-compose.yml" --env-file "$ENV_FILE" pull

step "Arrancando docker-compose"
docker compose -f "$INSTALL_DIR/docker-compose.yml" --env-file "$ENV_FILE" up -d

# 8. Esperar a que los servicios respondan
step "Esperando a que el backend responda (puede tomar 1-2 min para arranque de Spring)"
for i in $(seq 1 60); do
  if curl -fsS --max-time 3 "http://127.0.0.1/api/proyectos" >/dev/null 2>&1; then
    green "Backend respondio."
    break
  fi
  sleep 5
  printf "."
done
echo

green "════════════════════════════════════════════"
green "  SprintOps desplegado"
green "  URL:  http://$PUBLIC_IP"
green "════════════════════════════════════════════"
yellow "Comandos utiles:"
echo "  docker compose -f $INSTALL_DIR/docker-compose.yml --env-file $ENV_FILE ps"
echo "  docker compose -f $INSTALL_DIR/docker-compose.yml --env-file $ENV_FILE logs -f backend"
echo "  docker compose -f $INSTALL_DIR/docker-compose.yml --env-file $ENV_FILE down       # apagar todo"
echo "  docker compose -f $INSTALL_DIR/docker-compose.yml --env-file $ENV_FILE up -d      # encender de nuevo"

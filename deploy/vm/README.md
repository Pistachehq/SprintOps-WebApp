# Desplegar SprintOps en una VM Always Free (sin Kubernetes)

Esta es la ruta alternativa cuando OKE Free Tier (ARM) está agotado. Usamos **una sola VM `VM.Standard.E2.1.Micro`** del Always Free corriendo `docker-compose` con MySQL + backend + frontend.

## Arquitectura

```
      Internet
         |
         v
   ┌──────────────────────────┐
   │  VM E2.1.Micro (1 GB)    │
   │                          │
   │  ┌────────────────────┐  │
   │  │ frontend (nginx)   │──┼── puerto 80 expuesto
   │  │  /api -> backend   │  │
   │  └─────────┬──────────┘  │
   │            │             │
   │  ┌─────────v──────────┐  │
   │  │ backend (Spring)   │  │
   │  └─────────┬──────────┘  │
   │            │             │
   │  ┌─────────v──────────┐  │
   │  │ mysql:8.0          │  │
   │  └────────────────────┘  │
   │                          │
   └──────────────────────────┘
```

## Pasos

Ya tienes hechas las partes de OCIR y auth token. Reutilizamos eso.

### 1. Generar / preparar SSH key en Cloud Shell

Cloud Shell ya tiene su propia llave SSH. Vamos a usar esa así no descargas nada. En Cloud Shell:

```bash
# Si no existe, generala (Enter en todas las preguntas)
[[ -f ~/.ssh/id_rsa ]] || ssh-keygen -t rsa -b 4096 -N "" -f ~/.ssh/id_rsa

# Imprime la PUBLIC key — esto es lo que vas a pegar en OCI Console
cat ~/.ssh/id_rsa.pub
```

Copia toda esa línea (empieza con `ssh-rsa ...`).

### 2. Crear la VM en OCI Console

1. Consola OCI → **Compute → Instances → Create instance**.
2. Configura:
   - **Name**: `sprintops-vm`
   - **Image**: **Oracle Linux 8** (el default, gratis y compatible con el bootstrap).
   - **Shape**: cambia a **`VM.Standard.E2.1.Micro`** (Always Free, sale como tag verde "Always Free-eligible").
   - **Networking**: deja el VCN/subnet que se generó cuando creaste el cluster (`oke-vcn-quick-sprintops`). Si tienes otro, sirve cualquiera con acceso público.
   - **Add SSH keys**: elige **"Paste public keys"** y pega la línea `ssh-rsa ...` que copiaste del paso 1.
   - **Boot volume**: deja 47 GB (default, gratis).
3. **Create**. En 1-2 min está en estado `Running`.
4. Anota la **Public IP** que te asigna.

### 3. Abrir el puerto 80 en la subnet (Security List)

Una sola vez:

1. En la página de la VM → click en la **subnet** (sale como link).
2. En la subnet → **Security Lists → Default Security List**.
3. **Add Ingress Rule**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `80`
4. **Add Ingress Rule**.

(El puerto 22 ya está abierto por default para SSH.)

### 4. Construir y subir las imágenes (en Cloud Shell)

```bash
cd ~/SprintOps-WebApp   # o donde tengas el clon
git pull
bash deploy/vm/build-and-push.sh
```

Esto:
- Construye `sprintops-backend` y `sprintops-frontend` para `linux/amd64` (nativo en Cloud Shell, sin emulación).
- Las sube a OCIR.
- Genera un `.env` con contraseñas aleatorias en `~/sprintops-vm.env`.

Tarda ~4-6 min.

### 5. Copiar los archivos a la VM (desde Cloud Shell)

Como Cloud Shell ya tiene tu llave en `~/.ssh/id_rsa` y la VM la conoce, SSH funciona directo:

```bash
VM_IP=X.X.X.X   # <-- pon la Public IP de la VM

scp -o StrictHostKeyChecking=no \
    ~/sprintops-vm.env \
    ~/SprintOps-WebApp/deploy/vm/docker-compose.yml \
    ~/SprintOps-WebApp/deploy/vm/bootstrap.sh \
    opc@$VM_IP:/tmp/

# Renombrar el .env al nombre que el bootstrap espera
ssh -o StrictHostKeyChecking=no opc@$VM_IP "mv /tmp/sprintops-vm.env /tmp/.env"
```

### 6. Correr el bootstrap dentro de la VM

```bash
ssh opc@$VM_IP "sudo bash /tmp/bootstrap.sh"
```

Esto, dentro de la VM:
- Crea un swap de 1 GB (porque arrancar Java con 1 GB de RAM física es complicado).
- Instala docker + docker-compose.
- Abre el puerto 80 en el firewall local.
- Hace `docker login` a OCIR con tu Auth Token (lo lee del `.env`).
- Hace `pull` de las imágenes.
- Levanta los 3 contenedores.
- Espera a que el backend responda.

Tarda ~3-5 min la primera vez (pull de MySQL + tu backend + frontend = ~600 MB de descarga).

### 7. Abrir en el navegador

```
http://<IP-publica-VM>
```

## Operación día a día

### Ver logs

```bash
ssh -i "$KEY" opc@$VM_IP
sudo docker compose -f /opt/sprintops/docker-compose.yml --env-file /opt/sprintops/.env logs -f backend
```

### Actualizar la app (nuevas imágenes)

Desde Cloud Shell:

```bash
bash deploy/vm/build-and-push.sh   # rebuild + push con un IMAGE_TAG nuevo
```

Toma el `BACKEND_IMAGE` y `FRONTEND_IMAGE` nuevos del output y dentro de la VM:

```bash
ssh -i "$KEY" opc@$VM_IP
sudo sed -i 's|BACKEND_IMAGE=.*|BACKEND_IMAGE=<imagen-nueva>|'  /opt/sprintops/.env
sudo sed -i 's|FRONTEND_IMAGE=.*|FRONTEND_IMAGE=<imagen-nueva>|' /opt/sprintops/.env
sudo docker compose -f /opt/sprintops/docker-compose.yml --env-file /opt/sprintops/.env pull
sudo docker compose -f /opt/sprintops/docker-compose.yml --env-file /opt/sprintops/.env up -d
```

### Apagar todo (sin perder datos)

```bash
ssh -i "$KEY" opc@$VM_IP "sudo docker compose -f /opt/sprintops/docker-compose.yml --env-file /opt/sprintops/.env down"
```

### Borrar todo incluyendo datos de MySQL

```bash
ssh -i "$KEY" opc@$VM_IP "sudo docker compose -f /opt/sprintops/docker-compose.yml --env-file /opt/sprintops/.env down -v"
```

## Tuning de memoria

Si ves que Java muere por OOM (`docker logs sprintops-backend` muestra "Killed" o el contenedor se reinicia), edita `/opt/sprintops/docker-compose.yml` y baja el heap. Busca `JAVA_OPTS` y cambia `-Xmx320m` a `-Xmx260m`. Luego `docker compose up -d`.

## Limitaciones honestas

- **1 GB de RAM es muy poco**. Va a funcionar para demo pero no esperes manejar cargas reales.
- **No hay alta disponibilidad**: si la VM se cae, se cae todo.
- **El backup es manual**: para conservar la base, usa `docker exec sprintops-mysql mysqldump ...`.
- **Solo HTTP**: si quieres HTTPS, lo más fácil es ponerle un dominio + Caddy delante (te lo armo cuando lo necesites).

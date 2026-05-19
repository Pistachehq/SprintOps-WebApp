# Desplegar SprintOps en Oracle Cloud (OKE)

Guía corta para dejar la app corriendo en Kubernetes sobre Oracle Cloud Infrastructure, gratis (Always Free) y accesible por una IP pública.

## Una sola cosa manual: crear el cluster

Esto se hace una vez en la consola y toma 5 minutos.

1. Entra a la [consola de OCI](https://cloud.oracle.com/).
2. Menú → **Developer Services** → **Kubernetes Clusters (OKE)**.
3. **Create cluster** → **Quick create**.
4. Configura:
   - Name: `sprintops`
   - Kubernetes version: la última estable.
   - Node shape: `VM.Standard.A1.Flex` (ARM, Always Free).
   - Nodes: `2`. Cada uno con 2 OCPU / 12 GB RAM (total 4 OCPU / 24 GB, cabe en el free tier).
   - Visibility: **Public**.
5. **Submit** y espera a que pase a *Active* (10–15 min).

Listo. El resto lo hace el script desde Cloud Shell.

## Desplegar

1. Abre **Cloud Shell** desde la consola de OCI (icono `>_` arriba a la derecha).
2. Clona o sube el repo a Cloud Shell:

   ```bash
   git clone https://github.com/<tu-usuario>/SprintOps-WebApp.git
   cd SprintOps-WebApp
   ```

3. Corre:

   ```bash
   bash deploy/deploy.sh
   ```

   La primera vez te va a pedir (o detectar):

   - El compartimento donde está tu cluster (te muestra la tabla y solo pegas el OCID).
   - Un **Auth Token** para hacer login a OCIR. El script intenta crearlo solo; si tu usuario no tiene permiso, lo generas en *My profile → Auth Tokens* y lo pegas. Queda guardado en `~/.ocir-token` para próximas corridas.

4. Espera a que termine. Al final imprime:

   ```
   ════════════════════════════════════════════
     SprintOps desplegado
     URL: http://<IP-PUBLICA>
   ════════════════════════════════════════════
   ```

   Abre esa URL en el navegador.

## Qué hace el script

1. Detecta tu tenancy, usuario, región y compartimento con la OCI CLI.
2. Configura `kubectl` para apuntar al cluster.
3. Crea repos en **OCIR** (registro de imágenes de Oracle) si no existen.
4. Hace `docker login` con el Auth Token.
5. **Compila las dos imágenes** (`sprintops-backend` y `sprintops-frontend`) eligiendo automáticamente la estrategia:
   - **Kaniko en el cluster** (cuando estás en Cloud Shell x86 y los nodos son ARM): lanza un Job de Kaniko por imagen, que clona tu repo público desde GitHub y compila nativamente en los nodos. Es lo que pasa por default en Cloud Shell con A1.Flex.
   - **Docker local** (cuando tu máquina ya puede emular o tiene la misma arquitectura que los nodos): usa `docker buildx` con `--platform linux/arm64`.
6. Las sube a OCIR (Kaniko empuja desde dentro del cluster; docker desde tu máquina).
7. Aplica los manifests de `deploy/k8s/`:
   - `Namespace` `sprintops`.
   - `Secret mysql-credentials` con contraseña aleatoria de 24 caracteres (no se imprime).
   - `Secret backend-secrets` con los placeholders de Groq / Google / GitHub / Telegram (vacíos por defecto, se rellenan después).
   - `Secret ocir-pull` para que el cluster pueda jalar las imágenes.
   - `StatefulSet` de MySQL con `PersistentVolumeClaim` (50 GB de OCI Block Volume).
   - `Deployment` + `Service` del backend (`ClusterIP` interno).
   - `Deployment` + `Service` del frontend (`LoadBalancer` con shape *flexible* 10/10 Mbps, dentro del Always Free).
8. Espera la IP pública del Load Balancer y la inyecta como `FRONTEND_BASE_URL` para que el backend la conozca.

## Volver a desplegar (cambios en el código)

```bash
git push          # importante si usas Kaniko: compila desde GitHub, no desde el clon local
cd ~/SprintOps-WebApp
git pull
bash deploy/deploy.sh
```

Cada corrida construye una imagen con tag nuevo (`YYYYMMDD-HHMMSS`) y hace `rollout` sin downtime para el frontend, y `Recreate` para el backend.

### Forzar una estrategia de build

```bash
bash deploy/deploy.sh --kaniko         # compila en el cluster (default en Cloud Shell)
bash deploy/deploy.sh --local-build    # compila con docker en tu máquina
bash deploy/deploy.sh --skip-build     # no recompila; reaplica manifests con el tag IMAGE_TAG
```

## Llenar credenciales opcionales (Google OAuth, Groq, Telegram, etc.)

Setea las env vars **antes** de correr el script:

```bash
export GROQ_API_KEY="..."
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export TELEGRAM_BOT_TOKEN="..."
bash deploy/deploy.sh
```

O actualízalas después:

```bash
kubectl -n sprintops edit secret backend-secrets
kubectl -n sprintops rollout restart deploy/backend
```

## Verificar todo

```bash
kubectl -n sprintops get pods,svc
kubectl -n sprintops logs deploy/backend -f
```

## Tirar todo (pero conservando el cluster)

```bash
bash deploy/deploy.sh --destroy
```

Borra el namespace `sprintops`. El cluster, el LB y el volumen quedan; la próxima corrida los recrea.

## Notas

- **Persistencia de datos:** MySQL guarda en un Block Volume; sobrevive a reinicios de pods.
- **TLS / dominio:** este flujo es solo HTTP por IP. Cuando tengas dominio, lo más limpio es agregar `cert-manager` + `ingress-nginx`; avísanos para extender el script.
- **Imágenes ARM:** si por alguna razón usas nodos AMD, corre con `PLATFORMS=linux/amd64 bash deploy/deploy.sh`.
- **OAuth Google/GitHub:** los callbacks tienen que apuntar al origen del Load Balancer. Si lo cambias, actualiza el secret y reinicia el backend.
- **Repo privado en GitHub:** Kaniko espera un repo público. Si el tuyo es privado, hay dos opciones: (1) hacerlo público temporalmente, (2) usar `--local-build` desde una máquina con docker.

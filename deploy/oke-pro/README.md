# Deploy "estilo lab" de SprintOps en OCI (OKE + Autonomous DB)

Esta carpeta es la adaptación del patrón del lab `MtdrSpring` (Oracle DevOps workshop)
a SprintOps. Provee un deploy **completamente automatizado** que:

1. Aprovisiona toda la infra con **Terraform**: VCN, subnets, security lists, cluster OKE,
   node pool, repos en OCIR y una **Autonomous Database** (Oracle ADB).
2. Configura `kubectl` contra el cluster.
3. Hace **build + push** de las imágenes de backend y frontend a OCIR.
4. Crea los **Secrets** de Kubernetes con el wallet de la DB y las credenciales.
5. Aplica los **manifests** y espera a que el frontend tenga IP pública.

Todo arranca con un solo comando:

```bash
source deploy/oke-pro/setup.sh
```

---

## Pre-requisitos

| Herramienta | Cómo conseguirla |
|---|---|
| Oracle Cloud Shell | Lo abres desde la consola de OCI. Ya trae `oci`, `terraform`, `kubectl`, `docker` (vía podman) y `git`. |
| Cuenta OCI con permisos de creación | Pay-As-You-Go o Trial (te dan **$300 USD de crédito gratis por 30 días** ideal para esta demo). |
| Auth Token | OCI Console > Profile > User Settings > Auth Tokens > Generate Token. **Cópialo**, no se vuelve a mostrar. |

> **Importante sobre el costo:** el `nodeShape` por defecto es `VM.Standard.E3.Flex` con 2 OCPUs / 12 GB (igual que el lab). No es Always Free: ronda los **$0.04–0.08 USD/hora** por nodo. Con 3 nodos por una semana son ~$20 USD. Si vas a hacer la demo en una hora y luego correr `destroy.sh`, son centavos. La ADB sí queda gratis (Always Free).

Si quieres intentar todo gratis (con la lotería de capacidad ARM), exporta antes de correr setup:

```bash
export SPRINTOPS_NODE_SHAPE="VM.Standard.A1.Flex"
export SPRINTOPS_NODE_OCPUS=2
export SPRINTOPS_NODE_MEMORY_GBS=12
```

---

## Pasos

### 1. Abre Cloud Shell y clona el repo

```bash
git clone https://github.com/alexisaguirrealanis/SprintOps-WebApp.git
cd SprintOps-WebApp
```

### 2. (Opcional) Pasa secretos por entorno

Si quieres que el chatbot, OAuth y Telegram queden configurados:

```bash
export GROQ_API_KEY="gsk_..."
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GITHUB_CLIENT_ID="..."
export GITHUB_CLIENT_SECRET="..."
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_BOT_USERNAME="..."
```

Si no los pasas, el deploy igual funciona y simplemente esas features quedan apagadas.

### 3. Lanza el setup

```bash
source deploy/oke-pro/setup.sh
```

El script te va a pedir:

- **OCID de tenancy** (lo agarra solo si Cloud Shell lo expuso; si no, pégalo desde Profile > Tenancy).
- **OCID del compartimento** donde quieres crear todo. `Enter` para la tenancy raíz.
- **Password de ADMIN** para la Autonomous DB (12–30 chars, mayúscula + minúscula + número, sin la palabra `admin`).
- **Auth Token** dos veces: una para hacer `docker push` a OCIR, otra para crear el `imagePullSecret` que K8s usa para tirar las imágenes.

Después de eso es manos libres ~15–25 minutos: Terraform crea el cluster, espera nodos, construye las imágenes, configura los Secrets y aplica los manifests.

Al final imprime algo como:

```
=============================================
  SprintOps desplegado
  URL: http://150.136.X.Y
=============================================
```

Abre esa URL en el navegador y ya estás dentro.

### 4. Si algo se cae a la mitad

El script es **idempotente**: vuelve a correr `source deploy/oke-pro/setup.sh` y continúa donde quedó (gracias a `~/.sprintops-oke-pro/state/`). Si quieres reiniciar todo desde cero borra ese directorio.

### 5. CI/CD (Reto D3 — OCI DevOps)

Con la infra ya desplegada (`setup.sh`), automatiza build + deploy:

→ **[devops/README-CICD.md](devops/README-CICD.md)** (pipelines, triggers, capturas del reto).

### 6. Tirar el deploy (importante para no gastar)

```bash
source deploy/oke-pro/destroy.sh
```

Te pide que escribas `DESTROY` en mayúsculas para confirmar. Tira el cluster, la ADB y todo lo que Terraform creó.

---

## Qué hace cada archivo

```
deploy/oke-pro/
├── setup.sh              # entrypoint: source para arrancar
├── env.sh                # vars de entorno + state machine
├── destroy.sh            # entrypoint de teardown
├── terraform/            # infra como código
│   ├── provider.tf
│   ├── main-var.tf       # variables de entrada (shape, ADB, etc.)
│   ├── availability_domain.tf
│   ├── core.tf           # VCN + 3 subnets + gateways + security lists
│   ├── containerengine.tf  # cluster OKE + node pool
│   ├── repositories.tf   # repos OCIR para backend y frontend
│   ├── database.tf       # Autonomous DB + wallet
│   └── outputs.tf
├── utils/                # scripts orquestadores
│   ├── state-functions.sh    # state_set / state_get / state_done
│   ├── main-setup.sh         # orquesta las 7 fases
│   ├── terraform.sh          # init + apply
│   ├── oke-setup.sh          # kubeconfig + espera nodos
│   ├── java-builds.sh        # docker build + push a OCIR
│   ├── db-setup.sh           # Secrets: wallet, credenciales, ocir-pull
│   ├── k8s-deploy.sh         # apply manifests + espera IP del LB
│   └── main-destroy.sh
└── k8s/                  # manifests con placeholders
    ├── 00-namespace.yaml
    ├── 20-backend.yaml       # Deployment + ConfigMap + PVC + Service
    └── 30-frontend.yaml      # Deployment + LoadBalancer Service
```

---

## Cómo cambia el backend para hablarle a Oracle

Solo cambian tres cosas y todas son aditivas (la app sigue corriendo en MySQL en local):

1. `backend/pom.xml`: se agregaron las dependencias `ojdbc11` + `oraclepki` + `osdt_*`.
2. `backend/src/main/resources/application-oracle.properties`: nuevo profile que sobre-escribe
   la URL, el driver y el dialecto. Se activa cuando el pod arranca con
   `SPRING_PROFILES_ACTIVE=prod,oracle` (lo hace el ConfigMap `backend-config`).
3. `backend/src/main/resources/data-oracle.sql`: la misma data semilla del `data.sql`, pero
   con `MERGE INTO ... USING DUAL` porque Oracle no tiene `INSERT IGNORE`.

En local sigues corriendo con MySQL exactamente igual que antes. El profile `oracle` solo se
activa en el cluster.

---

## Costos esperados

| Recurso | Pricing | Notas |
|---|---|---|
| OKE control plane | **Gratis** | OCI lo cubre. |
| 3 worker nodes E3.Flex (2 OCPU / 12 GB c/u) | ~$0.16 USD/hora total | Si haces la demo en 2 h y luego destroy: <$1 USD. |
| Autonomous DB (Always Free) | **Gratis** | 1 OCPU + 20 GB. Si la dejas 7 días inactiva, OCI la pausa. |
| Load Balancer flexible 10 Mbps | ~$0.025 USD/hora | Mismo deal: corto, barato. |
| OCIR | Casi gratis | Cobra solo por GB almacenado, ~$0.005/GB-mes. |

**Recomendación honesta:** activa la cuenta como Pay-As-You-Go, usa los $300 USD del trial y al
terminar la presentación corre `destroy.sh`. Total real: prácticamente $0.

---

## Troubleshooting rápido

- **`terraform apply` falla con "ServiceLimitExceeded"** → Tu cuenta no tiene quota para esa shape en esa AD. Cambia `SPRINTOPS_NODE_SHAPE` antes de correr, o sube el límite desde Limits & Quotas.
- **El backend queda en CrashLoopBackOff** → `kubectl -n sprintops logs deploy/backend`. Normalmente es algo del wallet (path TNS_ADMIN) o el password de la ADB.
- **El LoadBalancer no obtiene IP** → revisa la subnet `svclb-subnet` y que el cluster esté en estado ACTIVE.
- **`docker login` falla** → verifica el formato del usuario. Si tu cuenta está en un Identity Domain, suele ser `<tenancy_namespace>/oracleidentitycloudservice/<email>`.
- **`docker push` 403 tras Login Succeeded** → credenciales viejas en Cloud Shell (podman). Prueba:
  ```bash
  docker logout mx-queretaro-1.ocir.io
  echo "<AUTH_TOKEN>" | docker login mx-queretaro-1.ocir.io -u "axf5izecp5nx/a00838462@tec.mx" --password-stdin
  docker push mx-queretaro-1.ocir.io/axf5izecp5nx/sprintops-kq8o-backend:latest
  ```
  O reintenta con `OCIR_FORCE_LOGIN=1 FORCE_REBUILD=1 bash deploy/oke-pro/utils/java-builds.sh`.
- **`no space left on device` al build del frontend** → Cloud Shell tiene poco disco. El script `java-builds.sh` intenta `npm run build` en el host y solo empaqueta `dist/` en nginx. Antes de reintentar:
  ```bash
  bash deploy/oke-pro/utils/disk-free.sh
  rm -f ~/.sprintops-oke-pro/state/FRONTEND_BUILT
  bash deploy/oke-pro/utils/java-builds.sh
  ```
  Si aún falla, borra también `rm -rf ~/SprintOps-WebApp/frontend/node_modules` y vuelve a correr.

# Seguir RetoOrcl_D3.pdf con SprintOps (no es “como si nada”, pero sí el mismo flujo)

El PDF del reto está armado para el lab **MtdrSpring** (`state/`, `todolistapp-springboot*.yaml`, bucket `RUN_NAME-MTDR_KEY`).  
**Tú ya desplegaste SprintOps** con `deploy/oke-pro/setup.sh` — eso **cuenta** como el Terraform del PDF.

Para el entregable de Canvas solo necesitas demostrar el **mismo flujo CI/CD en consola** + capturas. Abajo: qué copiar igual del PDF y qué cambiar.

---

## Lo que SÍ haces igual que el PDF (consola OCI)

| Paso PDF | SprintOps |
|----------|-----------|
| 1. Dynamic Group + regla con compartment id | Igual. `compartment id` → `cat ~/.sprintops-oke-pro/state/COMPARTMENT_OCID` |
| 2. Policies (Allow dynamic-group dg to manage devops-family…) | Igual (mismo texto del PDF) |
| 3. GitHub Classic Token → Vault secret `github_secret_token` | Igual |
| 4.1–4.2 Auth Token en `at.cfg` | Igual idea (ver comandos abajo) |
| 5. DevOps Project + GitHub External connection + **Mirror** | Repo: `Pistachehq/SprintOps-WebApp`, rama `Features-extra` |
| 6. Build Pipeline | Misma UI; **build spec distinto** (ver abajo) |
| 7. Artifact Manifest | Misma UI; **contenido distinto** (manifests K8s de SprintOps) |
| 8. OKE Environment | Cluster: `sprintops-kq8o-cluster` |
| 9. Deploy Pipeline | Misma UI; spec/deploy del lab → el nuestro |
| 10. Trigger (push) | Igual |
| **Entregable** | Screenshots build + deploy + work requests + PDF `equipo_CICD.pdf` |

---

## Lo que NO copies literal del PDF

| PDF (lab) | SprintOps |
|-----------|-----------|
| `cat state/COMPARTMENT_OCID` | `cat ~/.sprintops-oke-pro/state/COMPARTMENT_OCID` |
| `tar … state wallet at.cfg` desde carpeta MtdrSpring | Comandos de la sección **Metadata** abajo |
| Bucket `$(cat state/RUN_NAME)-$(cat state/MTDR_KEY)` | Bucket que crees tú, ej. `sprintops-kq8o-devops` |
| Modificar `build_spec.yaml` del lab | `deploy/oke-pro/devops/build_spec_backend.yaml` (+ frontend si el profe pide 2 builds) |
| Artifact = `todolistapp-springboot*.yaml` | YAML de `deploy/oke-pro/k8s/` (ver **Artifact Manifest**) |
| `cd MtdrSpring; source env.sh` | `source deploy/oke-pro/env.sh` |
| Undeploy del lab (`undeploy.sh`) | Opcional: `kubectl delete` namespace o `destroy.sh` |

---

## Prerrequisitos PDF — comandos SprintOps

### Compartment (paso PDF f)

```bash
cat ~/.sprintops-oke-pro/state/COMPARTMENT_OCID
```

Pégalo en la regla del Dynamic Group (sustituye `<compartment id>`).

### Metadata + bucket (pasos 4.1–4.3)

```bash
source ~/SprintOps-WebApp/deploy/oke-pro/env.sh
cd ~/SprintOps-WebApp

# 4.1 Auth Token OCIR (el de User Settings → Auth Tokens, NO el de GitHub)
read -s -p "OCIR Auth Token: " AT
echo "$AT" > at.cfg

# 4.3 Empaquetar state + wallet + at.cfg
tar -czvf deployment_config.tgz \
  -C "$SPRINTOPS_STATE_HOME" state \
  -C "$SPRINTOPS_HOME/terraform" wallet.zip \
  -C "$PWD" at.cfg

# Crear bucket una vez (nombre libre; usa este para el PDF)
BUCKET="sprintops-kq8o-devops"
COMP="$(cat ~/.sprintops-oke-pro/state/COMPARTMENT_OCID)"
oci os bucket create --compartment-id "$COMP" --name "$BUCKET" 2>/dev/null || true

oci os object put --bucket-name "$BUCKET" --file deployment_config.tgz --name deployment_config.tgz
```

En el **Build pipeline** del PDF, donde el lab descarga metadata del bucket, usa el mismo bucket/objeto si la UI lo pide.

---

## DevOps Setup (pasos 1–6 del PDF)

### 2. Build Pipeline

En **Managed build**, en lugar del `build_spec.yaml` del lab:

| Pipeline | Build spec path |
|----------|-----------------|
| Backend | `deploy/oke-pro/devops/build_spec_backend.yaml` |
| Frontend (opcional 2º pipeline) | `deploy/oke-pro/devops/build_spec_frontend.yaml` |

Variables del pipeline (como en el PDF pero con tus valores):

- Secreto `OCI_AUTH_TOKEN` = Auth Token OCIR (Vault o pipeline secret)
- `OCIR_NAMESPACE` = `axf5izecp5nx`
- `OCIR_BACKEND_REPO` = `sprintops-kq8o-backend`
- `OCIR_USERNAME` = `oracleidentitycloudservice/a00838462@tec.mx` (ajusta si es otro)

### 3. Artifact Manifest (paso PDF con `todolistapp-springboot*.yaml`)

El lab pega un YAML generado por Maven. En SprintOps usa el **Deployment + Service** que ya aplicas con Terraform/setup.

**Opción simple para el campo Value del manifest:**

1. En Cloud Shell:
   ```bash
   cat ~/SprintOps-WebApp/deploy/oke-pro/k8s/20-backend.yaml
   cat ~/SprintOps-WebApp/deploy/oke-pro/k8s/30-frontend.yaml
   ```
2. En la consola DevOps → Artifact → pega el contenido de **ambos** (o solo `20-backend.yaml` si el deploy del curso es un solo servicio; pregunta al profe si exigen uno o dos manifests).

Las imágenes en el YAML tienen placeholders `__BACKEND_IMAGE__`; el **Deploy pipeline** del lab suele sustituirlos por la imagen del build. Si tu deploy usa `deploy_spec_oke.yaml` con `kubectl set image`, el manifest puede ser solo referencia documental — lo importante para el PDF es **que exista el Artifact** y el **Deploy pipeline enlazado**.

### 4. OKE Environment

- Cluster: **`sprintops-kq8o-cluster`**
- Namespace: `sprintops` (o el que use tu deploy spec)

### 5. Deploy Pipeline

**Deploy spec path:** `deploy/oke-pro/devops/deploy_spec_oke.yaml`

(Equivalente al deploy stage del lab, pero con `kubectl set image` para backend + frontend.)

### 6. Trigger

- Event: **Push** a rama `Features-extra`
- Acción: Start build (y encadenar deploy si la UI lo permite, como en la diapositiva “BIND BUILD - DEPLOY”)

---

## Demostrar “flujo CI/CD con cambio” (entregable)

1. Haz un cambio visible (ej. texto en login o comentario en `README`).
2. `git push` a `Features-extra`.
3. Captura: Build pipeline **Succeeded** + Deploy **Succeeded**.
4. Abre `http://163.192.154.208` y muestra el cambio (o logs con nuevo tag de imagen).

---

## Undeploy (final del PDF, opcional)

El PDF agrega pasos `kubectl` + `undeploy.sh` del lab. En SprintOps:

```bash
source deploy/oke-pro/env.sh
kubectl -n sprintops delete deploy backend frontend --ignore-not-found
# o teardown completo:
# source deploy/oke-pro/destroy.sh
```

No pegues el bloque del PDF que hace `cd MtdrSpring` — no existe en tu repo.

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Sigo el PDF? | **Sí** en consola: DG, policies, vault, DevOps project, mirror, build, artifact, environment, deploy, trigger, screenshots. |
| ¿Mismos archivos/comandos? | **No** — usa este mapeo y `README-CICD.md`. |
| ¿Ya hice Terraform? | **Sí** — `setup.sh` sustituye esa parte del lab. |
| ¿Qué subo a Canvas? | PDF con nombres, capturas build/deploy/work requests, flujo con un push que dispara pipeline. |

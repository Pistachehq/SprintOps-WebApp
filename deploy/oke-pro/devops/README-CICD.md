# CI/CD con OCI DevOps (Reto D3)

Automatiza lo que hoy haces con `java-builds.sh` + `k8s-deploy.sh`: **build → push OCIR → deploy OKE** al hacer push a GitHub.

**Prerrequisito:** ya corriste `source deploy/oke-pro/setup.sh` una vez (cluster, OCIR repos, secrets, manifests).

> **¿Sigues la presentación `RetoOrcl_D3.pdf`?** Sí, misma consola y mismas capturas; solo cambian rutas del lab MtdrSpring.  
> → **[PDF-D3-MAPEO.md](PDF-D3-MAPEO.md)** (tabla PDF ↔ SprintOps, metadata, artifact manifest).

---

## Arquitectura

```text
GitHub (push) → Trigger DevOps → Build backend / Build frontend → OCIR
                              → Deploy pipeline → kubectl rollout (OKE sprintops)
```

Archivos en este directorio:

| Archivo | Uso |
|---------|-----|
| `build_spec_backend.yaml` | Pipeline de build del JAR + imagen Docker backend |
| `build_spec_frontend.yaml` | `npm run build` + `Dockerfile.prebuilt` |
| `deploy_spec_oke.yaml` | `kubectl set image` + rollout status |

Ajusta en cada YAML (o en variables del pipeline) si tu suffix no es `kq8o`:

- `OCIR_NAMESPACE` → `axf5izecp5nx` (tenancy namespace)
- `OCIR_*_REPO` → `sprintops-kq8o-backend` / `sprintops-kq8o-frontend`
- `OCIR_USERNAME` → suele ser `oracleidentitycloudservice/<tu-email>`

---

## Paso 1 — Proyecto y conexión a GitHub

1. OCI Console → **Developer Services** → **Projects** → **Create project** (ej. `sprintops-devops`).
2. En el proyecto → **Project settings** → **Repositories** → **Create repository**.
3. Tipo **External** → conecta **GitHub** → repo `Pistachehq/SprintOps-WebApp`, rama `Features-extra` (o `main`).

---

## Paso 2 — Secreto del Auth Token (OCIR)

1. En el proyecto → **Project settings** → **Secrets**.
2. **Create secret**:
   - Name: `OCIR_AUTH_TOKEN`
   - Value: tu Auth Token (Profile → User Settings → Auth Tokens).
3. En cada **Build pipeline**, en **Manage parameters** → variable secreta:
   - Name: `OCI_AUTH_TOKEN`
   - Type: Secret → selecciona `OCIR_AUTH_TOKEN`.

---

## Paso 3 — Build pipeline: Backend

1. **Build pipelines** → **Create pipeline** → nombre `sprintops-backend-build`.
2. **Add stage** → **Managed build**:
   - **Build spec file path:** `deploy/oke-pro/devops/build_spec_backend.yaml`
   - Primary source: tu mirror de GitHub, rama `Features-extra`.
3. Variables (si no usas los defaults del YAML):
   - `OCIR_REGION`, `OCIR_NAMESPACE`, `OCIR_BACKEND_REPO`, `OCIR_USERNAME`
   - Secreto: `OCI_AUTH_TOKEN`
4. **Save** → **Manual run** para probar.

---

## Paso 4 — Build pipeline: Frontend

Igual que el backend, pipeline `sprintops-frontend-build` con:

- **Build spec:** `deploy/oke-pro/devops/build_spec_frontend.yaml`

---

## Paso 5 — Environment (cluster OKE)

1. **Environments** → **Create environment**.
2. Tipo **Cluster**.
3. Compartment + cluster **`sprintops-kq8o-cluster`**.
4. Namespace por defecto puede quedar vacío; el deploy usa `sprintops` en el spec.

Esto inyecta `kubectl` y kubeconfig en el deploy pipeline.

---

## Paso 6 — Deploy pipeline

1. **Deploy pipelines** → **Create pipeline** → `sprintops-deploy-oke`.
2. **Add stage** → **Run a command on a Kubernetes cluster** (o **Generic deployment** con shell):
   - Environment: el del paso 5.
   - **Deploy spec path:** `deploy/oke-pro/devops/deploy_spec_oke.yaml`
3. Encadena con los builds (opcional pero ideal para D3):
   - **Add stage** → trigger / artifact from `sprintops-backend-build` y pasa `BACKEND_IMAGE_URI`.
   - Igual para frontend.

Si el deploy no recibe artefactos del build, el spec usa `:latest` (válido si el build acaba de pushear `latest`).

4. **Manual run** → verifica:

```bash
kubectl -n sprintops get pods
```

---

## Paso 7 — Trigger automático (CI)

En cada **Build pipeline** → **Triggers** → **Create trigger**:

- Source: GitHub mirror, rama `Features-extra`.
- Event: **Push** (o Pull request merge).
- Action: Start pipeline.

Repite para backend, frontend y (opcional) encadena deploy al terminar ambos builds.

---

## Flujo manual rápido (sin trigger)

```text
Push a GitHub → Run backend build → Run frontend build → Run deploy pipeline
```

---

## Qué NO hace el pipeline (sigue siendo manual una vez)

- **Terraform** (VCN, OKE, ADB) → `setup.sh` / `terraform.sh`.
- **Secrets** (wallet, DB password, Groq, Telegram) → `db-setup.sh`.
- **Primera aplicación de manifests** → `k8s-deploy.sh`.

El CI/CD asume que el namespace `sprintops` y los Secrets ya existen.

---

## Capturas típicas del reto D3

1. Proyecto DevOps + repo GitHub conectado.
2. Build pipeline **Succeeded** + imagen en OCIR (Artifacts).
3. Deploy pipeline **Succeeded** + pods `Running`.
4. Trigger en push + segundo run automático.
5. App en `http://<IP LoadBalancer>`.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `docker login` falla | Revisa `OCIR_USERNAME` = `<namespace>/oracleidentitycloudservice/<user>` |
| Build frontend sin espacio | El spec usa `npm` en runner + `Dockerfile.prebuilt` (igual que Cloud Shell) |
| Deploy no cambia pods | `kubectl describe deploy backend -n sprintops` — ¿`imagePullSecrets`? |
| `ImagePullBackOff` | Secret `ocir-pull` en namespace; `db-setup.sh` |
| Rollout timeout | `kubectl logs deploy/backend -n sprintops` |
| Chatbot: “GROQ_API_KEY no configurada” | `export GROQ_API_KEY='gsk_...'` y vuelve a correr `db-setup.sh`, o parchea el secret y reinicia backend (ver abajo) |
| Fotos del proyecto / daily rechazadas | Formatos admitidos: JPEG, PNG, WebP, GIF, HEIC. Tras cambios de backend, rebuild + rollout |

### Chatbot (Groq) en cluster ya desplegado

```bash
export GROQ_API_KEY='gsk_...'   # tu API key de console.groq.com
kubectl -n sprintops patch secret backend-secrets --type merge \
  -p "$(printf '{"stringData":{"groqApiKey":"%s"}}' "$GROQ_API_KEY")"
kubectl -n sprintops rollout restart deploy/backend
kubectl -n sprintops rollout status deploy/backend --timeout=180s
```

---

## Prueba de carga (JMeter)

Pipeline aparte (no sustituye build/deploy):

1. **Build pipelines** → **Create** → `sprintops-load-test`.
2. **Managed build** → spec: `deploy/oke-pro/devops/build_spec_load_test.yaml`.
3. Variables obligatorias: `TARGET_HOST`, `LOAD_PROJECT_ID`, `LOAD_SPRINT_ID` (generados con `load-test/scripts/seed-load-test-data.sh`).
4. Recomendado: `THREADS=15`, `RAMP_UP=30`, `DURATION=180`.
5. **Manual run** → revisar log `LOAD TEST OK` y reporte HTML en artefactos.

Documentación completa: [load-test/README.md](../../../load-test/README.md).

---

## Alternativa: GitHub Actions

Si el reto permite GitHub Actions en lugar de OCI DevOps, se puede añadir `.github/workflows/oke-deploy.yml` más adelante; para el PDF de Oracle prioriza **OCI DevOps** como arriba.

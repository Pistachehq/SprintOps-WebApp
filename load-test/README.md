# Prueba de carga SprintOps (JMeter + OCI DevOps)

Plan de carga sobre el **flujo real del reto** (login → proyectos → sprints → issues), sin chatbot ni OAuth (evita límites externos y ruido en métricas).

## 1. Cantidad de usuarios y datos recomendada

Valores pensados para el despliegue **OKE Always Free** (2 réplicas frontend, backend + ADB compartido, LB 10 Mbps):

| Concepto | Valor recomendado | Motivo |
|--------|-------------------|--------|
| **Usuarios virtuales (threads)** | **15** | Simula un equipo pequeño usando la app a la vez sin saturar CPU del nodo ni conexiones ADB. |
| **Rampa (RAMP_UP)** | **30 s** | Subida gradual; evita picos falsos de error al arrancar todos a la vez. |
| **Duración (DURATION)** | **180 s** (3 min) | Suficiente para informe del reto; ampliable a 300 s si la app aguanta estable. |
| **Usuarios reales en CSV** | **3** (`sm`, `po`, `axel` @example.com) rotando | Coinciden con seed Oracle; contraseña `123`. |
| **Proyectos de prueba** | **1** | Un solo proyecto “SprintOps Load Test” simplifica IDs y resultados. |
| **Sprints** | **1** activo | Flujo planning/sprint board. |
| **Issues en BD** | **40** | Lista issues ~50–200 ms; suficiente volumen sin inflar ADB. |
| **Pausa entre requests** | **500 ms** (`THINK_TIME_MS`) | Simula lectura humana. |

### Perfiles opcionales

- **Smoke (validar pipeline):** `THREADS=3`, `DURATION=60`, `RAMP_UP=10`
- **Carga objetivo (entrega):** `THREADS=15`, `DURATION=180`, `RAMP_UP=30`
- **Estrés (solo laboratorio):** `THREADS=40`, `DURATION=120` — esperar más errores 5xx/timeouts; no usar para capturas “buen uso”

### Criterios de “buen uso” (aceptable para el reto)

- Tasa de error **&lt; 5%** (excluyendo login si falta seed)
- p95 latencia **&lt; 3 s** en GET issues/proyectos
- Sin reinicios de pods (`kubectl get pods -n sprintops`) durante la prueba

## 2. Preparar datos (una vez por entorno)

Desde **Cloud Shell** o tu PC (con la app accesible):

```bash
export BASE_URL="http://TU_IP_LOAD_BALANCER"
chmod +x load-test/scripts/seed-load-test-data.sh
./load-test/scripts/seed-load-test-data.sh
```

Anota `LOAD_PROJECT_ID` y `LOAD_SPRINT_ID` (también en `load-test/jmeter/load-target.env`).

## 3. Ejecutar JMeter en local (opcional)

```bash
# Instalar JMeter 5.6+ y plugins JSON (incluido en JMeter 5+)
cd load-test/jmeter
jmeter -n -t sprintops-reto-load.jmx -l results/local.jtl -e -o results/html \
  -JTARGET_HOST=163.192.154.208 \
  -JLOAD_PROJECT_ID=1 \
  -JLOAD_SPRINT_ID=1 \
  -JTHREADS=15 -JRAMP_UP=30 -JDURATION=180
```

Abre `results/html/index.html` para el informe.

## 4. Ejecutar desde OCI DevOps

1. **DevOps** → tu proyecto → **Build pipelines** → **Create pipeline** → `sprintops-load-test`.
2. Stage **Managed build** → spec: `deploy/oke-pro/devops/build_spec_load_test.yaml`.
3. **Parameters** (variables):

   | Nombre | Ejemplo |
   |--------|---------|
   | `TARGET_HOST` | `163.192.154.208` |
   | `LOAD_PROJECT_ID` | `2` (del seed) |
   | `LOAD_SPRINT_ID` | `1` |
   | `THREADS` | `15` |
   | `RAMP_UP` | `30` |
   | `DURATION` | `180` |

4. **Manual run** → estado **Succeeded** → revisa logs; opcionalmente añade **output artifacts** con ruta `load-test/jmeter/results/**`.

Detalle en [deploy/oke-pro/devops/README-CICD.md](../deploy/oke-pro/devops/README-CICD.md#prueba-de-carga-jmeter).

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `jmeter/sprintops-reto-load.jmx` | Plan JMeter |
| `jmeter/users.csv` | Credenciales rotativas |
| `scripts/seed-load-test-data.sh` | Crea proyecto/sprint/issues |
| `deploy/oke-pro/devops/build_spec_load_test.yaml` | Pipeline DevOps |

## Qué no medimos

- `POST /api/chatbot/message` (Groq, cuotas TPM)
- OAuth / subida de archivos multipart
- Registro de usuarios masivo (usa seed + CSV)

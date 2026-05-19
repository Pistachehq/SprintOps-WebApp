package com.pistache.sprintops_backend;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.pistache.sprintops_backend.model.Permiso;
import com.pistache.sprintops_backend.model.Rol;
import com.pistache.sprintops_backend.model.TablaPermisos;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.PermisoRepository;
import com.pistache.sprintops_backend.repository.RolRepository;
import com.pistache.sprintops_backend.repository.TablaPermisosRepository;
import com.pistache.sprintops_backend.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas de integración del release RETO: llamadas HTTP reales al API levantado en contexto Spring + H2.
 * Al finalizar, escribe {@code target/reto-release-api-io.txt} con Input/Output capturados.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RetoReleaseApiIT {

    private static final List<String> IO_LOG = new ArrayList<>();

    private final JsonMapper objectMapper = JsonMapper.builder().build();
    private final RestTemplate http = buildLenientRestTemplate();

    private static RestTemplate buildLenientRestTemplate() {
        RestTemplate r = new RestTemplate();
        r.setErrorHandler(new DefaultResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) {
                return false;
            }
        });
        return r;
    }

    @Value("${local.server.port}")
    private int port;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private TablaPermisosRepository tablaPermisosRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Integer smUserId;
    private Integer devUserId;
    private Integer projectId;
    private Integer sprintId;
    private Integer issueMainId;
    private Integer issueToDeleteId;
    private Integer issueForAssignId;

    private String api(String path) {
        return "http://127.0.0.1:" + port + "/api" + path;
    }

    private void logIo(String title, String method, String url, Object requestBody, ResponseEntity<String> response) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== ").append(title).append(" ==========\n");
        sb.append(method).append(" ").append(url).append("\n");
        sb.append("INPUT:\n");
        try {
            if (requestBody == null) {
                sb.append("(sin cuerpo)\n");
            } else if (requestBody instanceof String s) {
                sb.append(s).append("\n");
            } else {
                sb.append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(requestBody)).append("\n");
            }
        } catch (Exception e) {
            sb.append(String.valueOf(requestBody)).append("\n");
        }
        sb.append("OUTPUT (HTTP): ").append(response.getStatusCode().value()).append("\n");
        sb.append("BODY:\n");
        sb.append(response.getBody() != null ? response.getBody() : "(vacío)").append("\n");
        String block = sb.toString();
        IO_LOG.add(block);
        System.out.println(block);
    }

    private ResponseEntity<String> exchangeJson(String method, String url, Object body) {
        HttpHeaders headers = new HttpHeaders();
        if (body != null) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        HttpEntity<?> entity = new HttpEntity<>(body, headers);
        return http.exchange(url, HttpMethod.valueOf(method), entity, String.class);
    }

    @BeforeAll
    void prepareWorld() throws Exception {
        seedRolesPermissionsUsers();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Proyecto (owner = SM → queda como PO hasta cambiar rol)
        Map<String, Object> createProj = new LinkedHashMap<>();
        createProj.put("name", "Proyecto Reto IT");
        createProj.put("description", "Datos generados por RetoReleaseApiIT");
        createProj.put("start", LocalDate.now().minusDays(30).toString());
        createProj.put("end", LocalDate.now().plusDays(60).toString());
        createProj.put("ownerId", smUserId);
        ResponseEntity<String> rProj = exchangeJson("POST", api("/proyectos"), createProj);
        logIo("Setup — Crear proyecto", "POST", api("/proyectos"), createProj, rProj);
        assertThat(rProj.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode projNode = objectMapper.readTree(rProj.getBody());
        projectId = projNode.get("id").asInt();

        // SM → Scrum Master
        Map<String, String> roleSm = Map.of("role", "Scrum Master");
        ResponseEntity<String> rSmRole = exchangeJson(
                "PUT", api("/proyectos/" + projectId + "/miembros/" + smUserId + "/rol"), roleSm);
        logIo("Setup — Rol SM", "PUT", api("/proyectos/" + projectId + "/miembros/" + smUserId + "/rol"), roleSm, rSmRole);
        assertThat(rSmRole.getStatusCode().is2xxSuccessful()).isTrue();

        // Dev se une al proyecto
        Map<String, Integer> joinBody = Map.of("userId", devUserId);
        ResponseEntity<String> rJoin = exchangeJson("POST", api("/proyectos/" + projectId + "/unirse"), joinBody);
        logIo("Setup — Unir desarrollador", "POST", api("/proyectos/" + projectId + "/unirse"), joinBody, rJoin);
        assertThat(rJoin.getStatusCode().is2xxSuccessful()).isTrue();

        Map<String, String> roleDev = Map.of("role", "Developer");
        ResponseEntity<String> rDevRole = exchangeJson(
                "PUT", api("/proyectos/" + projectId + "/miembros/" + devUserId + "/rol"), roleDev);
        logIo("Setup — Rol Developer", "PUT", api("/proyectos/" + projectId + "/miembros/" + devUserId + "/rol"), roleDev, rDevRole);
        assertThat(rDevRole.getStatusCode().is2xxSuccessful()).isTrue();

        // Sprint
        Map<String, Object> sprintBody = new LinkedHashMap<>();
        sprintBody.put("projectId", projectId);
        sprintBody.put("name", "Sprint Reto IT");
        sprintBody.put("goal", "Cerrar pruebas automáticas");
        sprintBody.put("status", "P");
        sprintBody.put("startDate", LocalDate.now().minusDays(7).toString());
        sprintBody.put("endDate", LocalDate.now().plusDays(7).toString());
        sprintBody.put("capacity", 40);
        ResponseEntity<String> rSprint = exchangeJson("POST", api("/sprints"), sprintBody);
        logIo("Setup — Crear sprint", "POST", api("/sprints"), sprintBody, rSprint);
        assertThat(rSprint.getStatusCode().is2xxSuccessful()).isTrue();
        sprintId = objectMapper.readTree(rSprint.getBody()).get("id").asInt();
    }

    private void seedRolesPermissionsUsers() {
        if (rolRepository.count() > 0) {
            usuarioRepository.findByEmailUsuario("reto_dev@test.local").ifPresent(u -> devUserId = u.getIdUsuario());
            usuarioRepository.findByEmailUsuario("reto_sm@test.local").ifPresent(u -> smUserId = u.getIdUsuario());
            return;
        }

        Rol rDev = new Rol();
        rDev.setNombreRol("Developer");
        rDev.setSistema(true);
        rDev = rolRepository.save(rDev);

        Rol rSm = new Rol();
        rSm.setNombreRol("Scrum Master");
        rSm.setSistema(true);
        rSm = rolRepository.save(rSm);

        Rol rPo = new Rol();
        rPo.setNombreRol("Product Owner");
        rPo.setSistema(true);
        rPo = rolRepository.save(rPo);

        record P(String name, String desc) {}
        List<P> plist = List.of(
                new P("canCreateSprint", "Crear sprints"),
                new P("canCreateIssue", "Crear issues"),
                new P("canEditIssue", "Editar issues"),
                new P("canManageMembers", "Gestionar miembros"),
                new P("canViewMetrics", "Ver métricas"),
                new P("canViewOnlyOwnIssues", "Ver solo propios"),
                new P("canViewAllIssues", "Ver todos"),
                new P("canEditProjectDates", "Fechas proyecto"),
                new P("canUploadDailyPhoto", "Fotos daily")
        );
        for (P p : plist) {
            Permiso perm = new Permiso();
            perm.setNombrePermiso(p.name);
            perm.setDescripcionPermisos(p.desc);
            permisoRepository.save(perm);
        }

        link(rDev, "canCreateIssue", "canEditIssue", "canViewOnlyOwnIssues");
        link(rSm, "canCreateSprint", "canCreateIssue", "canEditIssue", "canManageMembers",
                "canViewMetrics", "canViewAllIssues", "canEditProjectDates", "canUploadDailyPhoto");
        link(rPo, "canCreateSprint", "canCreateIssue", "canEditIssue", "canManageMembers",
                "canViewMetrics", "canViewAllIssues", "canEditProjectDates", "canUploadDailyPhoto");

        Usuario sm = new Usuario();
        sm.setNombreUsuario("reto_sm");
        sm.setEmailUsuario("reto_sm@test.local");
        sm.setPasswordHash(passwordEncoder.encode("123"));
        sm.setFechaRegistroUsuario(LocalDate.now());
        sm.setActivoUsuario("1");
        sm.setEmailVerificado("1");
        sm = usuarioRepository.save(sm);
        smUserId = sm.getIdUsuario();

        Usuario dev = new Usuario();
        dev.setNombreUsuario("reto_dev");
        dev.setEmailUsuario("reto_dev@test.local");
        dev.setPasswordHash(passwordEncoder.encode("123"));
        dev.setFechaRegistroUsuario(LocalDate.now());
        dev.setActivoUsuario("1");
        dev.setEmailVerificado("1");
        dev = usuarioRepository.save(dev);
        devUserId = dev.getIdUsuario();
    }

    private void link(Rol rol, String... permNames) {
        for (String name : permNames) {
            Permiso p = permisoRepository.findByNombrePermiso(name).orElseThrow();
            TablaPermisos tp = new TablaPermisos();
            tp.setId(new TablaPermisos.TablaPermisosId(rol.getIdRol(), p.getIdPermiso()));
            tp.setRol(rol);
            tp.setPermiso(p);
            tablaPermisosRepository.save(tp);
        }
    }

    @AfterAll
    void writeIoFile() throws Exception {
        Path out = Path.of("target", "reto-release-api-io.txt");
        Files.createDirectories(out.getParent());
        String all = String.join("", IO_LOG);
        Files.writeString(out, all, StandardCharsets.UTF_8);
        System.out.println("\n[RetoReleaseApiIT] IO completo en: " + out.toAbsolutePath());
    }

    @Test
    @Order(1)
    void prueba51_darDeAltaTarea() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("projectId", projectId);
        body.put("sprintId", String.valueOf(sprintId));
        body.put("title", "Tarea Reto — alta automática");
        body.put("description", "Creada por RetoReleaseApiIT");
        body.put("purpose", "Demo release");
        body.put("status", "todo");
        body.put("priority", "Medium");
        body.put("storyPoints", 5);
        body.put("assigneeIds", List.of(devUserId));

        ResponseEntity<String> res = exchangeJson("POST", api("/issues"), body);
        logIo("Prueba 5.1 — Dar de alta la siguiente tarea", "POST", api("/issues"), body, res);
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
        issueMainId = objectMapper.readTree(res.getBody()).get("id").asInt();
    }

    @Test
    @Order(2)
    void prueba52_darDeBajaTarea() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("projectId", projectId);
        body.put("sprintId", String.valueOf(sprintId));
        body.put("title", "Tarea temporal para borrar");
        body.put("description", "");
        body.put("purpose", "");
        body.put("status", "todo");
        body.put("priority", "Low");
        body.put("storyPoints", 1);
        body.put("assigneeIds", List.of());

        ResponseEntity<String> create = exchangeJson("POST", api("/issues"), body);
        logIo("Prueba 5.2 (parte 1) — Alta auxiliar para baja", "POST", api("/issues"), body, create);
        assertThat(create.getStatusCode().is2xxSuccessful()).isTrue();
        issueToDeleteId = objectMapper.readTree(create.getBody()).get("id").asInt();

        ResponseEntity<String> del = exchangeJson("DELETE", api("/issues/" + issueToDeleteId), null);
        logIo("Prueba 5.2 (parte 2) — Dar de baja una tarea", "DELETE", api("/issues/" + issueToDeleteId), null, del);
        assertThat(del.getStatusCode().value()).isEqualTo(204);
    }

    @Test
    @Order(3)
    void prueba53_asignarTarea() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("projectId", projectId);
        body.put("sprintId", String.valueOf(sprintId));
        body.put("title", "Tarea sin asignar inicialmente");
        body.put("description", "Asignación vía PUT");
        body.put("purpose", "");
        body.put("status", "todo");
        body.put("priority", "Medium");
        body.put("storyPoints", 3);
        body.put("assigneeIds", List.of());

        ResponseEntity<String> create = exchangeJson("POST", api("/issues"), body);
        logIo("Prueba 5.3 (parte 1) — Crear sin asignados", "POST", api("/issues"), body, create);
        assertThat(create.getStatusCode().is2xxSuccessful()).isTrue();
        issueForAssignId = objectMapper.readTree(create.getBody()).get("id").asInt();

        Map<String, Object> upd = Map.of("assigneeIds", List.of(devUserId));
        ResponseEntity<String> put = exchangeJson("PUT", api("/issues/" + issueForAssignId), upd);
        logIo("Prueba 5.3 (parte 2) — Asignar tarea a integrante", "PUT", api("/issues/" + issueForAssignId), upd, put);
        assertThat(put.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode assignees = objectMapper.readTree(put.getBody()).get("assigneeIds");
        assertThat(assignees.toString()).contains(String.valueOf(devUserId));
    }

    @Test
    @Order(4)
    void prueba54_completarTarea() throws Exception {
        Map<String, Object> upd = Map.of("status", "done");
        ResponseEntity<String> put = exchangeJson("PUT", api("/issues/" + issueForAssignId), upd);
        logIo("Prueba 5.4 — Completar tarea", "PUT", api("/issues/" + issueForAssignId), upd, put);
        assertThat(put.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(objectMapper.readTree(put.getBody()).get("status").asText()).isEqualTo("done");
    }

    @Test
    @Order(5)
    void prueba55_visualizarTareasDesarrollador() throws Exception {
        String url = api("/issues/sprint/" + sprintId);
        ResponseEntity<String> res = exchangeJson("GET", url, null);
        logIo("Prueba 5.5 — Visualizar tareas de un desarrollador (GET sprint + filtro por asignado)",
                "GET", url, "(query: ninguno; filtro aplicado en test sobre el JSON)", res);
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode arr = objectMapper.readTree(res.getBody());
        int forDev = 0;
        for (JsonNode n : arr) {
            JsonNode ids = n.get("assigneeIds");
            if (ids != null && ids.isArray()) {
                for (JsonNode id : ids) {
                    if (id.asInt() == devUserId) {
                        forDev++;
                        break;
                    }
                }
            }
        }
        assertThat(forDev).isGreaterThanOrEqualTo(2);
    }

    @Test
    @Order(6)
    void prueba56_visualizarKpisDesarrollador() throws Exception {
        String url = api("/sprints/" + sprintId + "/kpis/desarrollador/" + devUserId + "?viewerUserId=" + smUserId);
        ResponseEntity<String> res = exchangeJson("GET", url, null);
        logIo("Prueba 5.6 — Visualizar KPIs de un desarrollador", "GET", url, null, res);
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode k = objectMapper.readTree(res.getBody());
        assertThat(k.get("developerUserId").asInt()).isEqualTo(devUserId);
        assertThat(k.get("issuesAssignedInSprint").asInt()).isGreaterThan(0);
    }

    @Test
    @Order(7)
    void prueba57_managerVeTareasEquipo() throws Exception {
        String url = api("/issues/sprint/" + sprintId);
        ResponseEntity<String> res = exchangeJson("GET", url, null);
        logIo("Prueba 5.7 — Manager (SM) visualiza tareas del equipo (listado completo del sprint)",
                "GET", url, null, res);
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode arr = objectMapper.readTree(res.getBody());
        assertThat(arr.isArray()).isTrue();
        assertThat(arr.size()).isGreaterThanOrEqualTo(2);
    }
}

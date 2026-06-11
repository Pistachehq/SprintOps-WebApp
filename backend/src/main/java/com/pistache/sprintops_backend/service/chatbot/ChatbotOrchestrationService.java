package com.pistache.sprintops_backend.service.chatbot;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.pistache.sprintops_backend.dto.chatbot.ChatbotHistoryTurn;
import com.pistache.sprintops_backend.dto.chatbot.ChatbotMessageRequest;
import com.pistache.sprintops_backend.model.InfoUsuarioEquipo.InfoUsuarioEquipoId;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.InfoUsuarioEquipoRepository;
import com.pistache.sprintops_backend.repository.SprintRepository;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatbotOrchestrationService {

    private static final int MAX_TOOL_ROUNDS = 8;

    /** Evita que una herramienta devuelva texto enorme y dispare el TPM de Groq en la siguiente ronda. */
    private static final int MAX_TOOL_MESSAGE_CHARS = 12_000;

    /** Solo los últimos turnos entran al modelo (cada turno suma tokens en cada ronda de herramientas). */
    private static final int MAX_HISTORY_TURNS = 20;

    /**
     * Si el modelo ya pidió solo mutaciones concretas y la respuesta de herramienta es clara,
     * devolvemos eso al usuario sin una segunda llamada a Groq (ahorra TPM y evita 429 tras éxito en BD).
     */
    private static final Set<String> MUTATION_TOOLS_OK_WITHOUT_LLM_FOLLOW_UP = Set.of(
            "set_issue_status",
            "set_issue_status_by_title",
            "set_issue_assignees",
            "assign_issue_by_title",
            "move_issue_to_next_sprint",
            "create_issue",
            "update_issue_fields",
            "save_my_daily_standup"
    );

    private static final String HELP = """
            Comandos rápidos (también puedes escribir en lenguaje natural):
            /start /inicio — mensaje de bienvenida
            /help /ayuda — esta ayuda
            
            Consultas (el asistente usa herramientas según tu rol):
            • Issues asignados a ti, por sprint, detalle, historial, tu progreso
            • Métricas por sprint (si tienes canViewMetrics)
            • Daily: el tuyo o del equipo por fecha; retrospectivas guardadas en servidor
            
            Acciones: crear/editar issues, asignar por título o por id de issue, cambiar estado (in_progress/done), mover entre sprints, daily de hoy, papelera, sprints, proyecto, roles, unirse por código, crear proyecto.
            La reflexión + health check del sprint siguen en la pantalla Reflexión de la app (almacenamiento local).
            
            Todas las operaciones respetan el proyecto abierto y tus permisos en ese proyecto.
            """;

    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private GroqChatClient groqChatClient;
    @Autowired
    private ChatbotToolExecutor toolExecutor;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private InfoUsuarioEquipoRepository infoUsuarioEquipoRepository;
    @Autowired
    private SprintRepository sprintRepository;

    public boolean isProjectMember(Integer userId, Integer projectId) {
        if (userId == null || projectId == null) {
            return false;
        }
        Optional<Proyecto> opt = proyectoService.findById(projectId);
        if (opt.isEmpty() || opt.get().getEquipo() == null) {
            return false;
        }
        int equipoId = opt.get().getEquipo().getIdEquipo();
        return infoUsuarioEquipoRepository.findById(new InfoUsuarioEquipoId(equipoId, userId)).isPresent();
    }

    public String handle(ChatbotMessageRequest req) throws Exception {
        if (!groqChatClient.isConfigured()) {
            return "El asistente no está configurado: define la variable de entorno GROQ_API_KEY en el servidor "
                    + "(o groq.api.key en application.properties) y reinicia el backend.";
        }

        Integer projectId = req.getProjectId();
        Integer userId = req.getUserId();
        String userMessage = req.getMessage() != null ? req.getMessage().trim() : "";
        if (userMessage.isEmpty()) {
            return "Escribe un mensaje o un comando (por ejemplo /ayuda).";
        }

        String lower = userMessage.toLowerCase();
        if (lower.equals("/help") || lower.equals("/ayuda")) {
            return HELP;
        }
        if (lower.equals("/start") || lower.equals("/inicio")) {
            return "¡Hola! Soy Dash (Oracle SprintOps). Estoy conectado al proyecto actual: puedes preguntar por issues, "
                    + "daily meetings, métricas (si tienes permiso) o pedir acciones como crear un issue. Escribe /ayuda para la lista de temas.";
        }

        Optional<Proyecto> optP = proyectoService.findById(projectId);
        if (optP.isEmpty()) {
            return "Proyecto no encontrado.";
        }
        Proyecto proyecto = optP.get();
        String userLabel = usuarioService.findById(userId)
                .map(Usuario::getNombreUsuario)
                .orElse("usuario " + userId);

        List<Sprint> sprints = sprintRepository.findByProyectoIdProyecto(projectId);

        String fastAssigned = tryFastPathAssignedIssuesInSprint(userMessage, projectId, userId, sprints);
        if (fastAssigned != null) {
            return fastAssigned;
        }

        StringBuilder sprintLine = new StringBuilder();
        for (Sprint s : sprints) {
            sprintLine.append(String.format("id=%d nombre=%s (%s..%s); ",
                    s.getIdSprint(),
                    s.getNombreSprint() != null ? s.getNombreSprint() : "",
                    s.getFechaInicioSprint(),
                    s.getFechaFinSprint()));
        }

        String system = """
                Eres Dash, asistente de Oracle SprintOps. Responde siempre en español, claro y breve.
                Contexto fijo: proyecto id=%d nombre="%s". Usuario id=%d (%s). Fecha de hoy: %s.
                Sprints de este proyecto: %s
                Solo puedes usar herramientas que operan sobre este proyecto (salvo crear_new_project o join_project_by_invite_code).
                Si el usuario no tiene permiso, explica qué permiso hace falta (nombres exactos: canViewMetrics, canCreateIssue, canEditIssue, canCreateSprint, canManageMembers, canEditProjectDates, canViewAllIssues, canViewOnlyOwnIssues).
                Para fechas en daily usa yyyy-MM-dd. Estados de issue (inglés en herramientas): todo, in_progress, done, blocked.
                Si preguntan qué tienen asignado en un sprint concreto, usa list_my_assigned_issues_in_sprint con sprint_id (list_project_sprints para ids).
                Nunca inventes issue_id ni uses marcadores como <issue_id>: el id es un número devuelto por find_issues o list_sprint_issues.
                Asignar por título (ej. «Prueba de issue-sprint» en sprint 1 a axel): prefer assign_issue_by_title con title_contains, sprint_id si lo sabes y assignee_usernames ["axel"]. Alternativa: find_issues y luego set_issue_assignees con ese issue_id entero.
                Cambiar estado por título (una frase): set_issue_status_by_title con title_contains, status (todo/in_progress/done/blocked) y sprint_id opcional. Con issue_id numérico: set_issue_status. Alternativa: find_issues y set_issue_status.
                Mover issue a otro sprint: move_issue_to_next_sprint (issue_id, from_sprint_id, to_sprint_id); usa list_project_sprints para ids de sprint.
                Si preguntan por "qué dijo X en el daily", usa team_daily_standup con date_iso y username_contains.
                """.formatted(
                projectId,
                proyecto.getNombreProyecto() != null ? proyecto.getNombreProyecto() : "",
                userId,
                userLabel,
                LocalDate.now(),
                sprintLine.length() > 0 ? sprintLine.toString() : "(ninguno)"
        );

        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(objectMapper.createObjectNode()
                .put("role", "system")
                .put("content", system));

        if (req.getHistory() != null && !req.getHistory().isEmpty()) {
            List<ChatbotHistoryTurn> hist = req.getHistory();
            int from = Math.max(0, hist.size() - MAX_HISTORY_TURNS);
            for (int idx = from; idx < hist.size(); idx++) {
                ChatbotHistoryTurn t = hist.get(idx);
                if (t == null || t.getRole() == null || t.getContent() == null) {
                    continue;
                }
                String role = t.getRole().trim().toLowerCase();
                if (!role.equals("user") && !role.equals("assistant")) {
                    continue;
                }
                String c = t.getContent().trim();
                if (c.isEmpty()) {
                    continue;
                }
                messages.add(objectMapper.createObjectNode()
                        .put("role", role)
                        .put("content", c));
            }
        }

        messages.add(objectMapper.createObjectNode()
                .put("role", "user")
                .put("content", userMessage));

        ArrayNode tools = ChatbotGroqToolDefinitions.forUserMessage(objectMapper, userMessage);

        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", groqChatClient.getModel());
            body.put("temperature", 0.2);
            body.set("messages", messages);
            body.set("tools", tools);
            body.put("tool_choice", "auto");
            body.put("parallel_tool_calls", false);

            JsonNode resp = groqChatClient.chat(body);
            JsonNode choice = resp.path("choices").path(0).path("message");
            JsonNode toolCalls = choice.get("tool_calls");
            String assistantContent = choice.path("content").isMissingNode() || choice.get("content").isNull()
                    ? ""
                    : choice.get("content").asText("");

            ObjectNode assistantMsg = objectMapper.createObjectNode();
            assistantMsg.put("role", "assistant");
            if (!assistantContent.isEmpty()) {
                assistantMsg.put("content", assistantContent);
            } else {
                assistantMsg.putNull("content");
            }
            if (toolCalls != null && toolCalls.isArray() && !toolCalls.isEmpty()) {
                assistantMsg.set("tool_calls", toolCalls);
            }
            messages.add(assistantMsg);

            if (toolCalls == null || !toolCalls.isArray() || toolCalls.isEmpty()) {
                return assistantContent.isEmpty()
                        ? "Listo."
                        : assistantContent;
            }

            List<String> batchToolNames = new ArrayList<>();
            List<String> batchToolResults = new ArrayList<>();
            for (JsonNode tc : toolCalls) {
                String id = tc.path("id").asText("");
                String fnName = tc.path("function").path("name").asText("");
                String argStr = tc.path("function").path("arguments").asText("{}");
                JsonNode args;
                try {
                    args = objectMapper.readTree(argStr.isBlank() ? "{}" : argStr);
                } catch (Exception e) {
                    args = objectMapper.createObjectNode();
                }
                String result = clampToolContent(toolExecutor.execute(fnName, args, projectId, userId));
                batchToolNames.add(fnName);
                batchToolResults.add(result);
                ObjectNode toolMessage = objectMapper.createObjectNode();
                toolMessage.put("role", "tool");
                toolMessage.put("tool_call_id", id);
                toolMessage.put("name", fnName);
                toolMessage.put("content", result);
                messages.add(toolMessage);
            }
            String shortcut = maybeUserVisibleReplyWithoutGroq(batchToolNames, batchToolResults);
            if (shortcut != null) {
                return shortcut;
            }
        }

        return "La conversación requirió demasiadas herramientas seguidas; simplifica la petición o hazla por pasos.";
    }

    /**
     * Respuesta directa sin LLM para «qué tengo asignado en el sprint X» (evita tool_use_failed de Groq).
     */
    private String tryFastPathAssignedIssuesInSprint(
            String userMessage, Integer projectId, Integer userId, List<Sprint> sprints) {
        if (sprints == null || sprints.isEmpty()) {
            return null;
        }
        String low = userMessage.toLowerCase(Locale.ROOT);
        boolean asksAssigned = low.contains("asignad")
                || low.contains("mis tarea")
                || low.contains("mis actividad")
                || low.contains("tengo en el sprint")
                || low.contains("tengo en sprint");
        if (!asksAssigned) {
            return null;
        }
        Optional<Sprint> sprint = matchSprintFromMessage(userMessage, sprints);
        if (sprint.isEmpty()) {
            return null;
        }
        ObjectNode args = objectMapper.createObjectNode().put("sprint_id", sprint.get().getIdSprint());
        return toolExecutor.execute("list_my_assigned_issues_in_sprint", args, projectId, userId);
    }

    private static Optional<Sprint> matchSprintFromMessage(String message, List<Sprint> sprints) {
        Matcher quoted = Pattern.compile("['\"]([^'\"]{2,80})['\"]").matcher(message);
        while (quoted.find()) {
            Optional<Sprint> hit = matchSprintByNameFragment(quoted.group(1), sprints);
            if (hit.isPresent()) {
                return hit;
            }
        }
        String low = message.toLowerCase(Locale.ROOT);
        Sprint best = null;
        int bestLen = 0;
        for (Sprint s : sprints) {
            String name = s.getNombreSprint();
            if (name == null || name.isBlank()) {
                continue;
            }
            String nameLow = name.toLowerCase(Locale.ROOT);
            if (low.contains(nameLow) && nameLow.length() > bestLen) {
                best = s;
                bestLen = nameLow.length();
            }
        }
        return Optional.ofNullable(best);
    }

    private static Optional<Sprint> matchSprintByNameFragment(String fragment, List<Sprint> sprints) {
        if (fragment == null || fragment.isBlank()) {
            return Optional.empty();
        }
        String f = fragment.trim().toLowerCase(Locale.ROOT);
        Sprint exact = null;
        Sprint partial = null;
        int partialLen = 0;
        for (Sprint s : sprints) {
            String name = s.getNombreSprint();
            if (name == null) {
                continue;
            }
            String n = name.toLowerCase(Locale.ROOT);
            if (n.equals(f)) {
                exact = s;
            } else if ((n.contains(f) || f.contains(n)) && n.length() > partialLen) {
                partial = s;
                partialLen = n.length();
            }
        }
        if (exact != null) {
            return Optional.of(exact);
        }
        return Optional.ofNullable(partial);
    }

    private static String clampToolContent(String raw) {
        if (raw == null) {
            return "";
        }
        if (raw.length() <= MAX_TOOL_MESSAGE_CHARS) {
            return raw;
        }
        return raw.substring(0, MAX_TOOL_MESSAGE_CHARS)
                + "\n… (respuesta truncada para no sobrecargar la IA; acota la consulta o usa la app).";
    }

    private static String maybeUserVisibleReplyWithoutGroq(List<String> toolNames, List<String> toolResults) {
        if (toolNames.size() != toolResults.size() || toolNames.isEmpty()) {
            return null;
        }
        for (String name : toolNames) {
            if (!MUTATION_TOOLS_OK_WITHOUT_LLM_FOLLOW_UP.contains(name)) {
                return null;
            }
        }
        List<String> lines = new ArrayList<>();
        for (String r : toolResults) {
            if (!looksLikeSuccessfulMutationToolText(r)) {
                return null;
            }
            lines.add(r.trim());
        }
        return String.join("\n\n", lines);
    }

    private static boolean looksLikeSuccessfulMutationToolText(String r) {
        if (r == null || r.isBlank()) {
            return false;
        }
        if (r.length() > 900) {
            return false;
        }
        String low = r.trim().toLowerCase(Locale.ROOT);
        if (low.startsWith("no ")) {
            return false;
        }
        if (low.startsWith("varios issues")) {
            return false;
        }
        if (low.startsWith("indica ")) {
            return false;
        }
        if (low.contains("inválido") || low.contains("invalido")) {
            return false;
        }
        if (low.contains("error:")) {
            return false;
        }
        if (low.contains("necesitas ")) {
            return false;
        }
        if (low.contains("no es miembro")) {
            return false;
        }
        if (low.contains("no hay ningún")) {
            return false;
        }
        if (low.contains("sin permiso")) {
            return false;
        }
        return true;
    }
}

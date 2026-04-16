package com.pistache.sprintops_backend.service.chatbot;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;

/**
 * Esquemas de herramientas (OpenAI-compatible) para Groq.
 */
public final class ChatbotGroqToolDefinitions {

    private ChatbotGroqToolDefinitions() {
    }

    public static ArrayNode all(ObjectMapper om) {
        ArrayNode tools = om.createArrayNode();
        tools.add(f(om, "list_my_assigned_issues",
                "Lista los issues asignados al usuario actual en el proyecto del contexto.", empty(om)));
        tools.add(f(om, "list_sprint_issues",
                "Lista issues de un sprint del proyecto. Requiere sprint_id.",
                req(om, List.of("sprint_id"), o -> { o.put("sprint_id", "integer"); })));
        tools.add(f(om, "list_project_sprints",
                "Lista todos los sprints del proyecto (id, nombre, fechas) para elegir sprint_id al mover issues o filtrar búsquedas.",
                empty(om)));
        tools.add(f(om, "find_issues",
                "Busca issues por título parcial, sprint_id y/o estado. Para asignar o cambiar estado por título puedes usar assign_issue_by_title o set_issue_status_by_title; si hace falta id, esta herramienta devuelve issue_id (entero) por línea.",
                opt(om, o -> {
                    o.put("title_contains", "string");
                    o.put("sprint_id", "integer");
                    o.put("status", "string");
                })));
        tools.add(f(om, "get_issue_detail",
                "Detalle de un issue por id (solo si el usuario puede verlo).",
                req(om, List.of("issue_id"), o -> { o.put("issue_id", "integer"); })));
        tools.add(f(om, "get_issue_change_history",
                "Historial de cambios (logs) de un issue.",
                req(om, List.of("issue_id"), o -> { o.put("issue_id", "integer"); })));
        tools.add(f(om, "summarize_my_issue_progress",
                "Resumen del progreso del usuario con sus issues en el proyecto.", empty(om)));
        tools.add(f(om, "project_metrics_snapshot",
                "Métricas agregadas por sprint (requiere canViewMetrics).", empty(om)));
        tools.add(f(om, "team_daily_standup",
                "Daily del equipo por fecha (yyyy-MM-dd). Opcional username_contains. Requiere canViewMetrics.",
                opt(om, o -> {
                    o.put("date_iso", "string");
                    o.put("username_contains", "string");
                })));
        tools.add(f(om, "my_daily_standup",
                "Daily del usuario actual en el proyecto para una fecha (yyyy-MM-dd).",
                opt(om, o -> { o.put("date_iso", "string"); })));
        tools.add(f(om, "list_retro_reflections",
                "Ítems de retrospectiva del proyecto. Opcional sprint_id. Requiere canViewMetrics.",
                opt(om, o -> { o.put("sprint_id", "integer"); })));
        tools.add(f(om, "create_issue",
                "Crea un issue en el proyecto. Opcional sprint_id para vincular al sprint.",
                req(om, List.of("title"), o -> {
                    o.put("title", "string");
                    o.put("description", "string");
                    o.put("purpose", "string");
                    o.put("sprint_id", "integer");
                    o.put("priority", "string");
                    o.put("story_points", "integer");
                    o.put("status", "string");
                })));
        tools.add(f(om, "update_issue_fields",
                "Actualiza campos de un issue (título, descripción, etc.).",
                req(om, List.of("issue_id"), o -> {
                    o.put("issue_id", "integer");
                    o.put("title", "string");
                    o.put("description", "string");
                    o.put("purpose", "string");
                    o.put("priority", "string");
                    o.put("story_points", "integer");
                })));
        tools.add(f(om, "set_issue_status",
                "Cambia estado del issue por id. Valores en inglés: todo, in_progress (En progreso), done (Finalizado/hecho), blocked.",
                req(om, List.of("issue_id", "status"), o -> {
                    o.put("issue_id", "integer");
                    o.put("status", "string");
                })));
        tools.add(f(om, "set_issue_status_by_title",
                "Cambia estado cuando el usuario nombra el título sin issue_id: title_contains, status (todo/in_progress/done/blocked) y opcional sprint_id si hay ambigüedad. Una sola coincidencia; si hay varias, acotar o usar find_issues.",
                req(om, List.of("title_contains", "status"), o -> {
                    o.put("title_contains", "string");
                    o.put("status", "string");
                    o.put("sprint_id", "integer");
                })));
        tools.add(f(om, "set_issue_assignees",
                "Reemplaza los asignados de un issue. issue_id debe ser un entero tomado de find_issues o list_sprint_issues (nunca texto tipo <issue_id> ni placeholders). "
                        + "assignee_user_ids y/o assignee_usernames: miembros del equipo del proyecto (ej. [\"axel\"]).",
                req(om, List.of("issue_id"), o -> {
                    o.put("issue_id", "integer");
                    o.put("assignee_user_ids", "array");
                    o.put("assignee_usernames", "array");
                })));
        tools.add(f(om, "assign_issue_by_title",
                "Asigna por título cuando el usuario no da issue_id: title_contains (fragmento del título) y opcionalmente sprint_id para acotar. "
                        + "Incluye assignee_usernames (ej. [\"axel\"]) y/o assignee_user_ids. Solo si hay una coincidencia; si hay varias, el usuario debe acotar o usa find_issues.",
                req(om, List.of("title_contains"), o -> {
                    o.put("title_contains", "string");
                    o.put("sprint_id", "integer");
                    o.put("status", "string");
                    o.put("assignee_user_ids", "array");
                    o.put("assignee_usernames", "array");
                })));
        tools.add(f(om, "save_my_daily_standup",
                "Guarda el daily del usuario para HOY en un sprint (qué hice, haré, bloqueos).",
                req(om, List.of("sprint_id", "done", "doing", "blockers"), o -> {
                    o.put("sprint_id", "integer");
                    o.put("done", "string");
                    o.put("doing", "string");
                    o.put("blockers", "string");
                })));
        tools.add(f(om, "move_issue_to_next_sprint",
                "Mueve un issue de un sprint a otro del mismo proyecto (requiere issue_id y los ids de sprint origen y destino; usa list_project_sprints o list_sprint_issues para conocerlos).",
                req(om, List.of("issue_id", "from_sprint_id", "to_sprint_id"), o -> {
                    o.put("issue_id", "integer");
                    o.put("from_sprint_id", "integer");
                    o.put("to_sprint_id", "integer");
                    o.put("story_points", "integer");
                })));
        tools.add(f(om, "join_project_by_invite_code",
                "Une al usuario a otro proyecto por código de 5 dígitos.",
                req(om, List.of("code"), o -> { o.put("code", "string"); })));
        tools.add(f(om, "get_project_invite_code",
                "Devuelve el código numérico de invitación del proyecto actual.", empty(om)));
        tools.add(f(om, "create_sprint",
                "Crea sprint en el proyecto (fechas ISO yyyy-MM-dd).",
                req(om, List.of("name", "start_date", "end_date"), o -> {
                    o.put("name", "string");
                    o.put("goal", "string");
                    o.put("start_date", "string");
                    o.put("end_date", "string");
                    o.put("capacity", "integer");
                    o.put("status", "string");
                })));
        tools.add(f(om, "update_sprint_fields",
                "Edita un sprint del proyecto.",
                req(om, List.of("sprint_id"), o -> {
                    o.put("sprint_id", "integer");
                    o.put("name", "string");
                    o.put("goal", "string");
                    o.put("status", "string");
                    o.put("start_date", "string");
                    o.put("end_date", "string");
                    o.put("capacity", "integer");
                })));
        tools.add(f(om, "update_project_fields",
                "Edita nombre, descripción o fechas del proyecto.",
                opt(om, o -> {
                    o.put("name", "string");
                    o.put("description", "string");
                    o.put("start", "string");
                    o.put("end", "string");
                    o.put("status", "string");
                })));
        tools.add(f(om, "set_team_member_role",
                "Asigna rol de equipo (Developer, Scrum Master, Product Owner). Usa target_user_id o target_username.",
                req(om, List.of("role_name"), o -> {
                    o.put("target_user_id", "integer");
                    o.put("target_username", "string");
                    o.put("role_name", "string");
                })));
        tools.add(f(om, "create_project_role",
                "Crea un rol personalizado para el proyecto (sin permisos hasta configurarlos).",
                req(om, List.of("role_name"), o -> { o.put("role_name", "string"); })));
        tools.add(f(om, "rename_role",
                "Renombra un rol de proyecto (no roles sistema).",
                req(om, List.of("role_id", "new_name"), o -> {
                    o.put("role_id", "integer");
                    o.put("new_name", "string");
                })));
        tools.add(f(om, "set_role_permissions_by_name",
                "Reemplaza permisos de un rol de proyecto por lista de nombres (ej. canCreateIssue).",
                req(om, List.of("role_id", "permission_names"), o -> {
                    o.put("role_id", "integer");
                    o.put("permission_names", "array");
                })));
        tools.add(f(om, "list_sprint_trash",
                "Lista papelera de un sprint.",
                req(om, List.of("sprint_id"), o -> { o.put("sprint_id", "integer"); })));
        tools.add(f(om, "restore_trash_item",
                "Restaura un issue desde la papelera (papelera_id).",
                req(om, List.of("papelera_id"), o -> { o.put("papelera_id", "integer"); })));
        tools.add(f(om, "delete_trash_permanently",
                "Borra definitivamente una entrada de papelera.",
                req(om, List.of("papelera_id"), o -> { o.put("papelera_id", "integer"); })));
        tools.add(f(om, "create_new_project",
                "Crea un proyecto nuevo (el usuario queda como creador/PO). No cambia el contexto del chat.",
                req(om, List.of("name", "start", "end"), o -> {
                    o.put("name", "string");
                    o.put("description", "string");
                    o.put("start", "string");
                    o.put("end", "string");
                })));
        tools.add(f(om, "reflection_health_check_hint",
                "Explica cómo guardar reflexión y health check (hoy solo en el cliente).", empty(om)));
        return tools;
    }

    private interface PropsBuilder {
        void build(ObjectNode props) throws Exception;
    }

    private static ObjectNode empty(ObjectMapper om) {
        return schema(om, p -> { }, List.of());
    }

    private static ObjectNode req(ObjectMapper om, List<String> required, PropsBuilder pb) {
        return schema(om, pb, required);
    }

    private static ObjectNode opt(ObjectMapper om, PropsBuilder pb) {
        return schema(om, pb, List.of());
    }

    private static ObjectNode schema(ObjectMapper om, PropsBuilder pb, List<String> required) throws RuntimeException {
        ObjectNode root = om.createObjectNode();
        root.put("type", "object");
        ObjectNode props = om.createObjectNode();
        try {
            pb.build(props);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        ObjectNode typed = om.createObjectNode();
        props.propertyNames().forEach(key -> {
            JsonType t = JsonType.from(props.path(key).asText());
            typed.set(key, t.toNode(om));
        });
        root.set("properties", typed);
        if (!required.isEmpty()) {
            ArrayNode req = om.createArrayNode();
            required.forEach(req::add);
            root.set("required", req);
        }
        return root;
    }

    private static ObjectNode f(ObjectMapper om, String name, String description, ObjectNode parameters) {
        ObjectNode tool = om.createObjectNode();
        tool.put("type", "function");
        ObjectNode fn = tool.putObject("function");
        fn.put("name", name);
        fn.put("description", description);
        fn.set("parameters", parameters);
        return tool;
    }

    private enum JsonType {
        STRING, INTEGER, ARRAY;

        static JsonType from(String s) {
            return switch (s) {
                case "integer" -> INTEGER;
                case "array" -> ARRAY;
                default -> STRING;
            };
        }

        ObjectNode toNode(ObjectMapper om) {
            ObjectNode n = om.createObjectNode();
            switch (this) {
                case INTEGER -> n.put("type", "integer");
                case ARRAY -> {
                    n.put("type", "array");
                    n.putObject("items").put("type", "string");
                }
                default -> n.put("type", "string");
            }
            return n;
        }
    }
}

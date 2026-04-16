package com.pistache.sprintops_backend.service.telegram;

import com.pistache.sprintops_backend.dto.chatbot.ChatbotMessageRequest;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.UsuarioRepository;
import com.pistache.sprintops_backend.service.chatbot.ChatbotOrchestrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TelegramUpdateService {

    private static final Logger log = LoggerFactory.getLogger(TelegramUpdateService.class);

    private static final String HELP = """
            Comandos SprintOps (un solo bot para todos los proyectos):
            /vincular — guarda tu teléfono en la web y luego pulsa aquí para compartir el mismo número.
            /vincular CODIGO — alternativa con código (desde la web, si lo prefieres).
            /proyecto — muestra el proyecto activo y tus proyectos.
            /proyecto N — activa el proyecto con id N (debes ser miembro).
            /misproyectos — lista ids y nombres.
            /estado — cuenta vinculada y proyecto activo.
            /contacto — teclado para actualizar tu teléfono (ya vinculado).
            /desvincular — quita Telegram de tu usuario SprintOps.
            /ayuda — este texto.

            Con proyecto activo, cualquier otro mensaje va al asistente Dash (misma lógica que en la app).
            """;

    @Autowired
    private TelegramApiClient telegramApi;
    @Autowired
    private TelegramLinkService linkService;
    @Autowired
    private TelegramProjectContextService projectContextService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private ChatbotOrchestrationService chatbotOrchestrationService;

    public void handleUpdate(JsonNode update) {
        if (update == null || !telegramApi.isConfigured()) {
            return;
        }
        JsonNode message = update.get("message");
        if (message == null) {
            log.debug("Update sin message ignorado, update_id={}", update.path("update_id").asLong());
            return;
        }
        long chatId = message.path("chat").path("id").asLong();
        JsonNode from = message.get("from");
        long telegramUserId = from != null ? from.path("id").asLong(0L) : 0L;
        if (telegramUserId == 0L) {
            return;
        }

        if (message.has("contact")) {
            JsonNode contact = message.get("contact");
            long contactUserId = contact.path("user_id").asLong(0L);
            if (contactUserId != telegramUserId) {
                telegramApi.sendMessage(chatId, "Por seguridad solo aceptamos el contacto que compartes tú.");
                return;
            }
            String phone = contact.path("phone_number").asText("");
            Optional<Usuario> yaVinculado = usuarioRepository.findByTelegramUserId(telegramUserId);
            if (yaVinculado.isEmpty()) {
                String reply = linkService.linkByTelegramPhone(telegramUserId, phone);
                telegramApi.removeKeyboard(chatId, reply);
                return;
            }
            projectContextService.setTelegramPhone(telegramUserId, phone);
            telegramApi.removeKeyboard(chatId, "Gracias. Teléfono actualizado en tu perfil SprintOps.");
            return;
        }

        String text = message.has("text") ? message.get("text").asText("") : "";
        if (text.isBlank()) {
            return;
        }

        String firstToken = text.trim().split("\\s+", 2)[0];
        String commandBase = firstToken;
        if (commandBase.contains("@")) {
            commandBase = commandBase.substring(0, commandBase.indexOf('@'));
        }
        String lowerCmd = commandBase.toLowerCase();

        if (lowerCmd.equals("/start")) {
            String rest = text.trim().length() > 6 ? text.trim().substring(6).trim() : "";
            if (!rest.isEmpty()) {
                String reply = linkService.linkTelegramUser(telegramUserId, rest);
                telegramApi.sendMessage(chatId, reply);
                return;
            }
            telegramApi.sendMessage(chatId,
                    "Hola. Soy el bot SprintOps. Para vincular: en la app guarda tu teléfono (sección Telegram), "
                            + "luego aquí escribe /vincular y comparte el mismo número. "
                            + "Si prefieres, en la web también puedes generar un código y usar /vincular CODIGO.\n\n" + HELP);
            return;
        }

        if (lowerCmd.equals("/vincular")) {
            String[] parts = text.trim().split("\\s+", 2);
            if (parts.length < 2) {
                telegramApi.sendContactRequestKeyboard(chatId,
                        "Primero guarda tu número en la app (Telegram). Luego pulsa el botón y comparte el mismo teléfono.");
                return;
            }
            String reply = linkService.linkTelegramUser(telegramUserId, parts[1]);
            telegramApi.sendMessage(chatId, reply);
            return;
        }

        if (lowerCmd.equals("/desvincular")) {
            linkService.unlinkTelegram(telegramUserId);
            telegramApi.sendMessage(chatId, "Telegram desvinculado de SprintOps.");
            return;
        }

        if (lowerCmd.equals("/ayuda") || lowerCmd.equals("/help")) {
            telegramApi.sendMessage(chatId, HELP);
            return;
        }

        if (lowerCmd.equals("/contacto")) {
            telegramApi.sendContactRequestKeyboard(chatId, "Pulsa el botón para compartir tu número (opcional).");
            return;
        }

        if (lowerCmd.equals("/estado")) {
            telegramApi.sendMessage(chatId, buildEstado(telegramUserId));
            return;
        }

        if (lowerCmd.equals("/misproyectos")) {
            telegramApi.sendMessage(chatId, buildMisProyectos(telegramUserId));
            return;
        }

        if (lowerCmd.equals("/proyecto")) {
            String[] parts = text.trim().split("\\s+");
            if (parts.length == 1) {
                telegramApi.sendMessage(chatId, buildProyectoInfo(telegramUserId));
                return;
            }
            try {
                int pid = Integer.parseInt(parts[1]);
                String reply = projectContextService.setProyectoTelegram(telegramUserId, pid);
                telegramApi.sendMessage(chatId, reply);
            } catch (NumberFormatException e) {
                telegramApi.sendMessage(chatId, "Uso: /proyecto N (número entero) o /proyecto sin argumentos.");
            }
            return;
        }

        Optional<Usuario> userOpt = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (userOpt.isEmpty()) {
            telegramApi.sendMessage(chatId,
                    "No estás vinculado. En la app guarda tu teléfono y aquí usa /vincular (comparte contacto), "
                            + "o /vincular CODIGO si generaste código en la web.");
            return;
        }
        Usuario u = userOpt.get();
        Integer projectId = u.getTelegramProyectoId();
        if (projectId == null) {
            telegramApi.sendMessage(chatId,
                    "Elige un proyecto primero: /misproyectos y luego /proyecto ID.");
            return;
        }

        ChatbotMessageRequest req = new ChatbotMessageRequest();
        req.setProjectId(projectId);
        req.setUserId(u.getIdUsuario());
        req.setMessage(text);
        try {
            if (!chatbotOrchestrationService.isProjectMember(u.getIdUsuario(), projectId)) {
                telegramApi.sendMessage(chatId, "Ya no eres miembro de ese proyecto. Elige otro con /proyecto ID.");
                return;
            }
            String reply = chatbotOrchestrationService.handle(req);
            telegramApi.sendMessage(chatId, reply);
        } catch (Exception e) {
            telegramApi.sendMessage(chatId, "Error del asistente: " + e.getMessage());
        }
    }

    private String buildEstado(long telegramUserId) {
        Optional<Usuario> opt = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (opt.isEmpty()) {
            return "No vinculado. Guarda tu teléfono en la app y /vincular aquí, o /vincular CODIGO.";
        }
        Usuario u = opt.get();
        StringBuilder sb = new StringBuilder();
        sb.append("Usuario SprintOps: ")
                .append(u.getNombreUsuario() != null ? u.getNombreUsuario() : ("id " + u.getIdUsuario()))
                .append("\nTelegram id: ").append(telegramUserId);
        if (u.getTelegramPhone() != null) {
            sb.append("\nTeléfono (opcional): ").append(u.getTelegramPhone());
        }
        if (u.getTelegramProyectoId() != null) {
            sb.append("\nProyecto activo id: ").append(u.getTelegramProyectoId());
        } else {
            sb.append("\nSin proyecto activo: /proyecto ID");
        }
        return sb.toString();
    }

    private String buildMisProyectos(long telegramUserId) {
        Optional<Usuario> opt = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (opt.isEmpty()) {
            return "No vinculado. Guarda tu teléfono en la app y /vincular, o /vincular CODIGO.";
        }
        List<Proyecto> list = projectContextService.proyectosAccesibles(opt.get().getIdUsuario());
        if (list.isEmpty()) {
            return "No tienes proyectos visibles. Únete a un equipo desde la web.";
        }
        StringBuilder sb = new StringBuilder("Tus proyectos (usa /proyecto ID):\n");
        for (Proyecto p : list) {
            sb.append("• ").append(p.getIdProyecto()).append(" — ")
                    .append(p.getNombreProyecto() != null ? p.getNombreProyecto() : "(sin nombre)")
                    .append("\n");
        }
        return sb.toString().trim();
    }

    private String buildProyectoInfo(long telegramUserId) {
        Optional<Usuario> opt = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (opt.isEmpty()) {
            return "No vinculado. Guarda tu teléfono en la app y /vincular, o /vincular CODIGO.";
        }
        Usuario u = opt.get();
        StringBuilder sb = new StringBuilder();
        if (u.getTelegramProyectoId() != null) {
            sb.append("Proyecto activo: id ").append(u.getTelegramProyectoId()).append("\n");
        } else {
            sb.append("Sin proyecto activo.\n");
        }
        sb.append(buildMisProyectos(telegramUserId));
        return sb.toString();
    }
}

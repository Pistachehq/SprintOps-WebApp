package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.telegram.TelegramLinkCodeRequest;
import com.pistache.sprintops_backend.dto.telegram.TelegramRegisterPhoneRequest;
import com.pistache.sprintops_backend.service.telegram.TelegramApiClient;
import com.pistache.sprintops_backend.service.telegram.TelegramLinkService;
import com.pistache.sprintops_backend.service.telegram.TelegramUpdateService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/telegram")
@CrossOrigin(origins = "*")
public class TelegramController {

    private static final Logger log = LoggerFactory.getLogger(TelegramController.class);

    @Autowired
    private TelegramLinkService telegramLinkService;
    @Autowired
    private TelegramUpdateService telegramUpdateService;
    @Autowired
    private TelegramApiClient telegramApiClient;
    @Autowired
    private ObjectMapper objectMapper;

    /** Opcional: mismo valor que pasas a setWebhook secret_token (Telegram envía X-Telegram-Bot-Api-Secret-Token). */
    @Value("${app.telegram.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.telegram.bot-username:}")
    private String botUsername;

    /**
     * Guarda el teléfono que luego compartirás en Telegram (sin códigos aleatorios).
     */
    @PostMapping("/register-phone")
    public ResponseEntity<?> registerPhone(@RequestBody TelegramRegisterPhoneRequest body) {
        if (body == null || body.getUserId() == null || body.getPhone() == null || body.getPhone().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId y phone son obligatorios"));
        }
        if (!telegramApiClient.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of("error", "Bot de Telegram no configurado (app.telegram.bot-token)"));
        }
        try {
            telegramLinkService.registerPhoneForVinculo(body.getUserId(), body.getPhone().trim(), body.getProjectId());
            Map<String, Object> ok = new HashMap<>();
            ok.put("ok", true);
            ok.put("message", "Abre el bot, escribe /vincular y comparte tu número cuando te lo pida.");
            if (StringUtils.hasText(botUsername)) {
                String u = botUsername.startsWith("@") ? botUsername.substring(1) : botUsername;
                ok.put("telegramUrl", "https://t.me/" + u);
            }
            return ResponseEntity.ok(ok);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ese número ya está asociado a otra cuenta."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Alternativa: código de un solo uso (por si prefieres no usar teléfono).
     */
    @PostMapping("/link-code")
    public ResponseEntity<?> createLinkCode(@RequestBody TelegramLinkCodeRequest body) {
        Integer userId = body != null ? body.getUserId() : null;
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId es obligatorio"));
        }
        if (!telegramApiClient.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of("error", "Bot de Telegram no configurado (app.telegram.bot-token)"));
        }
        try {
            Integer proyectoSugerido = body != null ? body.getProjectId() : null;
            String code = telegramLinkService.generateLinkCode(userId, proyectoSugerido);
            Map<String, Object> res = new HashMap<>();
            res.put("code", code);
            res.put("expiresMinutes", 15);
            res.put("vincularCommand", "/vincular " + code);
            if (StringUtils.hasText(botUsername)) {
                String u = botUsername.startsWith("@") ? botUsername.substring(1) : botUsername;
                res.put("deepLink", "https://t.me/" + u + "?start=" + code);
            }
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Solo para comprobar en navegador / ngrok: Telegram siempre usa POST en esta misma ruta.
     */
    @GetMapping("/webhook")
    public ResponseEntity<String> webhookBrowserHint() {
        return ResponseEntity.ok(
                "SprintOps: webhook de Telegram OK. La app de Telegram llama aquí con POST; un GET en el navegador no simula un mensaje.");
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        if (!telegramApiClient.isConfigured()) {
            log.warn("Webhook Telegram recibido pero app.telegram.bot-token está vacío; no se procesa el update.");
            return ResponseEntity.ok().build();
        }
        if (StringUtils.hasText(webhookSecret)) {
            String header = request.getHeader("X-Telegram-Bot-Api-Secret-Token");
            if (header == null || !webhookSecret.equals(header)) {
                log.warn("Webhook Telegram rechazado: cabecera X-Telegram-Bot-Api-Secret-Token no coincide con app.telegram.webhook-secret");
                return ResponseEntity.status(403).build();
            }
        }
        try {
            JsonNode update = objectMapper.readTree(rawBody != null && !rawBody.isBlank() ? rawBody : "{}");
            telegramUpdateService.handleUpdate(update);
        } catch (Exception e) {
            log.warn("Webhook Telegram: error al procesar update: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }
}

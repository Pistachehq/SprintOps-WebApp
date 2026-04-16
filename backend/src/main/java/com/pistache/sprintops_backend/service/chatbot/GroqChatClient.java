package com.pistache.sprintops_backend.service.chatbot;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GroqChatClient {

    private static final Logger log = LoggerFactory.getLogger(GroqChatClient.class);

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private static final int GROQ_MAX_RETRIES = 3;

    private static final Pattern GROQ_RETRY_AFTER_SEC = Pattern.compile("try again in ([0-9.]+)s", Pattern.CASE_INSENSITIVE);

    /** Mensaje corto para el usuario (Telegram / API); nunca incluir el JSON completo de Groq. */
    static final String RATE_LIMIT_USER_MESSAGE = """
            Límite temporal del servicio de IA (tokens por minuto en Groq). Espera 30–60 s y vuelve a intentarlo.
            Si usas Telegram, /ayuda, /estado, /misproyectos y /proyecto ID no pasan por esta IA y suelen responder al instante.""".trim();

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    public GroqChatClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param bodyJson JSON object: model, messages, tools (optional), tool_choice (optional)
     */
    public JsonNode chat(JsonNode bodyJson) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("GROQ_API_KEY no configurada");
        }

        String body = objectMapper.writeValueAsString(bodyJson);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .timeout(Duration.ofSeconds(120))
                .header("Authorization", "Bearer " + apiKey.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        Exception lastFailure = null;
        for (int attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int code = resp.statusCode();
            if (code >= 200 && code < 300) {
                return objectMapper.readTree(resp.body());
            }
            String errBody = resp.body();
            log.warn("Groq HTTP {} (intento {}/{}): {}", code, attempt, GROQ_MAX_RETRIES,
                    errBody != null && errBody.length() > 2000 ? errBody.substring(0, 2000) + "…" : errBody);
            boolean rateLimited = code == 429 || code == 503;
            if (rateLimited && attempt < GROQ_MAX_RETRIES) {
                long waitMs = parseRetryAfterMs(errBody, 16_000);
                log.info("Reintentando Groq en {} ms (TPM/cuota)", waitMs);
                Thread.sleep(waitMs);
                continue;
            }
            lastFailure = new IllegalStateException(userFacingErrorMessage(code, errBody));
            break;
        }
        throw lastFailure != null ? lastFailure : new IllegalStateException("Groq: sin respuesta");
    }

    /** Groq suele incluir "try again in 19.5s" en el JSON de error 429. */
    static long parseRetryAfterMs(String errorBody, long defaultMs) {
        if (errorBody == null) {
            return defaultMs;
        }
        Matcher m = GROQ_RETRY_AFTER_SEC.matcher(errorBody);
        if (!m.find()) {
            return defaultMs;
        }
        try {
            double sec = Double.parseDouble(m.group(1));
            long ms = (long) (sec * 1000.0) + 400L;
            return Math.min(22_000L, Math.max(800L, ms));
        } catch (NumberFormatException e) {
            return defaultMs;
        }
    }

    private String userFacingErrorMessage(int httpStatus, String responseBody) {
        if (httpStatus == 429) {
            return RATE_LIMIT_USER_MESSAGE;
        }
        if (responseBody == null || responseBody.isBlank()) {
            return "El servicio de IA respondió con error HTTP " + httpStatus + ". Inténtalo de nuevo en un momento.";
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode err = root.path("error");
            String code = err.path("code").asText("");
            String msg = err.path("message").asText("");
            if ("rate_limit_exceeded".equals(code) || "tokens".equals(err.path("type").asText(""))) {
                return RATE_LIMIT_USER_MESSAGE;
            }
            if (!msg.isEmpty()) {
                String shortMsg = msg.length() > 280 ? msg.substring(0, 277) + "…" : msg;
                return "No pude completar la petición a la IA (" + httpStatus + "): " + shortMsg;
            }
        } catch (Exception ignored) {
            // usar mensaje genérico
        }
        return "El servicio de IA no está disponible ahora (HTTP " + httpStatus + "). Reintenta en unos segundos.";
    }

    public String getModel() {
        return model;
    }
}

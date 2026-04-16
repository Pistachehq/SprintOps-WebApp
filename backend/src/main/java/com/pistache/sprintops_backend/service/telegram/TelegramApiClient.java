package com.pistache.sprintops_backend.service.telegram;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class TelegramApiClient {

    private static final Logger log = LoggerFactory.getLogger(TelegramApiClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    public boolean isConfigured() {
        return StringUtils.hasText(botToken);
    }

    public void sendMessage(long chatId, String text) {
        if (!isConfigured()) {
            return;
        }
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ObjectNode body = objectMapper.createObjectNode();
        body.put("chat_id", chatId);
        body.put("text", truncate(text, 4090));
        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (HttpStatusCodeException e) {
            log.warn("Telegram sendMessage falló: {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.warn("Telegram sendMessage falló: {}", e.getMessage());
        }
    }

    /** Teclado para que el usuario pulse y comparta contacto (teléfono opcional). */
    public void sendContactRequestKeyboard(long chatId, String text) {
        if (!isConfigured()) {
            return;
        }
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("chat_id", chatId);
            body.put("text", truncate(text, 4090));
            JsonNode keyboard = objectMapper.readTree(
                    "{\"keyboard\":[[{\"text\":\"Compartir mi número\",\"request_contact\":true}]],"
                            + "\"one_time_keyboard\":true,\"resize_keyboard\":true}");
            body.set("reply_markup", keyboard);
            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            log.warn("Telegram sendContactRequestKeyboard falló: {}", e.getMessage());
        }
    }

    public void removeKeyboard(long chatId, String text) {
        if (!isConfigured()) {
            return;
        }
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ObjectNode body = objectMapper.createObjectNode();
        body.put("chat_id", chatId);
        body.put("text", truncate(text, 4090));
        ObjectNode removeKb = objectMapper.createObjectNode();
        removeKb.put("remove_keyboard", true);
        body.set("reply_markup", removeKb);
        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            log.warn("Telegram removeKeyboard falló: {}", e.getMessage());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}

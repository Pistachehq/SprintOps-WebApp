package com.pistache.sprintops_backend.service.chatbot;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class GroqChatClient {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            throw new IllegalStateException("Groq HTTP " + resp.statusCode() + ": " + resp.body());
        }
        return objectMapper.readTree(resp.body());
    }

    public String getModel() {
        return model;
    }
}

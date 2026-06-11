package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.service.springai.RagInsightService;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reto D4 — Spring AI + Google Gemini (equivalente al GenAIChatController del PDF).
 * Rutas bajo /api/ai para pasar por el mismo Load Balancer/nginx que el resto del backend.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class GenAIChatController {

    @Autowired(required = false)
    private GoogleGenAiChatModel chatModel;

    private final RagInsightService ragInsightService;

    public GenAIChatController(RagInsightService ragInsightService) {
        this.ragInsightService = ragInsightService;
    }

    @GetMapping("/generate")
    public ResponseEntity<?> generate(
            @RequestParam(value = "message", defaultValue = "Cuéntame un chiste corto sobre Scrum") String message) {
        if (chatModel == null) {
            return notConfigured();
        }
        String generation = chatModel.call(message);
        return ResponseEntity.ok(Map.of("generation", generation));
    }

    @GetMapping(value = "/generateStream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<String>> generateStream(
            @RequestParam(value = "message", defaultValue = "Cuéntame un chiste corto sobre Scrum") String message) {
        if (chatModel == null) {
            return ResponseEntity.status(503).body(Flux.just("error: Spring AI no configurado (GOOGLE_GENAI_API_KEY)\n"));
        }
        Prompt prompt = new Prompt(new UserMessage(message));
        Flux<String> lines = chatModel.stream(prompt)
                .map(GenAIChatController::extractText)
                .filter(s -> !s.isEmpty());
        return ResponseEntity.ok(lines);
    }

  /**
   * RAG: busca contexto en rag_insight (VECTOR en Oracle) y pregunta a Gemini.
   */
    @GetMapping("/rag-chat")
    public ResponseEntity<?> ragChat(
            @RequestParam("message") String message,
            @RequestParam(value = "projectId", required = false) Integer projectId,
            @RequestParam(value = "topK", defaultValue = "3") int topK) {
        if (chatModel == null) {
            return notConfigured();
        }
        var hits = ragInsightService.search(message, projectId, topK);
        String context = hits.stream()
                .map(h -> "- " + h.description())
                .collect(Collectors.joining("\n"));
        if (context.isBlank()) {
            context = "(sin documentos indexados aún)";
        }
        String augmented = """
                Eres un asistente de SprintOps. Usa SOLO el contexto siguiente para responder en español.
                Si no hay datos suficientes, dilo claramente.

                Contexto RAG:
                %s

                Pregunta del usuario: %s
                """.formatted(context, message);
        String generation = chatModel.call(augmented);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("generation", generation);
        body.put("ragHits", hits);
        body.put("vectorSearch", ragInsightService.isVectorRagAvailable());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("chatModelConfigured", chatModel != null);
        m.put("vectorRagAvailable", ragInsightService.isVectorRagAvailable());
        return m;
    }

    private static String extractText(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return "";
        }
        String text = response.getResult().getOutput().getText();
        return text != null ? text : "";
    }

    private static ResponseEntity<Map<String, String>> notConfigured() {
        return ResponseEntity.status(503).body(Map.of(
                "error", "Spring AI no configurado. Define GOOGLE_GENAI_API_KEY (K8s secret o application-local.properties).",
                "docs", "https://aistudio.google.com/"));
    }
}

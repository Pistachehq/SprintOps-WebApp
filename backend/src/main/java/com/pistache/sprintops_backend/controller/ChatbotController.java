package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.chatbot.ChatbotMessageRequest;
import com.pistache.sprintops_backend.dto.chatbot.ChatbotMessageResponse;
import com.pistache.sprintops_backend.service.chatbot.ChatbotOrchestrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private ChatbotOrchestrationService chatbotOrchestrationService;

    @PostMapping("/message")
    public ResponseEntity<?> message(@RequestBody ChatbotMessageRequest req) {
        if (req.getProjectId() == null || req.getUserId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "projectId y userId son obligatorios"));
        }
        if (!chatbotOrchestrationService.isProjectMember(req.getUserId(), req.getProjectId())) {
            return ResponseEntity.status(403).body(Map.of("error", "No eres miembro de este proyecto"));
        }
        try {
            String reply = chatbotOrchestrationService.handle(req);
            return ResponseEntity.ok(new ChatbotMessageResponse(reply));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error del asistente: " + e.getMessage()));
        }
    }
}

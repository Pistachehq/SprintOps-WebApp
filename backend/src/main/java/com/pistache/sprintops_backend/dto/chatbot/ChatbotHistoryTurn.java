package com.pistache.sprintops_backend.dto.chatbot;

import lombok.Data;

@Data
public class ChatbotHistoryTurn {
    /** "user" or "assistant" */
    private String role;
    private String content;
}

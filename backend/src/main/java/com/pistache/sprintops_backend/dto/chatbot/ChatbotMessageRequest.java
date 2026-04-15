package com.pistache.sprintops_backend.dto.chatbot;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class ChatbotMessageRequest {
    private Integer projectId;
    private Integer userId;
    private String message;
    private List<ChatbotHistoryTurn> history = new ArrayList<>();
}

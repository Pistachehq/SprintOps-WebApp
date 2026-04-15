package com.pistache.sprintops_backend.dto;

import lombok.Data;

@Data
public class VerifyEmailRequest {
    private String token;
}

package com.pistache.sprintops_backend.dto;

import lombok.Data;

@Data
public class MiembroEquipoDTO {
    private Integer userId;
    private String name;
    private String email;
    private String role;
    private String avatarUrl;
}

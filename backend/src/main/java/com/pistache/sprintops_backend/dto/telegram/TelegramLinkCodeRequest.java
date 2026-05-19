package com.pistache.sprintops_backend.dto.telegram;

import lombok.Data;

@Data
public class TelegramLinkCodeRequest {
    private Integer userId;
    /** Opcional: al vincular, activa este proyecto si el usuario es miembro (enlace con contexto). */
    private Integer projectId;
}

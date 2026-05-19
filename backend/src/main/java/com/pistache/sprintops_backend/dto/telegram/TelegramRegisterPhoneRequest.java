package com.pistache.sprintops_backend.dto.telegram;

import lombok.Data;

@Data
public class TelegramRegisterPhoneRequest {
    private Integer userId;
    /** Con lada internacional, ej. +52 55 1234 5678 */
    private String phone;
    /** Opcional: al vincular, activar este proyecto si eres miembro. */
    private Integer projectId;
}

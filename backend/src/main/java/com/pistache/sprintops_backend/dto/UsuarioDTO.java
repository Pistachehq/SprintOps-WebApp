package com.pistache.sprintops_backend.dto;

import com.pistache.sprintops_backend.model.Usuario;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UsuarioDTO {
    private Integer id;
    private String name;
    private String username;
    private String email;
    private String role;
    private boolean active;
    private LocalDate fechaRegistro;
    private String avatarUrl;

    public static UsuarioDTO fromEntity(Usuario u, String role) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(u.getIdUsuario());
        dto.setName(u.getNombreUsuario());
        dto.setUsername(u.getNombreUsuario());
        dto.setEmail(u.getEmailUsuario());
        dto.setRole(role != null ? role : "developer");
        dto.setActive("1".equals(u.getActivoUsuario()));
        dto.setFechaRegistro(u.getFechaRegistroUsuario());
        dto.setAvatarUrl(u.getAvatarUrl());
        return dto;
    }
}

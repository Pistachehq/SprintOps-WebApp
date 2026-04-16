package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByEmailUsuario(String emailUsuario);
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    Optional<Usuario> findByVerificacionToken(String verificacionToken);
    Optional<Usuario> findByTelegramUserId(Long telegramUserId);
    List<Usuario> findByActivoUsuario(String activo);

    List<Usuario> findByTelegramUserIdIsNullAndTelefonoVinculoNormIsNotNull();

    Optional<Usuario> findByTelefonoVinculoNorm(String telefonoVinculoNorm);
}

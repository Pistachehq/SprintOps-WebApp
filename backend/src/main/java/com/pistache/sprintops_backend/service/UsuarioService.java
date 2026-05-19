package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> findById(Integer id) {
        return usuarioRepository.findById(id);
    }

    public Optional<Usuario> findByEmailUsuario(String email) {
        return usuarioRepository.findByEmailUsuario(email);
    }

    public Optional<Usuario> findByVerificacionToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return usuarioRepository.findByVerificacionToken(token.trim());
    }

    public Optional<Usuario> findByNombreUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario);
    }

    public List<Usuario> findByActivoUsuario(String activo) {
        return usuarioRepository.findByActivoUsuario(activo);
    }

    public Usuario save(Usuario usuario) {
        if (usuario.getPasswordHash() != null && !usuario.getPasswordHash().startsWith("$2a$")) {
            usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        }
        return usuarioRepository.save(usuario);
    }

    public void deleteById(Integer id) {
        usuarioRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return usuarioRepository.existsById(id);
    }
}

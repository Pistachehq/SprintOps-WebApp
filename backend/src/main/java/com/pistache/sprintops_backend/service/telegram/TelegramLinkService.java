package com.pistache.sprintops_backend.service.telegram;

import com.pistache.sprintops_backend.model.TelegramCodigoVinculo;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.TelegramCodigoVinculoRepository;
import com.pistache.sprintops_backend.repository.UsuarioRepository;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.util.PhoneNormalize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class TelegramLinkService {

    private static final int CODE_LEN = 8;
    private static final int EXPIRE_MINUTES = 15;
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final SecureRandom random = new SecureRandom();

    @Autowired
    private TelegramCodigoVinculoRepository codigoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private TelegramProjectContextService projectContextService;

    /**
     * Guarda el teléfono (mismo que compartirás en Telegram) antes de usar /vincular en el bot.
     */
    @Transactional
    public void registerPhoneForVinculo(Integer userId, String phoneRaw, Integer proyectoPendiente) {
        if (userId == null || !usuarioRepository.existsById(userId)) {
            throw new IllegalArgumentException("Usuario no válido");
        }
        String norm = PhoneNormalize.digitsOnly(phoneRaw);
        if (norm.length() < 8) {
            throw new IllegalArgumentException("Introduce un número válido con lada (ej. +52…).");
        }
        if (proyectoPendiente != null && !projectContextService.puedeVerProyecto(userId, proyectoPendiente)) {
            throw new IllegalArgumentException("No tienes acceso a ese proyecto.");
        }
        Optional<Usuario> sameNorm = usuarioRepository.findByTelefonoVinculoNorm(norm);
        if (sameNorm.isPresent() && !sameNorm.get().getIdUsuario().equals(userId)) {
            throw new IllegalArgumentException("Ese número ya está asociado a otra cuenta SprintOps.");
        }
        Usuario u = usuarioRepository.findById(userId).orElseThrow();
        if (u.getTelegramUserId() != null) {
            throw new IllegalArgumentException("Tu cuenta ya está vinculada a Telegram.");
        }
        u.setTelefonoVinculoNorm(norm);
        u.setTelegramProyectoPendiente(proyectoPendiente);
        usuarioService.save(u);
    }

    /**
     * Completa el vínculo cuando Telegram envía el contacto: coincide con {@link #registerPhoneForVinculo}.
     */
    @Transactional
    public String linkByTelegramPhone(Long telegramUserId, String phoneFromContact) {
        if (telegramUserId == null) {
            return "No se pudo leer tu cuenta de Telegram.";
        }
        String incoming = PhoneNormalize.digitsOnly(phoneFromContact);
        if (incoming.length() < 8) {
            return "No se recibió un número válido. Intenta de nuevo.";
        }
        List<Usuario> pending = usuarioRepository.findByTelegramUserIdIsNullAndTelefonoVinculoNormIsNotNull();
        Usuario match = null;
        for (Usuario u : pending) {
            if (PhoneNormalize.sameNumber(u.getTelefonoVinculoNorm(), incoming)) {
                if (match != null) {
                    return "Hay más de una cuenta con un número parecido. Pon en la web el número completo con lada internacional.";
                }
                match = u;
            }
        }
        if (match == null) {
            return "No hay ninguna cuenta SprintOps esperando este número. Entra en la app, sección Telegram, "
                    + "guarda tu teléfono (el mismo que compartes aquí) y vuelve a intentar.";
        }
        return finalizeLink(telegramUserId, match, incoming);
    }

    private String finalizeLink(Long telegramUserId, Usuario target, String phoneDigitsFromTelegram) {
        Optional<Usuario> porTelegram = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (porTelegram.isPresent()
                && !porTelegram.get().getIdUsuario().equals(target.getIdUsuario())) {
            return "Esta cuenta de Telegram ya está vinculada a otro usuario SprintOps.";
        }
        if (target.getTelegramUserId() != null
                && !target.getTelegramUserId().equals(telegramUserId)) {
            return "Tu cuenta SprintOps ya tiene otra cuenta de Telegram. Usa /desvincular primero.";
        }
        target.setTelegramUserId(telegramUserId);
        target.setTelegramPhone(phoneDigitsFromTelegram);
        Integer pend = target.getTelegramProyectoPendiente();
        if (pend != null && projectContextService.puedeVerProyecto(target.getIdUsuario(), pend)) {
            target.setTelegramProyectoId(pend);
        }
        target.setTelefonoVinculoNorm(null);
        target.setTelegramProyectoPendiente(null);
        usuarioService.save(target);
        String msg = "Listo. Tu Telegram quedó vinculado a SprintOps (usuario «"
                + (target.getNombreUsuario() != null ? target.getNombreUsuario() : ("id " + target.getIdUsuario()))
                + "»).";
        if (target.getTelegramProyectoId() != null) {
            msg += " Proyecto activo: id " + target.getTelegramProyectoId() + ".";
        } else {
            msg += " Elige proyecto con /proyecto o /misproyectos.";
        }
        return msg;
    }

    /** Genera un código de un solo uso (alternativa avanzada). */
    @Transactional
    public String generateLinkCode(Integer userId, Integer proyectoSugeridoId) {
        if (userId == null || !usuarioRepository.existsById(userId)) {
            throw new IllegalArgumentException("Usuario no válido");
        }
        for (int attempt = 0; attempt < 12; attempt++) {
            String code = randomCode();
            TelegramCodigoVinculo row = new TelegramCodigoVinculo();
            row.setCodigo(code);
            row.setIdUsuario(userId);
            row.setProyectoSugeridoId(proyectoSugeridoId);
            row.setExpira(Instant.now().plus(EXPIRE_MINUTES, ChronoUnit.MINUTES));
            row.setUsado(false);
            try {
                codigoRepository.save(row);
                return code;
            } catch (DataIntegrityViolationException e) {
                // colisión de código; reintentar
            }
        }
        throw new IllegalStateException("No se pudo generar un código; reintenta.");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LEN);
        for (int i = 0; i < CODE_LEN; i++) {
            sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    public static String normalizeCode(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim().toUpperCase();
        if (s.startsWith("LINK_")) {
            s = s.substring(5);
        }
        return s;
    }

    /**
     * Vincula el id de Telegram al usuario del código. Devuelve mensaje listo para mostrar al usuario.
     */
    @Transactional
    public String linkTelegramUser(Long telegramUserId, String rawCode) {
        if (telegramUserId == null) {
            return "No se pudo leer tu cuenta de Telegram.";
        }
        String code = normalizeCode(rawCode);
        if (code.length() < 4) {
            return "Código inválido. En la web (perfil) pulsa «Generar código» y escribe aquí: /vincular CODIGO";
        }
        Optional<TelegramCodigoVinculo> opt = codigoRepository.findByCodigoAndUsadoFalse(code);
        if (opt.isEmpty()) {
            return "Código inválido o ya usado. Genera uno nuevo en la web.";
        }
        TelegramCodigoVinculo row = opt.get();
        if (row.getExpira().isBefore(Instant.now())) {
            return "Este código caducó. Genera otro en la web.";
        }

        Optional<Usuario> porTelegram = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (porTelegram.isPresent()
                && !porTelegram.get().getIdUsuario().equals(row.getIdUsuario())) {
            return "Esta cuenta de Telegram ya está vinculada a otro usuario SprintOps.";
        }

        Optional<Usuario> targetOpt = usuarioRepository.findById(row.getIdUsuario());
        if (targetOpt.isEmpty()) {
            return "Error interno: usuario no encontrado.";
        }
        Usuario target = targetOpt.get();
        if (target.getTelegramUserId() != null
                && !target.getTelegramUserId().equals(telegramUserId)) {
            return "Tu cuenta SprintOps ya tiene otra cuenta de Telegram. Escribe /desvincular desde la cuenta antigua o contacta al administrador.";
        }

        target.setTelegramUserId(telegramUserId);
        Integer sugerido = row.getProyectoSugeridoId();
        if (sugerido != null && projectContextService.puedeVerProyecto(target.getIdUsuario(), sugerido)) {
            target.setTelegramProyectoId(sugerido);
        }
        target.setTelefonoVinculoNorm(null);
        target.setTelegramProyectoPendiente(null);
        usuarioService.save(target);
        row.setUsado(true);
        codigoRepository.save(row);

        String msg = "Listo. Tu Telegram quedó vinculado a SprintOps (usuario «"
                + (target.getNombreUsuario() != null ? target.getNombreUsuario() : ("id " + target.getIdUsuario()))
                + "»).";
        if (target.getTelegramProyectoId() != null) {
            msg += " Proyecto activo: id " + target.getTelegramProyectoId() + ".";
        } else {
            msg += " Elige proyecto con /proyecto o /misproyectos.";
        }
        return msg;
    }

    @Transactional
    public void unlinkTelegram(Long telegramUserId) {
        if (telegramUserId == null) {
            return;
        }
        usuarioRepository.findByTelegramUserId(telegramUserId).ifPresent(u -> {
            u.setTelegramUserId(null);
            u.setTelegramPhone(null);
            u.setTelegramProyectoId(null);
            u.setTelefonoVinculoNorm(null);
            u.setTelegramProyectoPendiente(null);
            usuarioService.save(u);
        });
    }
}

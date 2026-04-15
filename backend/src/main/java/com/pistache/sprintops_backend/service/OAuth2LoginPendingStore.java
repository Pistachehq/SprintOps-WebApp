package com.pistache.sprintops_backend.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Código de un solo uso para completar el login OAuth en el SPA (sin cookie de sesión en el front).
 */
@Component
public class OAuth2LoginPendingStore {

    private static final int TTL_SECONDS = 300;

    private final Map<String, Pending> pending = new ConcurrentHashMap<>();

    public String register(Integer userId) {
        sweepExpired();
        String code = UUID.randomUUID().toString();
        pending.put(code, new Pending(userId, Instant.now().plusSeconds(TTL_SECONDS)));
        return code;
    }

    public Optional<Integer> consume(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        Pending p = pending.remove(code.trim());
        if (p == null || Instant.now().isAfter(p.expiresAt())) {
            return Optional.empty();
        }
        return Optional.of(p.userId());
    }

    private void sweepExpired() {
        if (pending.size() < 500) {
            return;
        }
        Instant now = Instant.now();
        pending.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }

    private record Pending(Integer userId, Instant expiresAt) {}
}

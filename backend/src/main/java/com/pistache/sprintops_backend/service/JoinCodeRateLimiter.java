package com.pistache.sprintops_backend.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tras varios códigos que no existen, bloquea nuevos intentos un rato.
 * Parecido a Google Classroom: el código incorrecto avisa, y insistir cierra la puerta.
 */
@Service
public class JoinCodeRateLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK = Duration.ofMinutes(15);

    public static final String UNKNOWN_CODE =
            "El código introducido no corresponde a un proyecto registrado, inténtalo nuevamente.";

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Optional<Duration> lockRemaining(String key) {
        Bucket bucket = buckets.get(key);
        if (bucket == null) return Optional.empty();
        synchronized (bucket) {
            if (bucket.lockedUntil == null) return Optional.empty();
            Instant now = Instant.now();
            if (!bucket.lockedUntil.isAfter(now)) {
                bucket.lockedUntil = null;
                bucket.failures.clear();
                return Optional.empty();
            }
            return Optional.of(Duration.between(now, bucket.lockedUntil));
        }
    }

    public void recordFailure(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> new Bucket());
        synchronized (bucket) {
            Instant now = Instant.now();
            if (bucket.lockedUntil != null && bucket.lockedUntil.isAfter(now)) return;
            Instant cutoff = now.minus(WINDOW);
            while (!bucket.failures.isEmpty() && bucket.failures.peekFirst().isBefore(cutoff)) {
                bucket.failures.removeFirst();
            }
            bucket.failures.addLast(now);
            if (bucket.failures.size() >= MAX_FAILURES) {
                bucket.lockedUntil = now.plus(LOCK);
                bucket.failures.clear();
            }
        }
    }

    public void reset(String key) {
        buckets.remove(key);
    }

    public static String lockMessage(Duration remaining) {
        long seconds = Math.max(1, remaining.getSeconds());
        long minutes = (seconds + 59) / 60;
        String unit = minutes == 1 ? "minuto" : "minutos";
        return "Demasiados intentos fallidos. Podrás volver a unirte en " + minutes + " " + unit + ".";
    }

    public static String attemptKey(Integer userId) {
        return userId != null ? "user:" + userId : "anon";
    }

    private static final class Bucket {
        private final Deque<Instant> failures = new ArrayDeque<>();
        private Instant lockedUntil;
    }
}

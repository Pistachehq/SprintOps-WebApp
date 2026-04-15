package com.pistache.sprintops_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
public class ProyectoCardCoverService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    @Value("${app.project-card-cover-dir:uploads/project-card-covers}")
    private String uploadDir;

    private Path directory() throws IOException {
        Path p = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(p);
        return p;
    }

    private Path fileForProject(int projectId) throws IOException {
        return directory().resolve(projectId + ".cover");
    }

    public boolean fileExists(int projectId) {
        try {
            return Files.isRegularFile(fileForProject(projectId));
        } catch (IOException e) {
            return false;
        }
    }

    public void save(int projectId, InputStream inputStream, long maxBytes, String contentType) throws IOException {
        String normalizedType = contentType != null ? contentType.toLowerCase(Locale.ROOT).split(";")[0].trim() : "";
        if (!ALLOWED_TYPES.contains(normalizedType)) {
            throw new IllegalArgumentException("Tipo de imagen no permitido");
        }
        Path target = fileForProject(projectId);
        long written = 0;
        try (OutputStream out = Files.newOutputStream(target)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = inputStream.read(buf)) >= 0) {
                written += n;
                if (written > maxBytes) {
                    Files.deleteIfExists(target);
                    throw new IllegalArgumentException("Imagen demasiado grande");
                }
                out.write(buf, 0, n);
            }
        }
    }

    public Optional<byte[]> load(int projectId) throws IOException {
        Path p = fileForProject(projectId);
        if (!Files.isRegularFile(p)) {
            return Optional.empty();
        }
        return Optional.of(Files.readAllBytes(p));
    }

    public void delete(int projectId) throws IOException {
        Files.deleteIfExists(fileForProject(projectId));
    }
}

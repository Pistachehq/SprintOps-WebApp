package com.pistache.sprintops_backend.util;

import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;

/**
 * Resolución tolerante de tipo MIME para subidas de imagen (p. ej. HEIC desde iPhone
 * con content-type vacío o application/octet-stream).
 */
public final class ImageUploadSupport {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/heic",
            "image/heif");

    private ImageUploadSupport() {
    }

    public static String resolveContentType(MultipartFile file) {
        if (file == null) {
            return "";
        }
        String fromHeader = normalize(file.getContentType());
        if (isKnownImageType(fromHeader)) {
            return fromHeader;
        }
        String fromName = contentTypeFromFilename(file.getOriginalFilename());
        if (isKnownImageType(fromName)) {
            return fromName;
        }
        if (!fromHeader.isBlank() && fromHeader.startsWith("image/")) {
            return fromHeader;
        }
        return fromName.isBlank() ? fromHeader : fromName;
    }

    public static boolean isAllowed(MultipartFile file) {
        String resolved = resolveContentType(file);
        if (resolved.isBlank()) {
            return false;
        }
        if (isKnownImageType(resolved)) {
            return true;
        }
        return resolved.startsWith("image/");
    }

    private static String normalize(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "";
        }
        return contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
    }

    private static boolean isKnownImageType(String contentType) {
        return contentType != null && !contentType.isBlank() && ALLOWED_TYPES.contains(contentType);
    }

    private static String contentTypeFromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".heic")) {
            return "image/heic";
        }
        if (lower.endsWith(".heif")) {
            return "image/heif";
        }
        return "";
    }
}

package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.DailyMeetingFoto;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.DailyMeetingFotoRepository;
import com.pistache.sprintops_backend.service.ProyectoPermissionCheckService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/timeline")
@CrossOrigin(origins = "*")
public class ProyectoTimelineController {

    public static final String PERM_UPLOAD_DAILY_PHOTO = "canUploadDailyPhoto";

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private DailyMeetingFotoRepository dailyMeetingFotoRepository;
    @Autowired
    private ProyectoPermissionCheckService proyectoPermissionCheckService;
    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/fotos")
    public ResponseEntity<List<String>> listFotoFechas(@PathVariable Integer proyectoId) {
        if (proyectoService.findById(proyectoId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<String> fechas = dailyMeetingFotoRepository.findByProyecto_IdProyectoOrderByFechaFotoAsc(proyectoId)
                .stream()
                .map(f -> f.getFechaFoto().toString())
                .collect(Collectors.toList());
        return ResponseEntity.ok(fechas);
    }

    @GetMapping("/foto/{fecha}")
    public ResponseEntity<byte[]> getFoto(@PathVariable Integer proyectoId, @PathVariable String fecha) {
        if (proyectoService.findById(proyectoId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        LocalDate d;
        try {
            d = LocalDate.parse(fecha);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        Optional<DailyMeetingFoto> opt = dailyMeetingFotoRepository.findByProyecto_IdProyectoAndFechaFoto(proyectoId, d);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DailyMeetingFoto f = opt.get();
        String ct = f.getContentType() != null ? f.getContentType() : MediaType.IMAGE_JPEG_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, ct)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(f.getImagen());
    }

    @PostMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFoto(
            @PathVariable Integer proyectoId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("fecha") String fechaStr,
            @RequestParam("userId") Integer userId) {
        Optional<Proyecto> optP = proyectoService.findById(proyectoId);
        if (optP.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (userId == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "userId requerido"));
        }
        if (!proyectoPermissionCheckService.memberHasPermission(userId, proyectoId, PERM_UPLOAD_DAILY_PHOTO)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("error", "Sin permiso para subir fotos del daily meeting"));
        }
        LocalDate fecha;
        try {
            fecha = LocalDate.parse(fechaStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "fecha inválida"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "archivo vacío"));
        }
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED_IMAGE_TYPES.contains(ct)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Solo imágenes JPEG, PNG, WebP o GIF"));
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "No se pudo leer el archivo"));
        }
        if (bytes.length == 0) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "archivo vacío"));
        }
        Proyecto proyecto = optP.get();
        Optional<Usuario> uploader = usuarioService.findById(userId);
        DailyMeetingFoto entity = dailyMeetingFotoRepository
                .findByProyecto_IdProyectoAndFechaFoto(proyectoId, fecha)
                .orElseGet(DailyMeetingFoto::new);
        entity.setProyecto(proyecto);
        entity.setFechaFoto(fecha);
        entity.setImagen(bytes);
        entity.setContentType(ct);
        uploader.ifPresent(entity::setSubidoPor);
        dailyMeetingFotoRepository.save(entity);
        return ResponseEntity.ok(java.util.Map.of("ok", true, "fecha", fecha.toString()));
    }

    @DeleteMapping("/foto/{fecha}")
    public ResponseEntity<?> deleteFoto(
            @PathVariable Integer proyectoId,
            @PathVariable String fecha,
            @RequestParam("userId") Integer userId) {
        if (proyectoService.findById(proyectoId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (userId == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "userId requerido"));
        }
        if (!proyectoPermissionCheckService.memberHasPermission(userId, proyectoId, PERM_UPLOAD_DAILY_PHOTO)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("error", "Sin permiso para eliminar fotos del daily meeting"));
        }
        LocalDate d;
        try {
            d = LocalDate.parse(fecha);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "fecha inválida"));
        }
        dailyMeetingFotoRepository.findByProyecto_IdProyectoAndFechaFoto(proyectoId, d)
                .ifPresent(dailyMeetingFotoRepository::delete);
        return ResponseEntity.noContent().build();
    }
}

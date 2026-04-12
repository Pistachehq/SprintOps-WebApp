package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.TimelineFoto;
import com.pistache.sprintops_backend.repository.TimelineFotoRepository;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/timeline")
@CrossOrigin(origins = "*")
public class TimelineController {

    @Autowired
    private TimelineFotoRepository timelineFotoRepository;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/foto/{projectId}/{fecha}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Integer projectId, @PathVariable String fecha) {
        LocalDate date = LocalDate.parse(fecha);
        var opt = timelineFotoRepository.findByProyectoIdProyectoAndFecha(projectId, date);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TimelineFoto foto = opt.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(foto.getContentType()));
        headers.setCacheControl(CacheControl.noCache().getHeaderValue());
        return new ResponseEntity<>(foto.getImagen(), headers, HttpStatus.OK);
    }

    @PostMapping("/foto/{projectId}")
    public ResponseEntity<?> uploadPhoto(
            @PathVariable Integer projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("fecha") String fechaStr,
            @RequestParam("userId") Integer userId) {
        try {
            LocalDate fecha = LocalDate.parse(fechaStr);
            var optProject = proyectoService.findById(projectId);
            if (optProject.isEmpty()) {
                return ResponseEntity.badRequest().body("Proyecto no encontrado");
            }

            var existing = timelineFotoRepository.findByProyectoIdProyectoAndFecha(projectId, fecha);
            TimelineFoto foto = existing.orElse(new TimelineFoto());
            foto.setProyecto(optProject.get());
            foto.setFecha(fecha);
            foto.setImagen(file.getBytes());
            foto.setContentType(file.getContentType());
            usuarioService.findById(userId).ifPresent(foto::setUploadedBy);

            timelineFotoRepository.save(foto);
            return ResponseEntity.ok().body("{\"success\": true}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar foto: " + e.getMessage());
        }
    }

    @DeleteMapping("/foto/{projectId}/{fecha}")
    @Transactional
    public ResponseEntity<Void> deletePhoto(@PathVariable Integer projectId, @PathVariable String fecha) {
        LocalDate date = LocalDate.parse(fecha);
        timelineFotoRepository.deleteByProyectoIdProyectoAndFecha(projectId, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/foto/{projectId}/dates")
    public ResponseEntity<List<String>> getPhotoDates(@PathVariable Integer projectId) {
        List<LocalDate> dates = timelineFotoRepository.findDatesByProjectId(projectId);
        List<String> dateStrings = dates.stream().map(LocalDate::toString).toList();
        return ResponseEntity.ok(dateStrings);
    }
}

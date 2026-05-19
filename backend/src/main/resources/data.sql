-- ============================================
-- SprintOps seed mínimo (referencia + usuarios de prueba)
-- Proyectos, equipos, sprints e issues: se crean desde la app / API.
-- ============================================

-- Roles (system = base roles available in all projects)
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (1, 'Developer', true);
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (2, 'Scrum Master', true);
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (3, 'Product Owner', true);

-- Users (password: 123)
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (1, 'axel', 'axel@example.com', '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.', '2026-04-01', '1');
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (2, 'sm', 'sm@example.com', '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.', '2026-04-01', '1');
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (3, 'po', 'po@example.com', '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.', '2026-04-01', '1');

-- Permisos (Permissions) — project-scoped, applied per role within a project
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (1, 'canCreateSprint', 'Crear sprints');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (2, 'canCreateIssue', 'Crear issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (3, 'canEditIssue', 'Editar issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (4, 'canManageMembers', 'Gestionar miembros del equipo');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (5, 'canViewMetrics', 'Ver métricas del proyecto');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (6, 'canViewOnlyOwnIssues', 'Ver solo tus propios issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (7, 'canViewAllIssues', 'Ver issues de todo el equipo');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (8, 'canEditProjectDates', 'Modificar fechas del proyecto');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (9, 'canUploadDailyPhoto', 'Subir o eliminar fotos del daily meeting en el cronograma');

-- Role-Permission assignments (tabla_permisos)
-- Developer: canCreateIssue, canEditIssue, canViewOnlyOwnIssues
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (1, 2);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (1, 3);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (1, 6);

-- Scrum Master: canCreateSprint, canCreateIssue, canEditIssue, canManageMembers, canViewMetrics, canViewAllIssues
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 1);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 2);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 3);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 4);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 5);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 7);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 8);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 1);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 2);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 3);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 4);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 5);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 7);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 8);

-- Scrum Master y Product Owner: subir fotos del daily en cronograma
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (2, 9);
INSERT IGNORE INTO tabla_permisos (Rol_id_rol, Permiso_id_permiso) VALUES (3, 9);

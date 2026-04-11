-- ============================================
-- SprintOps Seed Data
-- ============================================

-- Roles (system = base roles available in all projects)
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (1, 'Developer', true);
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (2, 'Scrum Master', true);
INSERT IGNORE INTO rol (id_rol, nombre_rol, sistema) VALUES (3, 'Product Owner', true);

-- Users (password: 123)
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (1, 'axel', 'axel@example.com', '123', '2026-04-01', '1');
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (2, 'sm', 'sm@example.com', '123', '2026-04-01', '1');
INSERT IGNORE INTO usuario (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
VALUES (3, 'po', 'po@example.com', '123', '2026-04-01', '1');

-- Equipos
INSERT IGNORE INTO equipo (id_equipo, nombre_equipo, descripcion, fecha_creacion_equipo)
VALUES (1, 'Equipo Oracle ChatBot', 'Equipo del proyecto Oracle ChatBot', '2026-04-01');
INSERT IGNORE INTO equipo (id_equipo, nombre_equipo, descripcion, fecha_creacion_equipo)
VALUES (2, 'Equipo Legacy Migration', 'Equipo del proyecto Legacy System Migration', '2026-03-01');

-- Projects
INSERT IGNORE INTO proyecto (id_proyecto, nombre_proyecto, codigo_proyecto, descripcion_proyecto, fecha_inicio_proyecto, fecha_fin_proyecto, estado_del_proyecto, Equipo_id_equipo, creador_id_usuario)
VALUES (1, 'Oracle ChatBot', '12345', 'ChatBot y web app SprintOps', '2026-04-01', '2026-04-30', 'active', 1, 3);
INSERT IGNORE INTO proyecto (id_proyecto, nombre_proyecto, codigo_proyecto, descripcion_proyecto, fecha_inicio_proyecto, fecha_fin_proyecto, estado_del_proyecto, Equipo_id_equipo, creador_id_usuario)
VALUES (2, 'Legacy System Migration', '54321', 'Migración de sistemas legados a la nube', '2026-03-01', '2026-05-30', 'active', 2, 3);

-- User-Team memberships (info_usuario_equipo)
INSERT IGNORE INTO info_usuario_equipo (Equipo_id_equipo, Usuario_id_usuario, fecha_union_equipo)
VALUES (1, 1, '2026-04-01');
INSERT IGNORE INTO info_usuario_equipo (Equipo_id_equipo, Usuario_id_usuario, fecha_union_equipo)
VALUES (1, 2, '2026-04-01');
INSERT IGNORE INTO info_usuario_equipo (Equipo_id_equipo, Usuario_id_usuario, fecha_union_equipo)
VALUES (1, 3, '2026-04-01');
INSERT IGNORE INTO info_usuario_equipo (Equipo_id_equipo, Usuario_id_usuario, fecha_union_equipo)
VALUES (2, 1, '2026-03-01');
INSERT IGNORE INTO info_usuario_equipo (Equipo_id_equipo, Usuario_id_usuario, fecha_union_equipo)
VALUES (2, 3, '2026-03-01');

-- User roles in teams (roles_de_usuarios)
INSERT IGNORE INTO roles_de_usuarios (Rol_id_rol, Equipo_id_equipo, Usuario_id_usuario)
VALUES (1, 1, 1);
INSERT IGNORE INTO roles_de_usuarios (Rol_id_rol, Equipo_id_equipo, Usuario_id_usuario)
VALUES (2, 1, 2);
INSERT IGNORE INTO roles_de_usuarios (Rol_id_rol, Equipo_id_equipo, Usuario_id_usuario)
VALUES (3, 1, 3);
INSERT IGNORE INTO roles_de_usuarios (Rol_id_rol, Equipo_id_equipo, Usuario_id_usuario)
VALUES (1, 2, 1);
INSERT IGNORE INTO roles_de_usuarios (Rol_id_rol, Equipo_id_equipo, Usuario_id_usuario)
VALUES (3, 2, 3);

-- Sprints
INSERT IGNORE INTO sprint (id_sprint, nombre_sprint, fecha_inicio_sprint, fecha_fin_sprint, objetivo_sprint, estado_del_sprint, Proyecto_id_proyecto)
VALUES (1, 'Sprint 1', '2026-04-01', '2026-04-14', 'Base funcional local', 'in_progress', 1);
INSERT IGNORE INTO sprint (id_sprint, nombre_sprint, fecha_inicio_sprint, fecha_fin_sprint, objetivo_sprint, estado_del_sprint, Proyecto_id_proyecto)
VALUES (2, 'Sprint 2', '2026-04-15', '2026-04-28', 'UI enhancements', 'planned', 1);

-- Issues (belong to project, linked to sprint via desc_issue)
INSERT IGNORE INTO issues (id_issue, titulo_issue, descripcion_issue, proposito_issue, estado_issue, prioridad_issue, story_points_issue, fecha_creacion_issue, Proyecto_id_proyecto)
VALUES (1, 'Implement login mock', 'Crear login por rol simulado', 'Permitir pruebas de flujo de autenticación sin backend real', 'done', 'high', 5, '2026-04-01', 1);
INSERT IGNORE INTO issues (id_issue, titulo_issue, descripcion_issue, proposito_issue, estado_issue, prioridad_issue, story_points_issue, fecha_creacion_issue, Proyecto_id_proyecto)
VALUES (2, 'Setup JSON DB', 'Configurar localStorage para db', 'Tener persistencia local para desarrollo frontend independiente', 'in_progress', 'high', 8, '2026-04-01', 1);
INSERT IGNORE INTO issues (id_issue, titulo_issue, descripcion_issue, proposito_issue, estado_issue, prioridad_issue, story_points_issue, fecha_creacion_issue, Proyecto_id_proyecto)
VALUES (3, 'Fix Layout bug', 'Sidebar colapsa en mobile', 'Garantizar experiencia responsive en dispositivos móviles', 'todo', 'low', 2, '2026-04-01', 1);

-- Link issues to sprints (desc_issue)
INSERT IGNORE INTO desc_issue (Sprint_id_sprint, Issues_id_issue, fecha_entrada)
VALUES (1, 1, '2026-04-01');
INSERT IGNORE INTO desc_issue (Sprint_id_sprint, Issues_id_issue, fecha_entrada)
VALUES (1, 2, '2026-04-01');
INSERT IGNORE INTO desc_issue (Sprint_id_sprint, Issues_id_issue, fecha_entrada)
VALUES (1, 3, '2026-04-01');

-- Assign issues to users (asignacion_issues)
INSERT IGNORE INTO asignacion_issues (Usuario_id_usuario, Issues_id_issue)
VALUES (1, 1);
INSERT IGNORE INTO asignacion_issues (Usuario_id_usuario, Issues_id_issue)
VALUES (1, 2);

-- Permisos (Permissions) — project-scoped, applied per role within a project
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (1, 'canCreateSprint', 'Crear sprints');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (2, 'canCreateIssue', 'Crear issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (3, 'canEditIssue', 'Editar issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (4, 'canManageMembers', 'Gestionar miembros del equipo');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (5, 'canViewMetrics', 'Ver métricas del proyecto');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (6, 'canViewOnlyOwnIssues', 'Ver solo tus propios issues');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (7, 'canViewAllIssues', 'Ver issues de todo el equipo');
INSERT IGNORE INTO permiso (id_permiso, nombre_permiso, descripcion_permisos) VALUES (8, 'canEditProjectDates', 'Modificar fechas del proyecto');

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

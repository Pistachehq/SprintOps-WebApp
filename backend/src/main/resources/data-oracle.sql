-- ============================================
-- SprintOps seed minimo (referencia + usuarios de prueba) -- Oracle
-- En Oracle no existe INSERT IGNORE. Usamos MERGE INTO ... USING DUAL para upsert idempotente.
-- ============================================

-- Roles (sistema NUMBER(1): 1=true, 0=false)
MERGE INTO rol r
USING (SELECT 1 AS id_rol, 'Developer' AS nombre_rol, 1 AS sistema FROM dual) s
ON (r.id_rol = s.id_rol)
WHEN NOT MATCHED THEN INSERT (id_rol, nombre_rol, sistema) VALUES (s.id_rol, s.nombre_rol, s.sistema);

MERGE INTO rol r
USING (SELECT 2 AS id_rol, 'Scrum Master' AS nombre_rol, 1 AS sistema FROM dual) s
ON (r.id_rol = s.id_rol)
WHEN NOT MATCHED THEN INSERT (id_rol, nombre_rol, sistema) VALUES (s.id_rol, s.nombre_rol, s.sistema);

MERGE INTO rol r
USING (SELECT 3 AS id_rol, 'Product Owner' AS nombre_rol, 1 AS sistema FROM dual) s
ON (r.id_rol = s.id_rol)
WHEN NOT MATCHED THEN INSERT (id_rol, nombre_rol, sistema) VALUES (s.id_rol, s.nombre_rol, s.sistema);

-- Usuarios (password: 123 hasheada con BCrypt)
MERGE INTO usuario u
USING (SELECT 1 AS id_usuario, 'axel' AS nombre_usuario, 'axel@example.com' AS email_usuario,
              '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.' AS password_hash,
              TO_DATE('2026-04-01','YYYY-MM-DD') AS fecha_registro_usuario, 1 AS activo_usuario FROM dual) s
ON (u.id_usuario = s.id_usuario)
WHEN NOT MATCHED THEN INSERT (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
                      VALUES (s.id_usuario, s.nombre_usuario, s.email_usuario, s.password_hash, s.fecha_registro_usuario, s.activo_usuario);

MERGE INTO usuario u
USING (SELECT 2 AS id_usuario, 'sm' AS nombre_usuario, 'sm@example.com' AS email_usuario,
              '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.' AS password_hash,
              TO_DATE('2026-04-01','YYYY-MM-DD') AS fecha_registro_usuario, 1 AS activo_usuario FROM dual) s
ON (u.id_usuario = s.id_usuario)
WHEN NOT MATCHED THEN INSERT (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
                      VALUES (s.id_usuario, s.nombre_usuario, s.email_usuario, s.password_hash, s.fecha_registro_usuario, s.activo_usuario);

MERGE INTO usuario u
USING (SELECT 3 AS id_usuario, 'po' AS nombre_usuario, 'po@example.com' AS email_usuario,
              '$2a$10$mUInZ98LeUdptvXuuAmiXupViLI2MZH7ttcbNluDsP9xcz/TwmlM.' AS password_hash,
              TO_DATE('2026-04-01','YYYY-MM-DD') AS fecha_registro_usuario, 1 AS activo_usuario FROM dual) s
ON (u.id_usuario = s.id_usuario)
WHEN NOT MATCHED THEN INSERT (id_usuario, nombre_usuario, email_usuario, password_hash, fecha_registro_usuario, activo_usuario)
                      VALUES (s.id_usuario, s.nombre_usuario, s.email_usuario, s.password_hash, s.fecha_registro_usuario, s.activo_usuario);

-- Permisos
MERGE INTO permiso p
USING (SELECT 1 AS id_permiso, 'canCreateSprint' AS nombre_permiso, 'Crear sprints' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 2 AS id_permiso, 'canCreateIssue' AS nombre_permiso, 'Crear issues' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 3 AS id_permiso, 'canEditIssue' AS nombre_permiso, 'Editar issues' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 4 AS id_permiso, 'canManageMembers' AS nombre_permiso, 'Gestionar miembros del equipo' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 5 AS id_permiso, 'canViewMetrics' AS nombre_permiso, 'Ver metricas del proyecto' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 6 AS id_permiso, 'canViewOnlyOwnIssues' AS nombre_permiso, 'Ver solo tus propios issues' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 7 AS id_permiso, 'canViewAllIssues' AS nombre_permiso, 'Ver issues de todo el equipo' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 8 AS id_permiso, 'canEditProjectDates' AS nombre_permiso, 'Modificar fechas del proyecto' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

MERGE INTO permiso p
USING (SELECT 9 AS id_permiso, 'canUploadDailyPhoto' AS nombre_permiso, 'Subir o eliminar fotos del daily meeting en el cronograma' AS descripcion_permisos FROM dual) s
ON (p.id_permiso = s.id_permiso)
WHEN NOT MATCHED THEN INSERT (id_permiso, nombre_permiso, descripcion_permisos) VALUES (s.id_permiso, s.nombre_permiso, s.descripcion_permisos);

-- Role-Permission assignments (tabla_permisos): asignaciones por rol
-- Developer (id 1): canCreateIssue (2), canEditIssue (3), canViewOnlyOwnIssues (6)
MERGE INTO tabla_permisos t
USING (SELECT 1 AS Rol_id_rol, 2 AS Permiso_id_permiso FROM dual) s
ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso)
WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);

MERGE INTO tabla_permisos t
USING (SELECT 1 AS Rol_id_rol, 3 AS Permiso_id_permiso FROM dual) s
ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso)
WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);

MERGE INTO tabla_permisos t
USING (SELECT 1 AS Rol_id_rol, 6 AS Permiso_id_permiso FROM dual) s
ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso)
WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);

-- Scrum Master (id 2): canCreateSprint(1), canCreateIssue(2), canEditIssue(3), canManageMembers(4), canViewMetrics(5), canViewAllIssues(7), canEditProjectDates(8), canUploadDailyPhoto(9)
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 1 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 2 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 3 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 4 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 5 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 7 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 8 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 2 AS Rol_id_rol, 9 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);

-- Product Owner (id 3): canCreateSprint(1), canCreateIssue(2), canEditIssue(3), canManageMembers(4), canViewMetrics(5), canViewAllIssues(7), canEditProjectDates(8), canUploadDailyPhoto(9)
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 1 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 2 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 3 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 4 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 5 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 7 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 8 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);
MERGE INTO tabla_permisos t USING (SELECT 3 AS Rol_id_rol, 9 AS Permiso_id_permiso FROM dual) s ON (t.Rol_id_rol = s.Rol_id_rol AND t.Permiso_id_permiso = s.Permiso_id_permiso) WHEN NOT MATCHED THEN INSERT (Rol_id_rol, Permiso_id_permiso) VALUES (s.Rol_id_rol, s.Permiso_id_permiso);

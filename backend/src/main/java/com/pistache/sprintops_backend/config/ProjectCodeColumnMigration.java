package com.pistache.sprintops_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Los códigos nuevos mezclan mayúsculas y minúsculas. En MySQL la comparación
 * por defecto las trata igual, así que la columna pasa a collation binaria.
 */
@Component
public class ProjectCodeColumnMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProjectCodeColumnMigration.class);
    private final DataSource dataSource;

    public ProjectCodeColumnMigration(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection()) {
            String product = connection.getMetaData().getDatabaseProductName();
            if (product == null || !product.toLowerCase().contains("mysql")) return;
            try (var statement = connection.createStatement()) {
                statement.execute(
                        "ALTER TABLE proyecto MODIFY codigo_proyecto VARCHAR(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin");
            }
        } catch (SQLException ex) {
            log.warn("No se pudo ampliar codigo_proyecto: {}", ex.getMessage());
        }
    }
}

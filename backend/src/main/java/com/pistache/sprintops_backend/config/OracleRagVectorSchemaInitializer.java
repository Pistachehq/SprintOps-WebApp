package com.pistache.sprintops_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Añade la columna VECTOR en rag_insight (Reto D4). No usar PL/SQL en data-oracle-springai.sql:
 * Spring JDBC init corta los bloques BEGIN/END y tumba el arranque.
 */
@Component
@Profile("gemini")
@ConditionalOnProperty(name = "spring.datasource.driver-class-name", havingValue = "oracle.jdbc.OracleDriver")
public class OracleRagVectorSchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(OracleRagVectorSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public OracleRagVectorSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void addInsightVectorColumnIfMissing() {
        try {
            jdbcTemplate.execute("""
                    BEGIN
                      EXECUTE IMMEDIATE 'ALTER TABLE rag_insight ADD (insight VECTOR)';
                    EXCEPTION
                      WHEN OTHERS THEN
                        IF SQLCODE != -1430 AND SQLCODE != -942 THEN
                          RAISE;
                        END IF;
                    END;
                    """);
            log.info("Columna rag_insight.insight (VECTOR) verificada en Oracle");
        } catch (Exception e) {
            log.warn("No se pudo añadir rag_insight.insight (VECTOR): {}", e.getMessage());
        }
    }
}

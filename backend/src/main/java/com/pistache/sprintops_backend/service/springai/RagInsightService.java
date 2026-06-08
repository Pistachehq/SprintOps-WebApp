package com.pistache.sprintops_backend.service.springai;

import com.pistache.sprintops_backend.model.RagInsight;
import com.pistache.sprintops_backend.repository.RagInsightRepository;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringReader;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * RAG sobre Oracle VECTOR (Reto D4): embedding con Gemini + TO_VECTOR en ATP.
 */
@Service
public class RagInsightService {

    private final RagInsightRepository ragInsightRepository;
    private final Optional<EmbeddingModel> embeddingModel;
    private final Optional<JdbcTemplate> jdbcTemplate;

    public RagInsightService(
            RagInsightRepository ragInsightRepository,
            @Autowired(required = false) EmbeddingModel embeddingModel,
            @Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.ragInsightRepository = ragInsightRepository;
        this.embeddingModel = Optional.ofNullable(embeddingModel);
        this.jdbcTemplate = Optional.ofNullable(jdbcTemplate);
    }

    public boolean isVectorRagAvailable() {
        return embeddingModel.isPresent() && jdbcTemplate.isPresent();
    }

    @Transactional
    public RagInsight addInsight(String description, Integer projectId, boolean done) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("description es obligatoria");
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (isVectorRagAvailable()) {
            float[] vector = embeddingModel.get().embed(description);
            String vectorStr = vectorToOracleString(vector);
            saveWithVector(description, now, done, projectId, vectorStr);
            RagInsight out = new RagInsight();
            out.setDescription(description);
            out.setCreationTs(now);
            out.setDone(done);
            out.setProjectId(projectId);
            out.setInsight(vector);
            return out;
        }
        RagInsight row = new RagInsight();
        row.setDescription(description.trim());
        row.setCreationTs(now);
        row.setDone(done);
        row.setProjectId(projectId);
        return ragInsightRepository.save(row);
    }

    public List<RagInsight> listByProject(Integer projectId) {
        if (projectId == null) {
            return ragInsightRepository.findAll();
        }
        return ragInsightRepository.findByProjectIdOrderByCreationTsDesc(projectId);
    }

    public List<RagSearchHit> search(String query, Integer projectId, int topK) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        int k = Math.max(1, Math.min(topK, 10));
        if (isVectorRagAvailable()) {
            float[] qVec = embeddingModel.get().embed(query);
            String vectorStr = vectorToOracleString(qVec);
            String sql = """
                    SELECT id, description, project_id,
                           VECTOR_DISTANCE(insight, TO_VECTOR(?), COSINE) AS dist
                    FROM rag_insight
                    WHERE insight IS NOT NULL
                    """ + (projectId != null ? " AND project_id = ? " : "") + """
                    ORDER BY dist
                    FETCH FIRST """ + k + " ROWS ONLY";

            List<Object> args = new ArrayList<>();
            args.add(vectorStr);
            if (projectId != null) {
                args.add(projectId);
            }
            return jdbcTemplate.get().query(sql, args.toArray(), (rs, rowNum) -> new RagSearchHit(
                    rs.getLong("id"),
                    rs.getString("description"),
                    rs.getObject("project_id") != null ? rs.getInt("project_id") : null,
                    rs.getDouble("dist")
            ));
        }
        String q = query.toLowerCase(Locale.ROOT);
        return ragInsightRepository.findAll().stream()
                .filter(r -> r.getDescription() != null
                        && r.getDescription().toLowerCase(Locale.ROOT).contains(q))
                .limit(k)
                .map(r -> new RagSearchHit(r.getId(), r.getDescription(), r.getProjectId(), 0.0))
                .toList();
    }

    private void saveWithVector(String desc, OffsetDateTime ts, boolean done, Integer projectId, String vectorStr) {
        String sql = """
                INSERT INTO rag_insight (description, creation_ts, done, project_id, insight)
                VALUES (?, ?, ?, ?, TO_VECTOR(?))
                """;
        jdbcTemplate.get().update(sql, ps -> {
            ps.setString(1, desc);
            ps.setObject(2, ts);
            ps.setBoolean(3, done);
            if (projectId != null) {
                ps.setInt(4, projectId);
            } else {
                ps.setNull(4, java.sql.Types.INTEGER);
            }
            ps.setClob(5, new StringReader(vectorStr));
        });
    }

    static String vectorToOracleString(float[] vector) {
        return Arrays.toString(vector);
    }

    public record RagSearchHit(Long id, String description, Integer projectId, double distance) {}
}

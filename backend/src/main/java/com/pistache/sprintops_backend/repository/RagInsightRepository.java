package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RagInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RagInsightRepository extends JpaRepository<RagInsight, Long> {

    List<RagInsight> findByProjectIdOrderByCreationTsDesc(Integer projectId);
}

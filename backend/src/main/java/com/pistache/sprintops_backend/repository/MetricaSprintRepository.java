package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.MetricaSprint;
import com.pistache.sprintops_backend.model.MetricaSprint.MetricaSprintId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MetricaSprintRepository extends JpaRepository<MetricaSprint, MetricaSprintId> {
    List<MetricaSprint> findBySprintIdSprint(Integer sprintId);
    List<MetricaSprint> findByMetricaIdMetrica(Integer metricaId);
}

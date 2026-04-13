package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.LogsIssues;
import com.pistache.sprintops_backend.model.Issues;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LogsIssuesRepository extends JpaRepository<LogsIssues, Integer> {
    List<LogsIssues> findByIssue(Issues issue);
    List<LogsIssues> findByIssueIdIssue(Integer issueId);
    List<LogsIssues> findByTipoAccion(String tipoAccion);
}

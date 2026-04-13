package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.PapeleraIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PapeleraIssueRepository extends JpaRepository<PapeleraIssue, Integer> {
    List<PapeleraIssue> findBySprintIdOrderByFechaBorradoDesc(Integer sprintId);
}

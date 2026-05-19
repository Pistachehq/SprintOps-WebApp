package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.DescIssue;
import com.pistache.sprintops_backend.model.DescIssue.DescIssueId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DescIssueRepository extends JpaRepository<DescIssue, DescIssueId> {
    List<DescIssue> findBySprintIdSprint(Integer sprintId);
    List<DescIssue> findByIssueIdIssue(Integer issueId);

    Optional<DescIssue> findByIdSprintIdAndIdIssueId(Integer sprintId, Integer issueId);
}

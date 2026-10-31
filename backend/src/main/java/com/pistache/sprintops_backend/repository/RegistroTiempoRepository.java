package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RegistroTiempo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RegistroTiempoRepository extends JpaRepository<RegistroTiempo, Integer> {
    List<RegistroTiempo> findByIssue_IdIssueOrderByFechaDescIdRegistroTiempoDesc(Integer issueId);

    List<RegistroTiempo> findByIssue_IdIssueIn(Collection<Integer> issueIds);
}

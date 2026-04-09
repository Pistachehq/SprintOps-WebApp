package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RetroSprint;
import com.pistache.sprintops_backend.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RetroSprintRepository extends JpaRepository<RetroSprint, Integer> {
    Optional<RetroSprint> findBySprint(Sprint sprint);
}

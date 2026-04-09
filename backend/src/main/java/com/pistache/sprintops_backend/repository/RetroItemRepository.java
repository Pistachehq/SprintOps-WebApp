package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RetroItem;
import com.pistache.sprintops_backend.model.RetroSprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RetroItemRepository extends JpaRepository<RetroItem, Integer> {
    List<RetroItem> findByRetroSprint(RetroSprint retroSprint);
}

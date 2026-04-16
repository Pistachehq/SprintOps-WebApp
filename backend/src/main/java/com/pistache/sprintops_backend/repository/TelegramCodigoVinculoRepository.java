package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.TelegramCodigoVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TelegramCodigoVinculoRepository extends JpaRepository<TelegramCodigoVinculo, Long> {
    Optional<TelegramCodigoVinculo> findByCodigoAndUsadoFalse(String codigo);
}

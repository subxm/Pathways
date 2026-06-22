package com.pathways.pathservice.repository;

import com.pathways.pathservice.model.Week;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WeekRepository extends JpaRepository<Week, UUID> {
}

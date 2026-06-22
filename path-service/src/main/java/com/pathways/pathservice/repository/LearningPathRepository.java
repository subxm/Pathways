package com.pathways.pathservice.repository;

import com.pathways.pathservice.model.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    List<LearningPath> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

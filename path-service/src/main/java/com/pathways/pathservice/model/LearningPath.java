package com.pathways.pathservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "learning_paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningPath {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String skill;

    @Column(nullable = false, length = 50)
    private String level;

    @Column(length = 255)
    private String goal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_topics_count", nullable = false)
    private int completedTopicsCount;

    @Column(name = "total_topics_count", nullable = false)
    private int totalTopicsCount;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted;

    @OneToMany(mappedBy = "learningPath", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Week> weeks = new ArrayList<>();
}

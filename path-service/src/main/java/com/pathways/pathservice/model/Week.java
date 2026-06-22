package com.pathways.pathservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "weeks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Week {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    @JsonIgnore
    private LearningPath learningPath;

    @Column(name = "week_number", nullable = false)
    private int weekNumber;

    @Column(nullable = false, length = 255)
    private String theme;

    @Column(columnDefinition = "TEXT")
    private String objectives; // Comma-separated list of objectives

    @OneToMany(mappedBy = "week", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Topic> topics = new ArrayList<>();

    // Helper methods to get list of objectives
    public List<String> getObjectivesList() {
        if (objectives == null || objectives.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.asList(objectives.split(";;"));
    }

    public void setObjectivesList(List<String> list) {
        if (list == null || list.isEmpty()) {
            this.objectives = "";
        } else {
            this.objectives = list.stream().collect(Collectors.joining(";;"));
        }
    }
}

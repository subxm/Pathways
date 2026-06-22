package com.pathways.pathservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    @JsonIgnore
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1024)
    private String url;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 1024)
    private String thumbnailUrl;
}

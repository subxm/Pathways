package com.pathways.pathservice.service;

import com.pathways.pathservice.client.BooksClient;
import com.pathways.pathservice.client.GeminiClient;
import com.pathways.pathservice.client.YouTubeClient;
import com.pathways.pathservice.dto.GeminiPathResponse;
import com.pathways.pathservice.dto.PathRequest;
import com.pathways.pathservice.model.*;
import com.pathways.pathservice.repository.LearningPathRepository;
import com.pathways.pathservice.repository.TopicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class PathService {

    private final LearningPathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final GeminiClient geminiClient;
    private final YouTubeClient youtubeClient;
    private final BooksClient booksClient;

    public PathService(
            LearningPathRepository pathRepository,
            TopicRepository topicRepository,
            GeminiClient geminiClient,
            YouTubeClient youtubeClient,
            BooksClient booksClient) {
        this.pathRepository = pathRepository;
        this.topicRepository = topicRepository;
        this.geminiClient = geminiClient;
        this.youtubeClient = youtubeClient;
        this.booksClient = booksClient;
    }

    @Transactional
    public LearningPath generatePath(PathRequest request, UUID userId) {
        String skill = request.getSkill();
        String level = request.getLevel();
        String goal = request.getGoal();

        // 1. Generate path structure using Gemini
        GeminiPathResponse geminiResponse = geminiClient.generateLearningPath(skill, level, goal);

        // 2. Build model structure
        LearningPath path = LearningPath.builder()
                .userId(userId)
                .skill(skill)
                .level(level)
                .goal(goal)
                .completedTopicsCount(0)
                .totalTopicsCount(0)
                .isCompleted(false)
                .build();

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        int totalTopics = 0;

        for (GeminiPathResponse.GeminiWeek geminiWeek : geminiResponse.getWeeks()) {
            Week week = Week.builder()
                    .learningPath(path)
                    .weekNumber(geminiWeek.getWeekNumber())
                    .theme(geminiWeek.getTheme())
                    .build();
            week.setObjectivesList(geminiWeek.getObjectives());
            path.getWeeks().add(week);

            int topicSeq = 0;
            for (GeminiPathResponse.GeminiTopic geminiTopic : geminiWeek.getTopics()) {
                totalTopics++;
                Topic topic = Topic.builder()
                        .week(week)
                        .title(geminiTopic.getTitle())
                        .description(geminiTopic.getDescription())
                        .isCompleted(false)
                        .sequenceNumber(topicSeq++)
                        .build();
                week.getTopics().add(topic);

                // Add documentation resource immediately
                if (geminiTopic.getSuggestedDocUrl() != null && !geminiTopic.getSuggestedDocUrl().trim().isEmpty()) {
                    Resource docResource = Resource.builder()
                            .topic(topic)
                            .type(ResourceType.DOCUMENT)
                            .title("Official Documentation")
                            .url(geminiTopic.getSuggestedDocUrl())
                            .description("Read the official guides and references for " + geminiTopic.getTitle())
                            .thumbnailUrl("")
                            .build();
                    topic.getResources().add(docResource);
                }

                // Async fetch YouTube resources
                CompletableFuture<Void> ytFuture = youtubeClient.fetchVideos(skill, geminiTopic.getTitle())
                        .thenAccept(ytResources -> {
                            for (Resource r : ytResources) {
                                r.setTopic(topic);
                                synchronized (topic.getResources()) {
                                    topic.getResources().add(r);
                                }
                            }
                        });
                futures.add(ytFuture);

                // Async fetch Book resource
                CompletableFuture<Void> bookFuture = booksClient.fetchBook(skill, geminiTopic.getTitle())
                        .thenAccept(bookResource -> {
                            bookResource.setTopic(topic);
                            synchronized (topic.getResources()) {
                                    topic.getResources().add(bookResource);
                            }
                        });
                futures.add(bookFuture);
            }
        }

        path.setTotalTopicsCount(totalTopics);

        // 3. Wait for all parallel API enrichments to complete
        if (!futures.isEmpty()) {
            System.out.println("Enriching resources in parallel: joining " + futures.size() + " tasks...");
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            System.out.println("Resource enrichment complete.");
        }

        // 4. Save path (cascades to all children)
        return pathRepository.save(path);
    }

    @Transactional
    public LearningPath toggleTopicCompletion(UUID pathId, UUID topicId, boolean isCompleted, UUID userId) {
        LearningPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learning path not found"));

        if (!path.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to learning path");
        }

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found"));

        // Verify the topic belongs to the learning path
        boolean belongsToPath = path.getWeeks().stream()
                .flatMap(w -> w.getTopics().stream())
                .anyMatch(t -> t.getId().equals(topicId));

        if (!belongsToPath) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic does not belong to this path");
        }

        if (topic.isCompleted() != isCompleted) {
            topic.setCompleted(isCompleted);
            topicRepository.save(topic);

            // Re-calculate completion counts
            long completedCount = path.getWeeks().stream()
                    .flatMap(w -> w.getTopics().stream())
                    .filter(Topic::isCompleted)
                    .count();

            path.setCompletedTopicsCount((int) completedCount);
            path.setCompleted(completedCount == path.getTotalTopicsCount());
            
            return pathRepository.save(path);
        }

        return path;
    }

    public List<LearningPath> getPathsByUserId(UUID userId) {
        return pathRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public LearningPath getPathById(UUID pathId, UUID userId) {
        LearningPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learning path not found"));

        if (!path.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to learning path");
        }

        return path;
    }
}

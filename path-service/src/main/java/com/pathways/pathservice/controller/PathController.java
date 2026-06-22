package com.pathways.pathservice.controller;

import com.pathways.pathservice.dto.PathRequest;
import com.pathways.pathservice.model.LearningPath;
import com.pathways.pathservice.service.PathService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/paths")
public class PathController {

    private final PathService pathService;

    public PathController(PathService pathService) {
        this.pathService = pathService;
    }

    @PostMapping
    public ResponseEntity<LearningPath> generatePath(
            @RequestBody PathRequest request,
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        LearningPath path = pathService.generatePath(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(path);
    }

    @GetMapping
    public ResponseEntity<List<LearningPath>> listPaths(
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        List<LearningPath> paths = pathService.getPathsByUserId(userId);
        return ResponseEntity.ok(paths);
    }

    @GetMapping("/{pathId}")
    public ResponseEntity<LearningPath> getPathDetails(
            @PathVariable UUID pathId,
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        LearningPath path = pathService.getPathById(pathId, userId);
        return ResponseEntity.ok(path);
    }

    @PostMapping("/{pathId}/topics/{topicId}/toggle")
    public ResponseEntity<LearningPath> toggleTopicCompletion(
            @PathVariable UUID pathId,
            @PathVariable UUID topicId,
            @RequestParam boolean completed,
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        LearningPath updatedPath = pathService.toggleTopicCompletion(pathId, topicId, completed, userId);
        return ResponseEntity.ok(updatedPath);
    }

    private UUID parseUserId(String userIdStr) {
        if (userIdStr == null || userIdStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID header missing");
        }
        try {
            return UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid User ID format");
        }
    }
}

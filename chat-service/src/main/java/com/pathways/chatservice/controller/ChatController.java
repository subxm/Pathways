package com.pathways.chatservice.controller;

import com.pathways.chatservice.model.ChatMessage;
import com.pathways.chatservice.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/{pathId}/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable UUID pathId,
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        List<ChatMessage> history = chatService.getChatHistory(pathId, userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping(value = "/{pathId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @PathVariable UUID pathId,
            @RequestParam String message,
            @RequestParam(required = false) String weekTheme,
            @RequestParam(required = false) String topicTitle,
            @RequestHeader("X-User-Id") String userIdStr) {
        
        UUID userId = parseUserId(userIdStr);
        return chatService.streamChatResponse(pathId, message, weekTheme, topicTitle, userId);
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

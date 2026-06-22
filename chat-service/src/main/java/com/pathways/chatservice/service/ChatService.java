package com.pathways.chatservice.service;

import com.pathways.chatservice.client.GeminiStreamClient;
import com.pathways.chatservice.model.ChatMessage;
import com.pathways.chatservice.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class ChatService {

    private final ChatMessageRepository chatRepository;
    private final GeminiStreamClient geminiStreamClient;
    private final WebClient webClient;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Value("${services.path-service.url:http://localhost:8082}")
    private String pathServiceUrl;

    public ChatService(
            ChatMessageRepository chatRepository,
            GeminiStreamClient geminiStreamClient,
            WebClient.Builder webClientBuilder) {
        this.chatRepository = chatRepository;
        this.geminiStreamClient = geminiStreamClient;
        this.webClient = webClientBuilder.build();
    }

    public List<ChatMessage> getChatHistory(UUID pathId, UUID userId) {
        // Secure check: verify path owner first by calling path-service
        fetchPathMetadata(pathId, userId);
        return chatRepository.findByPathIdOrderByCreatedAtAsc(pathId);
    }

    public SseEmitter streamChatResponse(UUID pathId, String userMessage, String currentWeekTheme, String currentTopicTitle, UUID userId) {
        SseEmitter emitter = new SseEmitter(90000L); // 90 seconds timeout

        // Fetch path details to construct system instructions
        Map<?, ?> pathMetadata = fetchPathMetadata(pathId, userId);
        String skill = (String) pathMetadata.get("skill");
        String level = (String) pathMetadata.get("level");
        String goal = (String) pathMetadata.get("goal");

        // 1. Fetch last 10 messages for context
        List<ChatMessage> last10 = chatRepository.findTop10ByPathIdOrderByCreatedAtDesc(pathId);
        // Reverse to maintain chronological order
        Collections.reverse(last10);

        // 2. Build system instructions
        String systemInstruction = buildSystemInstruction(skill, level, goal, currentWeekTheme, currentTopicTitle);

        // 3. Save User message to DB immediately
        saveMessage(pathId, "USER", userMessage);

        // 4. Stream response async using Schedulers
        StringBuilder assistantResponseBuilder = new StringBuilder();
        
        geminiStreamClient.streamChat(systemInstruction, last10, userMessage)
                .publishOn(Schedulers.fromExecutor(executorService))
                .subscribe(
                        token -> {
                            try {
                                assistantResponseBuilder.append(token);
                                emitter.send(SseEmitter.event().data(token));
                            } catch (IOException e) {
                                System.err.println("SSE connection closed by client: " + e.getMessage());
                            }
                        },
                        error -> {
                            System.err.println("Gemini stream error: " + error.getMessage());
                            try {
                                emitter.send(SseEmitter.event().name("error").data(error.getMessage()));
                            } catch (IOException ioException) {
                                // ignore
                            }
                            emitter.completeWithError(error);
                        },
                        () -> {
                            try {
                                // Save assistant message to DB
                                String assistantFullMessage = assistantResponseBuilder.toString();
                                if (!assistantFullMessage.isEmpty()) {
                                    saveMessage(pathId, "ASSISTANT", assistantFullMessage);
                                }
                                emitter.send(SseEmitter.event().name("complete").data(""));
                            } catch (IOException e) {
                                System.err.println("Failed to send complete event: " + e.getMessage());
                            } finally {
                                emitter.complete();
                            }
                        }
                );

        return emitter;
    }

    private Map<?, ?> fetchPathMetadata(UUID pathId, UUID userId) {
        try {
            return webClient.get()
                    .uri(pathServiceUrl + "/api/paths/" + pathId)
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            System.err.println("Failed to fetch path metadata from path-service: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied or path service unavailable");
        }
    }

    @Transactional
    public void saveMessage(UUID pathId, String sender, String content) {
        ChatMessage message = ChatMessage.builder()
                .pathId(pathId)
                .sender(sender)
                .content(content)
                .build();
        chatRepository.save(message);
    }

    private String buildSystemInstruction(String skill, String level, String goal, String weekTheme, String topicTitle) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are 'Pathways AI', a helpful, professional, and knowledgeable pair programming assistant alongside a structured week-by-week curriculum.\n");
        sb.append("The user is currently studying '").append(skill).append("' at a '").append(level).append("' level.\n");
        if (goal != null && !goal.trim().isEmpty()) {
            sb.append("The user's goal is: ").append(goal).append("\n");
        }
        if (weekTheme != null && !weekTheme.isEmpty()) {
            sb.append("Current Week: ").append(weekTheme).append("\n");
        }
        if (topicTitle != null && !topicTitle.isEmpty()) {
            sb.append("Active Topic they are learning right now: ").append(topicTitle).append("\n");
        }
        sb.append("\nYour guidelines:\n");
        sb.append("1. Answer questions clearly, accurately, and concisely. Focus on deep understanding but keep answers readable.\n");
        sb.append("2. When asked for code, write clean code blocks. Always format code using markdown and use 'JetBrains Mono' font for code blocks if possible. Ensure language tags like ```javascript or ```java are included.\n");
        sb.append("3. Provide practical, high-quality, step-by-step guidance. Suggest practice exercises or short quizzes when appropriate to help consolidate learning.\n");
        sb.append("4. Tailor your complexity to the user's level (").append(level).append(").\n");
        sb.append("5. Do not use robotic intro phrases. Address the user directly and dive straight into the value.");
        return sb.toString();
    }
}

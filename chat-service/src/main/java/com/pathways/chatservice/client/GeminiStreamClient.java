package com.pathways.chatservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathways.chatservice.model.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiStreamClient {

    private final WebClient webClient;
    private final String apiKey;
    private final String streamUrl;
    private final ObjectMapper objectMapper;

    public GeminiStreamClient(
            WebClient.Builder webClientBuilder,
            @Value("${gemini.apiKey}") String apiKey,
            @Value("${gemini.streamUrl}") String streamUrl,
            ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
        this.streamUrl = streamUrl;
        this.objectMapper = objectMapper;
    }

    public Flux<String> streamChat(String systemInstructionText, List<ChatMessage> history, String userPrompt) {
        // Construct Gemini request payload
        Map<String, Object> requestBody = new HashMap<>();

        // Add System Instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> systemParts = new HashMap<>();
        systemParts.put("text", systemInstructionText);
        systemInstruction.put("parts", List.of(systemParts));
        requestBody.put("systemInstruction", systemInstruction);

        // Add Contents (History + User Prompt)
        List<Map<String, Object>> contents = new ArrayList<>();

        // Add past messages
        for (ChatMessage msg : history) {
            Map<String, Object> contentItem = new HashMap<>();
            contentItem.put("role", "USER".equalsIgnoreCase(msg.getSender()) ? "user" : "model");
            
            Map<String, Object> part = new HashMap<>();
            part.put("text", msg.getContent());
            contentItem.put("parts", List.of(part));
            
            contents.add(contentItem);
        }

        // Add current user prompt
        Map<String, Object> currentPromptItem = new HashMap<>();
        currentPromptItem.put("role", "user");
        Map<String, Object> currentPart = new HashMap<>();
        currentPart.put("text", userPrompt);
        currentPromptItem.put("parts", List.of(currentPart));
        contents.add(currentPromptItem);

        requestBody.put("contents", contents);

        // Call Gemini API with alt=sse for server-sent events stream
        String uri = streamUrl + "?alt=sse&key=" + apiKey;

        return webClient.post()
                .uri(uri)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .flatMap(this::extractTextFromSseChunk)
                .onErrorResume(throwable -> {
                    System.err.println("[WARNING] Gemini stream error: " + throwable.getMessage() + ". Falling back to mock chat assistant stream...");
                    return getFallbackChatResponse(userPrompt);
                });
    }

    private Flux<String> getFallbackChatResponse(String userPrompt) {
        String fullResponse = "Hello! I am your Pathways AI guide. I'm currently running in **Offline Demo Mode** because the Gemini API credentials are not fully configured or have expired. However, I can still assist you with general guidance!\n\n" +
                "You asked: *\"" + userPrompt + "\"*\n\n" +
                "Here are some helpful pointers for this stage of your learning:\n" +
                "1. **Consult Official Documentation:** Follow the links provided in your curriculum timeline. They point to official and reputable resources.\n" +
                "2. **Build Mini-Projects:** The best way to learn is by doing. Try creating small, sandbox projects to apply each topic's objectives.\n" +
                "3. **Ask Detailed Questions:** Once the API key is set up, I'll be able to explain complex code snippets, run quiz questions, and act as a personalized interactive tutor.\n\n" +
                "To connect a live Gemini API key, make sure to set the `GEMINI_API_KEY` environment variable on your system and restart the services, or update the `application.yml` file with a valid developer key (starting with `AIzaSy...`). Let me know if you want me to outline any other concepts!";

        // Split by space/whitespace but keep it to simulate streaming tokens
        String[] words = fullResponse.split("(?<=\\s)");
        return Flux.fromArray(words)
                .delayElements(java.time.Duration.ofMillis(30));
    }

    private Flux<String> extractTextFromSseChunk(String chunk) {
        // SSE chunks from Gemini look like: "data: { ...JSON... }\n\n"
        // We might get multiple lines or a partial line. We need to parse it safely.
        if (chunk == null || chunk.trim().isEmpty()) {
            return Flux.empty();
        }

        List<String> results = new ArrayList<>();
        String[] lines = chunk.split("\n");
        for (String line : lines) {
            if (line.startsWith("data:")) {
                String jsonData = line.substring(5).trim();
                try {
                    JsonNode root = objectMapper.readTree(jsonData);
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode firstCandidate = candidates.get(0);
                        JsonNode parts = firstCandidate.path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            String text = parts.get(0).path("text").asText();
                            if (text != null && !text.isEmpty()) {
                                results.add(text);
                            }
                        }
                    }
                } catch (Exception e) {
                    // Ignore parsing errors for control frames or corrupted lines
                    System.err.println("Error parsing Gemini stream chunk line: " + line + ", error: " + e.getMessage());
                }
            }
        }
        return Flux.fromIterable(results);
    }
}

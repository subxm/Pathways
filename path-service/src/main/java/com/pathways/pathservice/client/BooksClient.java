package com.pathways.pathservice.client;

import com.pathways.pathservice.model.Resource;
import com.pathways.pathservice.model.ResourceType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class BooksClient {

    private final WebClient webClient;

    public BooksClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Async("resourceFetchExecutor")
    public CompletableFuture<Resource> fetchBook(String skill, String topicTitle) {
        String query = skill + " " + topicTitle + " book";
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://www.googleapis.com/books/v1/volumes?q=" + encodedQuery + "&maxResults=1";

        try {
            Map<?, ?> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("items")) {
                List<?> items = (List<?>) response.get("items");
                if (!items.isEmpty()) {
                    Map<?, ?> item = (Map<?, ?>) items.get(0);
                    Map<?, ?> volumeInfo = (Map<?, ?>) item.get("volumeInfo");
                    
                    String title = (String) volumeInfo.get("title");
                    String infoLink = (String) volumeInfo.get("infoLink");
                    String description = (String) volumeInfo.get("description");
                    
                    // Format authors list
                    List<?> authors = (List<?>) volumeInfo.get("authors");
                    String authorsStr = "";
                    if (authors != null && !authors.isEmpty()) {
                        authorsStr = " by " + String.join(", ", authors.stream().map(Object::toString).toArray(String[]::new));
                    }

                    String thumbnailUrl = "";
                    Map<?, ?> imageLinks = (Map<?, ?>) volumeInfo.get("imageLinks");
                    if (imageLinks != null) {
                        thumbnailUrl = (String) imageLinks.get("thumbnail");
                        // Replace http with https for security
                        if (thumbnailUrl != null && thumbnailUrl.startsWith("http://")) {
                            thumbnailUrl = thumbnailUrl.replace("http://", "https://");
                        }
                    }

                    return CompletableFuture.completedFuture(Resource.builder()
                            .type(ResourceType.BOOK)
                            .title(title + authorsStr)
                            .url(infoLink)
                            .description(description != null && description.length() > 250 ? description.substring(0, 247) + "..." : description)
                            .thumbnailUrl(thumbnailUrl)
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Google Books API failed for query '" + query + "', returning fallback link. Error: " + e.getMessage());
        }

        // Fallback: search link
        return CompletableFuture.completedFuture(Resource.builder()
                .type(ResourceType.BOOK)
                .title("Recommended Reading: " + topicTitle + " Books")
                .url("https://www.google.com/search?tbm=bks&q=" + encodedQuery)
                .description("Find reference books and textbooks for " + topicTitle + " on Google Books.")
                .thumbnailUrl("")
                .build());
    }
}

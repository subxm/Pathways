package com.pathways.pathservice.client;

import com.pathways.pathservice.model.Resource;
import com.pathways.pathservice.model.ResourceType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class YouTubeClient {

    private final WebClient webClient;
    private final String apiKey;

    public YouTubeClient(
            WebClient.Builder webClientBuilder,
            @Value("${youtube.apiKey}") String apiKey) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
    }

    @Async("resourceFetchExecutor")
    public CompletableFuture<List<Resource>> fetchVideos(String skill, String topicTitle) {
        String query = skill + " " + topicTitle + " tutorial";
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=" 
                + encodedQuery + "&type=video&key=" + apiKey;

        List<Resource> resources = new ArrayList<>();

        try {
            Map<?, ?> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("items")) {
                List<?> items = (List<?>) response.get("items");
                for (Object itemObj : items) {
                    Map<?, ?> item = (Map<?, ?>) itemObj;
                    Map<?, ?> idMap = (Map<?, ?>) item.get("id");
                    String videoId = (String) idMap.get("videoId");
                    
                    Map<?, ?> snippet = (Map<?, ?>) item.get("snippet");
                    String title = (String) snippet.get("title");
                    String description = (String) snippet.get("description");
                    
                    String thumbnailUrl = "";
                    Map<?, ?> thumbnails = (Map<?, ?>) snippet.get("thumbnails");
                    if (thumbnails != null) {
                        Map<?, ?> defaultThumb = (Map<?, ?>) thumbnails.get("default");
                        if (defaultThumb != null) {
                            thumbnailUrl = (String) defaultThumb.get("url");
                        }
                    }

                    resources.add(Resource.builder()
                            .type(ResourceType.YOUTUBE)
                            .title(title)
                            .url("https://www.youtube.com/watch?v=" + videoId)
                            .description(description)
                            .thumbnailUrl(thumbnailUrl)
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("YouTube API failed for query '" + query + "', returning fallback link. Error: " + e.getMessage());
            // Fallback link: direct youtube search
            resources.add(Resource.builder()
                    .type(ResourceType.YOUTUBE)
                    .title("Search on YouTube: " + topicTitle)
                    .url("https://www.youtube.com/results?search_query=" + encodedQuery)
                    .description("Explore more video tutorials directly on YouTube for: " + topicTitle)
                    .thumbnailUrl("")
                    .build());
        }

        return CompletableFuture.completedFuture(resources);
    }
}

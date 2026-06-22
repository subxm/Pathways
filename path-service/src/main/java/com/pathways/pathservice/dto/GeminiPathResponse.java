package com.pathways.pathservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeminiPathResponse {
    private List<GeminiWeek> weeks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeminiWeek {
        private int weekNumber;
        private String theme;
        private List<String> objectives;
        private List<GeminiTopic> topics;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeminiTopic {
        private String title;
        private String description;
        private String suggestedDocUrl;
    }
}

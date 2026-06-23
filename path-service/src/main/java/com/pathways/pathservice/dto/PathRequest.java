package com.pathways.pathservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathRequest {
    private String skill;
    private String level;
    private String goal;
    private String studyHours;
    private String learningStyle;
}

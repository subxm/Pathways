package com.pathways.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenContainer {
    private String accessToken;
    private String refreshToken;
    private UserDto user;
}

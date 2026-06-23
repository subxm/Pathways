package com.pathways.userservice.controller;

import com.pathways.userservice.dto.*;
import com.pathways.userservice.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${cookie.sameSite:Lax}")
    private String cookieSameSite;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody RegisterRequest request) {
        UserDto userDto = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        TokenContainer tokens = authService.login(request);
        
        setAuthCookies(response, tokens.getAccessToken(), tokens.getRefreshToken());
        
        return ResponseEntity.ok(tokens.getUser());
    }

    @PostMapping("/google")
    public ResponseEntity<UserDto> googleLogin(@RequestBody GoogleLoginRequest request, HttpServletResponse response) {
        TokenContainer tokens = authService.loginOrRegisterGoogleUser(request.getEmail(), request.getSub());
        
        setAuthCookies(response, tokens.getAccessToken(), tokens.getRefreshToken());
        
        return ResponseEntity.ok(tokens.getUser());
    }

    @PostMapping("/refresh")
    public ResponseEntity<UserDto> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refresh_token");
        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token missing");
        }

        TokenContainer tokens = authService.refresh(refreshToken);
        
        setAuthCookies(response, tokens.getAccessToken(), tokens.getRefreshToken());
        
        return ResponseEntity.ok(tokens.getUser());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refresh_token");
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        clearAuthCookies(response);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
                                      HttpServletRequest request) {
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            UserDto userDto = authService.getUserById(UUID.fromString(userIdHeader));
            return ResponseEntity.ok(userDto);
        }
        
        // Fallback for direct service access (not routed through gateway)
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized access - gateway header missing");
    }

    private void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // Access token: HTTP-only, expires in 15 mins (900 seconds)
        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(900)
                .build();

        // Refresh token: HTTP-only, expires in 7 days (604800 seconds)
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(604800)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}

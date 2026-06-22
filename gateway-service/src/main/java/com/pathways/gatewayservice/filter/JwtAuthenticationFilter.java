package com.pathways.gatewayservice.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final SecretKey key;

    public JwtAuthenticationFilter(@Value("${jwt.secret:pathways_secret_key_must_be_at_least_256_bits_long_for_security_reasons_1234567890}") String secret) {
        super(Config.class);
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String token = extractToken(request);

            if (token == null) {
                return onError(exchange, "Authorization token is missing", HttpStatus.UNAUTHORIZED);
            }

            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String userId = claims.get("userId", String.class);
                String username = claims.getSubject();

                if (userId == null || username == null) {
                    return onError(exchange, "Invalid token claims", HttpStatus.UNAUTHORIZED);
                }

                // Inject claims as headers for downstream services
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Username", username)
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());

            } catch (Exception e) {
                return onError(exchange, "Invalid or expired token: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private String extractToken(ServerHttpRequest request) {
        // 1. Try to extract from HTTP-only cookie 'access_token'
        HttpCookie cookie = request.getCookies().getFirst("access_token");
        if (cookie != null) {
            return cookie.getValue();
        }

        // 2. Fallback to Authorization Header
        List<String> authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearerToken = authHeaders.get(0);
            if (bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
        }

        return null;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("X-Gateway-Auth-Error", err);
        System.err.println("Gateway auth validation error: " + err);
        return response.setComplete();
    }

    public static class Config {
        // Config variables if needed
    }
}

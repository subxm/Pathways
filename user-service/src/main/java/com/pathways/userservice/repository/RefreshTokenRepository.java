package com.pathways.userservice.repository;

import com.pathways.userservice.model.RefreshToken;
import com.pathways.userservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByTokenAndRevoked(String token, boolean revoked);
    void deleteByUser(User user);
}

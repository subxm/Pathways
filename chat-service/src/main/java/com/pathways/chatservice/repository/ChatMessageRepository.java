package com.pathways.chatservice.repository;

import com.pathways.chatservice.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByPathIdOrderByCreatedAtAsc(UUID pathId);
    List<ChatMessage> findTop10ByPathIdOrderByCreatedAtDesc(UUID pathId);
}

package com.example.jspbook.repository;

import com.example.jspbook.entity.WeddingEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WeddingEventRepository extends JpaRepository<WeddingEvent, Long> {
    Optional<WeddingEvent> findByEventCode(String eventCode);
}
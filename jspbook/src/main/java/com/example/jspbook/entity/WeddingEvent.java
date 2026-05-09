package com.example.jspbook.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wedding_event")
public class WeddingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="event_code", nullable = false, unique = true)
    private String eventCode;

    @Column(name="groom_name", nullable = false)
    private String groomName;

    @Column(name="bride_name", nullable = false)
    private String brideName;

    @Column(name="created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getEventCode() {
        return eventCode;
    }

    public String getGroomName() {
        return groomName;
    }

    public String getBrideName() {
        return brideName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

    public void setGroomName(String groomName) {
        this.groomName = groomName;
    }

    public void setBrideName(String brideName) {
        this.brideName = brideName;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
package com.example.jspbook.controller;

import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.WeddingEventRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
public class WeddingEventController {

    private final WeddingEventRepository eventRepository;

    public WeddingEventController(WeddingEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @PostMapping
    public Map<String, String> createEvent(@RequestBody Map<String, String> body) {
        String groomName = body.get("groomName");
        String brideName = body.get("brideName");

        WeddingEvent event = new WeddingEvent();
        event.setGroomName(groomName);
        event.setBrideName(brideName);
        event.setEventCode(UUID.randomUUID().toString().substring(0, 8));

        eventRepository.save(event);

        return Map.of(
                "eventCode", event.getEventCode(),
                "groomName", event.getGroomName(),
                "brideName", event.getBrideName()
        );
    }

    @GetMapping("/{eventCode}")
    public WeddingEvent getEvent(@PathVariable String eventCode) {
        return eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new RuntimeException("행사를 찾을 수 없습니다."));
    }
}
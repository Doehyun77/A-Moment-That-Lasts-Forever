package com.example.jspbook.controller;

import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.guest.GuestSessionInfo;
import com.example.jspbook.repository.WeddingEventRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/guest-session")
public class GuestSessionController {

    private final WeddingEventRepository eventRepository;

    public GuestSessionController(WeddingEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @PostMapping("/enter")
    public Map<String, Object> enterGuest(@RequestBody Map<String, String> body, HttpSession session) {
        String eventCode = trim(body.get("eventCode"));
        String nick = trim(body.get("nick"));
        String category = trim(body.get("category"));
        String side = trim(body.get("side"));

        if (eventCode.isEmpty() || nick.isEmpty() || category.isEmpty() || side.isEmpty()) {
            return Map.of("success", false, "error", "입장 정보가 올바르지 않아요.");
        }

        WeddingEvent event = eventRepository.findByEventCode(eventCode).orElse(null);
        if (event == null || event.isDeleted()) {
            return Map.of("success", false, "error", "행사를 찾을 수 없어요.");
        }

        GuestSessionInfo info = GuestSessionInfo.create(eventCode, nick, category, side);
        session.setAttribute(GuestSessionInfo.SESSION_KEY, info);

        return Map.of("success", true, "guest", info.toMap());
    }

    @GetMapping
    public Map<String, Object> getGuest(@RequestParam String eventCode, HttpSession session) {
        GuestSessionInfo info = getSessionInfo(session, eventCode);
        if (info == null) {
            return Map.of("authenticated", false);
        }
        return Map.of("authenticated", true, "guest", info.toMap());
    }

    @DeleteMapping
    public Map<String, Object> clearGuest(@RequestParam(required = false) String eventCode, HttpSession session) {
        GuestSessionInfo info = (GuestSessionInfo) session.getAttribute(GuestSessionInfo.SESSION_KEY);
        if (info != null && (eventCode == null || eventCode.isBlank() || eventCode.equals(info.getEventCode()))) {
            session.removeAttribute(GuestSessionInfo.SESSION_KEY);
        }
        return Map.of("success", true);
    }

    public static GuestSessionInfo getSessionInfo(HttpSession session, String eventCode) {
        if (session == null) return null;
        GuestSessionInfo info = (GuestSessionInfo) session.getAttribute(GuestSessionInfo.SESSION_KEY);
        if (info == null) return null;
        if (eventCode != null && !eventCode.isBlank() && !eventCode.equals(info.getEventCode())) return null;
        return info;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}

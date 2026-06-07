package com.example.jspbook.controller;

import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.WeddingEventRepository;
import com.example.jspbook.service.OperationLogService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin-session")
public class AdminSessionController {

    public static final String SESSION_KEY = "ADMIN_AUTHENTICATED";
    public static final String EVENT_CODE_SESSION_KEY = "ADMIN_EVENT_CODE";

    private final WeddingEventRepository eventRepository;
    private final OperationLogService operationLogService;

    public AdminSessionController(WeddingEventRepository eventRepository,
                                  OperationLogService operationLogService) {
        this.eventRepository = eventRepository;
        this.operationLogService = operationLogService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body, HttpSession session) {
        String eventCode = body.getOrDefault("eventCode", "").trim();
        String code = body.getOrDefault("code", "").trim();

        if (eventCode.isBlank()) {
            clearSession(session);
            operationLogService.logAdminLoginFailure("", null, "행사 정보 없음");
            return Map.of("success", false, "authenticated", false, "error", "행사 정보가 없어요. 다시 접속해 주세요.");
        }

        WeddingEvent event = eventRepository.findByEventCode(eventCode).orElse(null);
        if (event == null || event.isDeleted()) {
            clearSession(session);
            operationLogService.logAdminLoginFailure(eventCode, event, "행사를 찾을 수 없음");
            return Map.of("success", false, "authenticated", false, "error", "행사를 찾을 수 없어요.");
        }

        if (event.getAdminCode() == null || !event.getAdminCode().equals(code)) {
            clearSession(session);
            operationLogService.logAdminLoginFailure(eventCode, event, "관리자 코드 불일치");
            return Map.of("success", false, "authenticated", false, "error", "코드가 올바르지 않아요");
        }

        session.setAttribute(SESSION_KEY, true);
        session.setAttribute(EVENT_CODE_SESSION_KEY, eventCode);
        operationLogService.logAdminLoginSuccess(event);
        return Map.of(
                "success", true,
                "authenticated", true,
                "eventCode", eventCode,
                "groomName", event.getGroomName(),
                "brideName", event.getBrideName()
        );
    }

    @GetMapping
    public Map<String, Object> status(HttpSession session) {
        String eventCode = getAuthenticatedEventCode(session);
        return Map.of(
                "authenticated", eventCode != null,
                "eventCode", eventCode == null ? "" : eventCode
        );
    }

    @DeleteMapping
    public Map<String, Object> logout(HttpSession session) {
        clearSession(session);
        return Map.of("success", true, "authenticated", false);
    }

    public static boolean isAuthenticated(HttpSession session) {
        return getAuthenticatedEventCode(session) != null;
    }

    public static boolean isAuthenticatedForEvent(HttpSession session, String eventCode) {
        String authenticatedEventCode = getAuthenticatedEventCode(session);
        return authenticatedEventCode != null
                && ("*".equals(authenticatedEventCode) || authenticatedEventCode.equals(eventCode));
    }

    public static String getAuthenticatedEventCode(HttpSession session) {
        if (session == null || !Boolean.TRUE.equals(session.getAttribute(SESSION_KEY))) {
            return null;
        }
        Object eventCode = session.getAttribute(EVENT_CODE_SESSION_KEY);
        if (eventCode instanceof String value && !value.isBlank()) {
            return value;
        }
        return "*";
    }

    private void clearSession(HttpSession session) {
        if (session == null) return;
        session.removeAttribute(SESSION_KEY);
        session.removeAttribute(EVENT_CODE_SESSION_KEY);
    }
}

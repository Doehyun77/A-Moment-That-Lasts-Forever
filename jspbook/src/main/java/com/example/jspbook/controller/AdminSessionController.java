package com.example.jspbook.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin-session")
public class AdminSessionController {

    public static final String SESSION_KEY = "ADMIN_AUTHENTICATED";

    @Value("${app.admin-code:a0000a}")
    private String adminCode;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body, HttpSession session) {
        String code = body.getOrDefault("code", "").trim();
        if (!adminCode.equals(code)) {
            session.removeAttribute(SESSION_KEY);
            return Map.of("success", false, "error", "코드가 올바르지 않아요");
        }

        session.setAttribute(SESSION_KEY, true);
        return Map.of("success", true, "authenticated", true);
    }

    @GetMapping
    public Map<String, Object> status(HttpSession session) {
        return Map.of("authenticated", isAuthenticated(session));
    }

    @DeleteMapping
    public Map<String, Object> logout(HttpSession session) {
        session.removeAttribute(SESSION_KEY);
        return Map.of("success", true, "authenticated", false);
    }

    public static boolean isAuthenticated(HttpSession session) {
        return session != null && Boolean.TRUE.equals(session.getAttribute(SESSION_KEY));
    }
}

package com.example.jspbook.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/operator")
public class OperatorAuthController {

    public static final String SESSION_KEY = "OPERATOR_AUTHENTICATED";

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.operator.username}")
    private String operatorUsername;

    @Value("${app.operator.password}")
    private String operatorPasswordHash;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body, HttpSession session) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "").trim();

        if (!operatorUsername.equals(username)) {
            return Map.of("success", false, "error", "아이디 또는 비밀번호가 올바르지 않아요");
        }

        if (!passwordEncoder.matches(password, operatorPasswordHash)) {
            return Map.of("success", false, "error", "아이디 또는 비밀번호가 올바르지 않아요");
        }

        session.setAttribute(SESSION_KEY, true);
        return Map.of("success", true, "authenticated", true);
    }

    @GetMapping("/status")
    public Map<String, Object> status(HttpSession session) {
        return Map.of("authenticated", isAuthenticated(session));
    }

    @DeleteMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        session.removeAttribute(SESSION_KEY);
        return Map.of("success", true, "authenticated", false);
    }

    public static boolean isAuthenticated(HttpSession session) {
        return session != null && Boolean.TRUE.equals(session.getAttribute(SESSION_KEY));
    }
}

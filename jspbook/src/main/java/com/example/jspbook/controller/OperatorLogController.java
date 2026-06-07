package com.example.jspbook.controller;

import com.example.jspbook.entity.OperatorLog;
import com.example.jspbook.service.OperationLogService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operator/logs")
public class OperatorLogController {

    private final OperationLogService operationLogService;

    public OperatorLogController(OperationLogService operationLogService) {
        this.operationLogService = operationLogService;
    }

    @GetMapping
    public Map<String, Object> listLogs(HttpSession session) {
        requireOperatorSession(session);
        List<Map<String, Object>> items = operationLogService.listRecentLogs().stream()
                .map(this::serialize)
                .toList();
        return Map.of("success", true, "items", items);
    }

    private void requireOperatorSession(HttpSession session) {
        if (!OperatorAuthController.isAuthenticated(session)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "운영자 로그인이 필요합니다.");
        }
    }

    private Map<String, Object> serialize(OperatorLog log) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", log.getId());
        item.put("logType", log.getLogType());
        item.put("status", log.getStatus());
        item.put("eventCode", log.getEventCode());
        item.put("siteLabel", log.getSiteLabel());
        item.put("message", log.getMessage());
        item.put("detail", log.getDetail());
        item.put("createdAt", log.getCreatedAt());
        return item;
    }
}

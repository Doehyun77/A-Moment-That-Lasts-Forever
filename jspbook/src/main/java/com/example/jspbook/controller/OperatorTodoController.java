package com.example.jspbook.controller;

import com.example.jspbook.entity.OperatorTodo;
import com.example.jspbook.repository.OperatorTodoRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operator/todos")
public class OperatorTodoController {

    private static final int MAX_TODOS = 7;

    private final OperatorTodoRepository operatorTodoRepository;

    public OperatorTodoController(OperatorTodoRepository operatorTodoRepository) {
        this.operatorTodoRepository = operatorTodoRepository;
    }

    @GetMapping
    public Map<String, Object> listTodos(HttpSession session) {
        requireOperatorSession(session);
        return Map.of("success", true, "items", serialize(operatorTodoRepository.findAllByOrderBySortOrderAscIdAsc()));
    }

    @PutMapping
    @Transactional
    public Map<String, Object> replaceTodos(@RequestBody Map<String, Object> body, HttpSession session) {
        requireOperatorSession(session);

        Object rawItems = body.get("items");
        List<?> items = rawItems instanceof List<?> list ? list : List.of();
        if (items.size() > MAX_TODOS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "운영 메모는 최대 7개까지 저장할 수 있어요.");
        }

        List<OperatorTodo> todos = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            Object rawItem = items.get(i);
            if (!(rawItem instanceof Map<?, ?> itemMap)) {
                continue;
            }

            Object rawText = itemMap.get("text");
            String text = rawText == null ? "" : String.valueOf(rawText).trim();
            if (text.isEmpty()) {
                continue;
            }

            OperatorTodo todo = new OperatorTodo();
            todo.setText(text);
            Object rawDone = itemMap.get("done");
            todo.setDone(Boolean.parseBoolean(String.valueOf(rawDone == null ? false : rawDone)));
            todo.setSortOrder(i);
            todo.setUpdatedAt(LocalDateTime.now());
            todos.add(todo);
        }

        operatorTodoRepository.deleteAllInBatch();
        List<OperatorTodo> saved = operatorTodoRepository.saveAll(todos);
        return Map.of("success", true, "items", serialize(saved));
    }

    private void requireOperatorSession(HttpSession session) {
        if (!OperatorAuthController.isAuthenticated(session)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "운영자 로그인이 필요합니다.");
        }
    }

    private List<Map<String, Object>> serialize(List<OperatorTodo> todos) {
        return todos.stream().map(todo -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", todo.getId());
            item.put("text", todo.getText());
            item.put("done", todo.isDone());
            item.put("sortOrder", todo.getSortOrder());
            return item;
        }).toList();
    }
}

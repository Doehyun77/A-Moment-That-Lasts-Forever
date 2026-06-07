package com.example.jspbook.controller;

import com.example.jspbook.entity.OperatorTodo;
import com.example.jspbook.repository.OperatorTodoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class OperatorTodoControllerTest {

    @Test
    void listTodos_requiresOperatorSession() {
        OperatorTodoRepository repository = mock(OperatorTodoRepository.class);
        OperatorTodoController controller = new OperatorTodoController(repository);

        assertThatThrownBy(() -> controller.listTodos(new MockHttpSession()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("401 UNAUTHORIZED");
    }

    @SuppressWarnings("unchecked")
    @Test
    void listTodos_returnsSavedItemsInOrder() {
        OperatorTodoRepository repository = mock(OperatorTodoRepository.class);
        OperatorTodoController controller = new OperatorTodoController(repository);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(OperatorAuthController.SESSION_KEY, true);

        OperatorTodo first = new OperatorTodo();
        first.setId(10L);
        first.setText("첫 번째 메모");
        first.setDone(false);
        first.setSortOrder(0);

        OperatorTodo second = new OperatorTodo();
        second.setId(11L);
        second.setText("완료 메모");
        second.setDone(true);
        second.setSortOrder(1);

        when(repository.findAllByOrderBySortOrderAscIdAsc()).thenReturn(List.of(first, second));

        Map<String, Object> result = controller.listTodos(session);
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");

        assertThat(result.get("success")).isEqualTo(true);
        assertThat(items).hasSize(2);
        assertThat(items.get(0).get("text")).isEqualTo("첫 번째 메모");
        assertThat(items.get(0).get("done")).isEqualTo(false);
        assertThat(items.get(1).get("text")).isEqualTo("완료 메모");
        assertThat(items.get(1).get("done")).isEqualTo(true);
    }

    @SuppressWarnings("unchecked")
    @Test
    void replaceTodos_rewritesListUsingPayloadOrder() {
        OperatorTodoRepository repository = mock(OperatorTodoRepository.class);
        OperatorTodoController controller = new OperatorTodoController(repository);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(OperatorAuthController.SESSION_KEY, true);

        when(repository.saveAll(anyList())).thenAnswer(invocation -> {
            List<OperatorTodo> todos = invocation.getArgument(0);
            for (int i = 0; i < todos.size(); i++) {
                todos.get(i).setId((long) (i + 1));
            }
            return todos;
        });

        Map<String, Object> result = controller.replaceTodos(Map.of(
                "items", List.of(
                        Map.of("text", "메모 A", "done", false),
                        Map.of("text", "메모 B", "done", true)
                )
        ), session);

        verify(repository).deleteAllInBatch();
        verify(repository).saveAll(anyList());

        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        assertThat(items).hasSize(2);
        assertThat(items.get(0).get("sortOrder")).isEqualTo(0);
        assertThat(items.get(1).get("sortOrder")).isEqualTo(1);
        assertThat(items.get(0).get("text")).isEqualTo("메모 A");
        assertThat(items.get(1).get("text")).isEqualTo("메모 B");
        assertThat(items.get(1).get("done")).isEqualTo(true);
    }

    @Test
    void replaceTodos_rejectsMoreThanSevenItems() {
        OperatorTodoRepository repository = mock(OperatorTodoRepository.class);
        OperatorTodoController controller = new OperatorTodoController(repository);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(OperatorAuthController.SESSION_KEY, true);

        List<Map<String, Object>> payloadItems = java.util.stream.IntStream.rangeClosed(1, 8)
                .mapToObj(i -> Map.<String, Object>of("text", "메모 " + i, "done", false))
                .toList();

        assertThatThrownBy(() -> controller.replaceTodos(Map.of("items", payloadItems), session))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST")
                .hasMessageContaining("최대 7개");

        verify(repository, never()).deleteAllInBatch();
        verify(repository, never()).saveAll(anyList());
    }
}

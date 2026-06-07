package com.example.jspbook.controller;

import com.example.jspbook.entity.OperatorLog;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.OperatorLogRepository;
import com.example.jspbook.service.OperationLogService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class OperationLogServiceTest {

    @Test
    void listAndSave_keepsOnlyLatestFiftyLogs() {
        OperatorLogRepository repository = mock(OperatorLogRepository.class);
        List<OperatorLog> store = new ArrayList<>();
        AtomicLong sequence = new AtomicLong(1);

        when(repository.save(any(OperatorLog.class))).thenAnswer(invocation -> {
            OperatorLog log = invocation.getArgument(0);
            if (log.getId() == null) {
                log.setId(sequence.getAndIncrement());
            }
            store.add(log);
            return log;
        });
        when(repository.findAllByOrderByCreatedAtDescIdDesc()).thenAnswer(invocation -> store.stream()
                .sorted(Comparator.comparing(OperatorLog::getCreatedAt).reversed().thenComparing(OperatorLog::getId, Comparator.reverseOrder()))
                .toList());
        doAnswer(invocation -> {
            List<?> overflow = invocation.getArgument(0);
            store.removeAll(overflow);
            return null;
        }).when(repository).deleteAll(anyList());

        OperationLogService service = new OperationLogService(repository);
        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");
        event.setGroomName("민수");
        event.setBrideName("지영");

        for (int i = 0; i < 55; i++) {
            service.logAdminLoginSuccess(event);
        }

        List<OperatorLog> recent = service.listRecentLogs();
        assertThat(recent).hasSize(50);
        assertThat(store).hasSize(50);
        verify(repository, atLeastOnce()).deleteAll(anyList());
    }
}

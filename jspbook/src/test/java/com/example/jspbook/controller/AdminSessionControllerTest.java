package com.example.jspbook.controller;

import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.OperatorLogRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import com.example.jspbook.service.OperationLogService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AdminSessionControllerTest {

    private static class RecordingOperationLogService extends OperationLogService {
        String successEventCode;
        String failureEventCode;
        String failureReason;

        RecordingOperationLogService() {
            super(mock(OperatorLogRepository.class));
        }

        @Override
        public void logAdminLoginSuccess(WeddingEvent event) {
            successEventCode = event == null ? null : event.getEventCode();
        }

        @Override
        public void logAdminLoginFailure(String eventCode, WeddingEvent event, String reason) {
            failureEventCode = eventCode;
            failureReason = reason;
        }
    }

    @Test
    void login_logsSuccessForMatchingAdminCode() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        RecordingOperationLogService operationLogService = new RecordingOperationLogService();
        AdminSessionController controller = new AdminSessionController(eventRepository, operationLogService);
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setAdminCode("ABCD1234");
        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.login(Map.of("eventCode", "event1234", "code", "ABCD1234"), session);

        assertThat(result.get("success")).isEqualTo(true);
        assertThat(session.getAttribute(AdminSessionController.SESSION_KEY)).isEqualTo(true);
        assertThat(operationLogService.successEventCode).isEqualTo("event1234");
        assertThat(operationLogService.failureReason).isNull();
    }

    @Test
    void login_logsFailureForWrongAdminCode() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        RecordingOperationLogService operationLogService = new RecordingOperationLogService();
        AdminSessionController controller = new AdminSessionController(eventRepository, operationLogService);
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setAdminCode("ABCD1234");
        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.login(Map.of("eventCode", "event1234", "code", "WRONG"), session);

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(session.getAttribute(AdminSessionController.SESSION_KEY)).isNull();
        assertThat(operationLogService.failureEventCode).isEqualTo("event1234");
        assertThat(operationLogService.failureReason).isEqualTo("관리자 코드 불일치");
        assertThat(operationLogService.successEventCode).isNull();
    }
}

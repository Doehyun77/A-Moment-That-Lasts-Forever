package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.OperatorLogRepository;
import com.example.jspbook.repository.PhotoRepository;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import com.example.jspbook.service.OperationLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

class WeddingEventControllerSoftDeleteTest {

    @TempDir
    Path tempDir;

    private static class RecordingOperationLogService extends OperationLogService {
        int createdFaqCount = -1;
        int createdTimelineCount = -1;
        String deletedEventCode;

        RecordingOperationLogService() {
            super(mock(OperatorLogRepository.class));
        }

        @Override
        public void logSiteCreated(WeddingEvent event, int faqCount, int timelineCount) {
            createdFaqCount = faqCount;
            createdTimelineCount = timelineCount;
        }

        @Override
        public void logSiteDeleted(WeddingEvent event) {
            deletedEventCode = event == null ? null : event.getEventCode();
        }
    }

    private static StorageProperties testStorageProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setRootDir("var-test");
        properties.setUploadDir("uploads-test");
        return properties;
    }

    private StorageProperties tempStorageProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setRootDir(tempDir.toString());
        properties.setUploadDir(tempDir.resolve("uploads").toString());
        return properties;
    }

    private WeddingEventController controller(WeddingEventRepository eventRepository,
                                              PostRepository postRepository,
                                              PhotoRepository photoRepository,
                                              StorageProperties storageProperties,
                                              OperationLogService operationLogService) {
        return new WeddingEventController(eventRepository, postRepository, photoRepository, storageProperties, operationLogService);
    }

    @Test
    void listEvents_excludesSoftDeletedEvents() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), new RecordingOperationLogService());

        WeddingEvent active = new WeddingEvent();
        active.setId(1L);
        active.setEventCode("active01");
        active.setGroomName("신랑");
        active.setBrideName("신부");

        WeddingEvent deleted = new WeddingEvent();
        deleted.setId(2L);
        deleted.setEventCode("deleted01");
        deleted.setGroomName("삭제");
        deleted.setBrideName("대상");
        deleted.setDeleted(true);

        when(eventRepository.findAll()).thenReturn(List.of(active, deleted));
        when(postRepository.findAll()).thenReturn(List.of());

        List<Map<String, Object>> result = controller.listEvents();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("eventCode")).isEqualTo("active01");
    }

    @Test
    void softDeleteEvent_marksEventDeleted() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        RecordingOperationLogService operationLogService = new RecordingOperationLogService();
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), operationLogService);

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("past001");
        when(eventRepository.findByEventCode("past001")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.softDeleteEvent("past001");

        assertThat(result.get("success")).isEqualTo(true);
        assertThat(event.isDeleted()).isTrue();
        assertThat(event.getDeletedAt()).isNotNull();
        verify(eventRepository).save(event);
        assertThat(operationLogService.deletedEventCode).isEqualTo("past001");
    }

    @Test
    void getEvent_marksFutureEventAsNotStartedYet() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), new RecordingOperationLogService());

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("future001");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setWeddingDate(LocalDate.now().plusDays(3));
        event.setQrStartDate(LocalDate.now().plusDays(2));
        when(eventRepository.findByEventCode("future001")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.getEvent("future001");

        assertThat(result.get("eventCode")).isEqualTo("future001");
        assertThat(result.get("entryOpen")).isEqualTo(false);
        assertThat(result.get("status")).isEqualTo("before_start");
        assertThat(result.get("statusMessage")).isEqualTo("아직 결혼식이 시작되지 않았어요.");
        assertThat(result.get("availableFrom")).isEqualTo(LocalDate.now().plusDays(3).toString());
    }

    @Test
    void getEvent_keepsFutureWeddingClosedEvenIfQrStartDateAlreadyPassed() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), new RecordingOperationLogService());

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("future-open001");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setWeddingDate(LocalDate.now().plusDays(5));
        event.setQrStartDate(LocalDate.now());
        when(eventRepository.findByEventCode("future-open001")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.getEvent("future-open001");

        assertThat(result.get("entryOpen")).isEqualTo(false);
        assertThat(result.get("status")).isEqualTo("before_start");
        assertThat(result.get("availableFrom")).isEqualTo(LocalDate.now().plusDays(5).toString());
    }

    @Test
    void getEvent_marksTodayEventAsOpen() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), new RecordingOperationLogService());

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("today001");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setWeddingDate(LocalDate.now());
        event.setQrStartDate(LocalDate.now());
        when(eventRepository.findByEventCode("today001")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.getEvent("today001");

        assertThat(result.get("entryOpen")).isEqualTo(true);
        assertThat(result.get("status")).isEqualTo("active");
        assertThat(result.get("statusMessage")).isEqualTo("입장 가능한 웨딩 페이지예요.");
    }

    @SuppressWarnings("unchecked")
    @Test
    void createEvent_persistsFaqAndTimelinePayload() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        RecordingOperationLogService operationLogService = new RecordingOperationLogService();
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, testStorageProperties(), operationLogService);

        when(eventRepository.save(any(WeddingEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> body = Map.of(
                "groomName", "민수",
                "brideName", "지영",
                "weddingDate", LocalDate.now().toString(),
                "faqItems", List.of(
                        Map.of("q", "주차는 가능한가요?", "a", "예식장 지하주차장을 이용해 주세요."),
                        Map.of("q", "식사는 어디서 하나요?", "a", "2층 연회장입니다.")
                ),
                "timelineItems", List.of(
                        Map.of("time", "13:30", "title", "하객 입장", "desc", "예식홀 입장 시작"),
                        Map.of("time", "14:00", "title", "예식 시작", "desc", "본식 진행")
                )
        );

        Map<String, Object> result = controller.createEvent(body);

        assertThat(result.get("faqCount")).isEqualTo(2);
        assertThat(result.get("timelineCount")).isEqualTo(2);
        assertThat((List<Map<String, String>>) result.get("faqItems"))
                .extracting(item -> item.get("q"))
                .containsExactly("주차는 가능한가요?", "식사는 어디서 하나요?");
        assertThat((List<Map<String, String>>) result.get("timelineItems"))
                .extracting(item -> item.get("title"))
                .containsExactly("하객 입장", "예식 시작");

        verify(eventRepository).save(argThat(event ->
                event.getFaqJson() != null && event.getFaqJson().contains("주차는 가능한가요?")
                        && event.getTimelineJson() != null && event.getTimelineJson().contains("예식 시작")
        ));
        assertThat(operationLogService.createdFaqCount).isEqualTo(2);
        assertThat(operationLogService.createdTimelineCount).isEqualTo(2);
    }

    @SuppressWarnings("unchecked")
    @Test
    void getEvent_includesPersistedInvitationAndWeddingPhotosFromUploadDirectory() throws Exception {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = controller(eventRepository, postRepository, photoRepository, tempStorageProperties(), new RecordingOperationLogService());

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("gallery01");
        event.setGroomName("민수");
        event.setBrideName("지영");
        event.setInvitationUrl("https://invite.example.com/card");
        when(eventRepository.findByEventCode("gallery01")).thenReturn(Optional.of(event));

        Path eventDir = tempDir.resolve("uploads").resolve("gallery01");
        Files.createDirectories(eventDir);
        Files.writeString(eventDir.resolve("invitation_123_card.png"), "img");
        Files.writeString(eventDir.resolve("b_photo.jpg"), "photo1");
        Files.writeString(eventDir.resolve("a_photo.jpg"), "photo2");

        Map<String, Object> result = controller.getEvent("gallery01");

        assertThat(result.get("invitationUrl")).isEqualTo("https://invite.example.com/card");
        assertThat(result.get("invitationImageUrl")).isEqualTo("/uploads/gallery01/invitation_123_card.png");
        assertThat(result.get("galleryCount")).isEqualTo(2);
        assertThat((List<String>) result.get("weddingPhotos"))
                .containsExactly("/uploads/gallery01/a_photo.jpg", "/uploads/gallery01/b_photo.jpg");
    }
}

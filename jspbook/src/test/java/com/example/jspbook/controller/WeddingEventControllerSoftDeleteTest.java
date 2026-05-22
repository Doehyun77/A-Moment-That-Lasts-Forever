package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.PhotoRepository;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class WeddingEventControllerSoftDeleteTest {

    private static StorageProperties testStorageProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setRootDir("var-test");
        properties.setUploadDir("uploads-test");
        return properties;
    }

    @Test
    void listEvents_excludesSoftDeletedEvents() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = new WeddingEventController(eventRepository, postRepository, photoRepository, testStorageProperties());

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
        WeddingEventController controller = new WeddingEventController(eventRepository, postRepository, photoRepository, testStorageProperties());

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("past001");
        when(eventRepository.findByEventCode("past001")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.softDeleteEvent("past001");

        assertThat(result.get("success")).isEqualTo(true);
        assertThat(event.isDeleted()).isTrue();
        assertThat(event.getDeletedAt()).isNotNull();
        verify(eventRepository).save(event);
    }

    @Test
    void getEvent_marksFutureEventAsNotStartedYet() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        PhotoRepository photoRepository = mock(PhotoRepository.class);
        WeddingEventController controller = new WeddingEventController(eventRepository, postRepository, photoRepository, testStorageProperties());

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
        WeddingEventController controller = new WeddingEventController(eventRepository, postRepository, photoRepository, testStorageProperties());

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
        WeddingEventController controller = new WeddingEventController(eventRepository, postRepository, photoRepository, testStorageProperties());

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
}

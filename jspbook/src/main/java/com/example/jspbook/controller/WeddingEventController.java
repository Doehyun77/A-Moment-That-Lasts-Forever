package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.Photo;
import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.PhotoRepository;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class WeddingEventController {

    private final WeddingEventRepository eventRepository;
    private final PostRepository postRepository;
    private final PhotoRepository photoRepository;
    private final StorageProperties storageProperties;

    @Autowired
    public WeddingEventController(WeddingEventRepository eventRepository,
                                  PostRepository postRepository,
                                  PhotoRepository photoRepository,
                                  StorageProperties storageProperties) {
        this.eventRepository = eventRepository;
        this.postRepository = postRepository;
        this.photoRepository = photoRepository;
        this.storageProperties = storageProperties;
    }

    @GetMapping
    public List<Map<String, Object>> listEvents() {
        List<WeddingEvent> events = eventRepository.findAll().stream()
                .filter(event -> !event.isDeleted())
                .toList();

        // 모든 포스트와 사진을 한 번에 로드
        List<Post> allPosts = postRepository.findAll();
        Map<Long, List<Post>> postsByEvent = allPosts.stream()
                .collect(Collectors.groupingBy(p -> p.getEvent().getId()));

        return events.stream().map(event -> {
            List<Post> eventPosts = postsByEvent.getOrDefault(event.getId(), List.of());
            long guestCount = eventPosts.size();
            long photoCount = eventPosts.stream()
                    .mapToLong(p -> p.getPhotos().size())
                    .sum();

            Map<String, Object> map = new HashMap<>();
            map.put("id", event.getId());
            map.put("eventCode", event.getEventCode());
            map.put("groomName", event.getGroomName());
            map.put("brideName", event.getBrideName());
            map.put("createdAt", event.getCreatedAt());
            map.put("weddingDate", event.getWeddingDate());
            map.put("qrStartDate", event.getQrStartDate());
            map.put("qrEndDate", event.getQrEndDate());
            map.put("guestCount", guestCount);
            map.put("photoCount", photoCount);
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping
    public Map<String, String> createEvent(@RequestBody Map<String, String> body) {
        String groomName = body.get("groomName");
        String brideName = body.get("brideName");
        String weddingDate = body.get("weddingDate");
        String qrStartDate = body.get("qrStartDate");
        String qrEndDate = body.get("qrEndDate");

        WeddingEvent event = new WeddingEvent();
        event.setGroomName(groomName);
        event.setBrideName(brideName);
        event.setEventCode(UUID.randomUUID().toString().substring(0, 8));
        if (weddingDate != null && !weddingDate.isBlank()) {
            event.setWeddingDate(LocalDate.parse(weddingDate));
        }
        if (qrStartDate != null && !qrStartDate.isBlank()) {
            event.setQrStartDate(LocalDate.parse(qrStartDate));
        }
        if (qrEndDate != null && !qrEndDate.isBlank()) {
            event.setQrEndDate(LocalDate.parse(qrEndDate));
        }

        eventRepository.save(event);

        return Map.of(
                "eventCode", event.getEventCode(),
                "groomName", event.getGroomName(),
                "brideName", event.getBrideName(),
                "weddingDate", event.getWeddingDate() == null ? "" : event.getWeddingDate().toString(),
                "qrStartDate", event.getQrStartDate() == null ? "" : event.getQrStartDate().toString(),
                "qrEndDate", event.getQrEndDate() == null ? "" : event.getQrEndDate().toString()
        );
    }

    @GetMapping("/{eventCode}")
    public Map<String, Object> getEvent(@PathVariable String eventCode) {
        return buildEventResponse(getActiveEvent(eventCode));
    }

    @DeleteMapping("/{eventCode}")
    public Map<String, Object> softDeleteEvent(@PathVariable String eventCode) {
        WeddingEvent event = eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));

        event.setDeleted(true);
        event.setDeletedAt(java.time.LocalDateTime.now());
        eventRepository.save(event);

        return Map.of("success", true, "eventCode", eventCode);
    }

    @PostMapping("/{eventCode}/gallery")
    public Map<String, Object> uploadGallery(@PathVariable String eventCode,
                                              @RequestParam(required = false) MultipartFile invitation,
                                              @RequestParam(required = false) MultipartFile[] photos) throws Exception {
        WeddingEvent event = getActiveEvent(eventCode);

        File dir = storageProperties.getUploadPath().resolve(eventCode).toFile();
        if (!dir.exists()) dir.mkdirs();

        int count = 0;

        if (invitation != null && !invitation.isEmpty()) {
            String name = "invitation_" + UUID.randomUUID() + "_" + invitation.getOriginalFilename();
            Path path = Path.of(dir.getAbsolutePath(), name);
            Files.copy(invitation.getInputStream(), path);
            count++;
        }

        if (photos != null) {
            for (MultipartFile f : photos) {
                if (!f.isEmpty()) {
                    String name = UUID.randomUUID() + "_" + f.getOriginalFilename();
                    Path path = Path.of(dir.getAbsolutePath(), name);
                    Files.copy(f.getInputStream(), path);
                    count++;
                }
            }
        }

        return Map.of("success", true, "count", count);
    }

    private WeddingEvent getActiveEvent(String eventCode) {
        WeddingEvent event = eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));

        if (event.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제된 행사입니다.");
        }

        return event;
    }

    private Map<String, Object> buildEventResponse(WeddingEvent event) {
        LocalDate today = LocalDate.now();
        LocalDate availableFrom = event.getWeddingDate() != null ? event.getWeddingDate() : event.getQrStartDate();
        LocalDate availableUntil = event.getQrEndDate();

        boolean beforeStart = availableFrom != null && today.isBefore(availableFrom);
        boolean afterEnd = availableUntil != null && today.isAfter(availableUntil);
        boolean entryOpen = !beforeStart && !afterEnd;

        String status;
        String statusMessage;
        if (beforeStart) {
            status = "before_start";
            statusMessage = "아직 결혼식이 시작되지 않았어요.";
        } else if (afterEnd) {
            status = "ended";
            statusMessage = "이 웨딩 페이지는 운영 기간이 종료되었어요.";
        } else {
            status = "active";
            statusMessage = "입장 가능한 웨딩 페이지예요.";
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", event.getId());
        map.put("eventCode", event.getEventCode());
        map.put("groomName", event.getGroomName());
        map.put("brideName", event.getBrideName());
        map.put("createdAt", event.getCreatedAt());
        map.put("weddingDate", event.getWeddingDate());
        map.put("qrStartDate", event.getQrStartDate());
        map.put("qrEndDate", event.getQrEndDate());
        map.put("entryOpen", entryOpen);
        map.put("status", status);
        map.put("statusMessage", statusMessage);
        map.put("availableFrom", availableFrom == null ? "" : availableFrom.toString());
        map.put("availableUntil", availableUntil == null ? "" : availableUntil.toString());
        return map;
    }
}

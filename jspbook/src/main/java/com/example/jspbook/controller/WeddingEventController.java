package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.PhotoRepository;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import com.example.jspbook.service.OperationLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/events")
public class WeddingEventController {

    private static final String INVITATION_PREFIX = "invitation_";
    private static final int MAX_FAQ_ITEMS = 5;
    private static final int MAX_TIMELINE_ITEMS = 8;
    private static final TypeReference<List<Map<String, String>>> STRING_MAP_LIST = new TypeReference<>() {};

    private final WeddingEventRepository eventRepository;
    private final PostRepository postRepository;
    @SuppressWarnings("unused")
    private final PhotoRepository photoRepository;
    private final StorageProperties storageProperties;
    private final OperationLogService operationLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public WeddingEventController(WeddingEventRepository eventRepository,
                                  PostRepository postRepository,
                                  PhotoRepository photoRepository,
                                  StorageProperties storageProperties,
                                  OperationLogService operationLogService) {
        this.eventRepository = eventRepository;
        this.postRepository = postRepository;
        this.photoRepository = photoRepository;
        this.storageProperties = storageProperties;
        this.operationLogService = operationLogService;
    }

    public List<Map<String, Object>> listEvents() {
        return listEvents(null);
    }

    @GetMapping
    public List<Map<String, Object>> listEvents(HttpSession session) {
        List<WeddingEvent> events = eventRepository.findAll().stream()
                .map(this::ensureAdminCode)
                .filter(event -> !event.isDeleted())
                .sorted(Comparator
                        .comparing(WeddingEvent::getWeddingDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(WeddingEvent::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        List<Post> allPosts = postRepository.findAll();
        Map<Long, List<Post>> postsByEvent = allPosts.stream()
                .collect(Collectors.groupingBy(p -> p.getEvent().getId()));
        boolean operatorAuthenticated = OperatorAuthController.isAuthenticated(session);

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
            map.put("faqCount", readFaqItems(event).size());
            map.put("timelineCount", readTimelineItems(event).size());
            if (operatorAuthenticated) {
                map.put("adminCode", event.getAdminCode());
            }
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping
    public Map<String, Object> createEvent(@RequestBody Map<String, Object> body) {
        String groomName = stringValue(body.get("groomName"));
        String brideName = stringValue(body.get("brideName"));
        String weddingDate = stringValue(body.get("weddingDate"));
        String qrStartDate = stringValue(body.get("qrStartDate"));
        String qrEndDate = stringValue(body.get("qrEndDate"));

        WeddingEvent event = new WeddingEvent();
        event.setGroomName(groomName);
        event.setBrideName(brideName);
        event.setEventCode(UUID.randomUUID().toString().substring(0, 8));
        event.setAdminCode(generateAdminCode());
        if (!weddingDate.isBlank()) {
            event.setWeddingDate(LocalDate.parse(weddingDate));
        }
        if (!qrStartDate.isBlank()) {
            event.setQrStartDate(LocalDate.parse(qrStartDate));
        }
        if (!qrEndDate.isBlank()) {
            event.setQrEndDate(LocalDate.parse(qrEndDate));
        }
        event.setFaqJson(writeJson(normalizeFaqItems(body.get("faqItems"))));
        event.setTimelineJson(writeJson(normalizeTimelineItems(body.get("timelineItems"))));

        eventRepository.save(event);
        operationLogService.logSiteCreated(event, readFaqItems(event).size(), readTimelineItems(event).size());
        return buildEventResponse(event, true);
    }

    @GetMapping("/{eventCode}")
    public Map<String, Object> getEvent(@PathVariable String eventCode) {
        return buildEventResponse(getActiveEvent(eventCode), false);
    }

    @DeleteMapping("/{eventCode}")
    public Map<String, Object> softDeleteEvent(@PathVariable String eventCode) {
        WeddingEvent event = eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));

        event.setDeleted(true);
        event.setDeletedAt(java.time.LocalDateTime.now());
        eventRepository.save(event);
        operationLogService.logSiteDeleted(event);

        return Map.of("success", true, "eventCode", eventCode);
    }

    @PostMapping("/{eventCode}/gallery")
    public Map<String, Object> uploadGallery(@PathVariable String eventCode,
                                             @RequestParam(required = false) MultipartFile invitation,
                                             @RequestParam(required = false) MultipartFile[] photos,
                                             @RequestParam(required = false) String invitationUrl) throws Exception {
        WeddingEvent event = getActiveEvent(eventCode);

        Path dir = storageProperties.getUploadPath().resolve(eventCode);
        Files.createDirectories(dir);

        int count = 0;

        String normalizedInvitationUrl = invitationUrl == null ? "" : invitationUrl.trim();
        if (!normalizedInvitationUrl.isEmpty()) {
            deleteInvitationFiles(dir);
            event.setInvitationUrl(normalizedInvitationUrl);
            eventRepository.save(event);
        }

        if (invitation != null && !invitation.isEmpty()) {
            deleteInvitationFiles(dir);
            String name = INVITATION_PREFIX + UUID.randomUUID() + "_" + Objects.requireNonNullElse(invitation.getOriginalFilename(), "image");
            Path path = dir.resolve(name);
            Files.copy(invitation.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            event.setInvitationUrl("");
            eventRepository.save(event);
            count++;
        }

        if (photos != null) {
            for (MultipartFile f : photos) {
                if (!f.isEmpty()) {
                    String name = UUID.randomUUID() + "_" + Objects.requireNonNullElse(f.getOriginalFilename(), "photo");
                    Path path = dir.resolve(name);
                    Files.copy(f.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                    count++;
                }
            }
        }

        Map<String, Object> response = buildEventResponse(event, true);
        response.put("success", true);
        response.put("count", count);
        operationLogService.logGalleryUpdated(event, countPhotoFiles(photos), invitation != null && !invitation.isEmpty(), !normalizedInvitationUrl.isEmpty());
        return response;
    }

    private WeddingEvent getActiveEvent(String eventCode) {
        WeddingEvent event = eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));

        event = ensureAdminCode(event);

        if (event.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제된 행사입니다.");
        }

        return event;
    }

    private WeddingEvent ensureAdminCode(WeddingEvent event) {
        if (event == null) {
            return null;
        }
        String adminCode = event.getAdminCode();
        if (adminCode != null && !adminCode.isBlank()) {
            return event;
        }
        event.setAdminCode(generateAdminCode());
        eventRepository.save(event);
        return event;
    }

    private Map<String, Object> buildEventResponse(WeddingEvent event, boolean includeAdminCode) {
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

        GalleryAssets assets = readGalleryAssets(event.getEventCode());
        List<Map<String, String>> faqItems = readFaqItems(event);
        List<Map<String, String>> timelineItems = readTimelineItems(event);

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
        map.put("invitationUrl", event.getInvitationUrl() == null ? "" : event.getInvitationUrl());
        map.put("invitationImageUrl", assets.invitationImageUrl());
        map.put("weddingPhotos", assets.weddingPhotos());
        map.put("galleryCount", assets.weddingPhotos().size());
        map.put("faqItems", faqItems);
        map.put("faqCount", faqItems.size());
        map.put("timelineItems", timelineItems);
        map.put("timelineCount", timelineItems.size());
        if (includeAdminCode && event.getAdminCode() != null && !event.getAdminCode().isBlank()) {
            map.put("adminCode", event.getAdminCode());
        }
        return map;
    }

    private List<Map<String, String>> readFaqItems(WeddingEvent event) {
        return normalizeFaqItems(readJsonList(event.getFaqJson()));
    }

    private List<Map<String, String>> readTimelineItems(WeddingEvent event) {
        return normalizeTimelineItems(readJsonList(event.getTimelineJson()));
    }

    private List<Map<String, String>> readJsonList(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, String>> parsed = objectMapper.readValue(rawJson, STRING_MAP_LIST);
            return parsed == null ? List.of() : parsed;
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Map<String, String>> normalizeFaqItems(Object rawItems) {
        List<Map<String, String>> result = new ArrayList<>();
        if (!(rawItems instanceof List<?> list)) {
            return result;
        }

        for (Object rawItem : list) {
            if (!(rawItem instanceof Map<?, ?> itemMap)) {
                continue;
            }
            String q = stringValue(itemMap.get("q"));
            String a = stringValue(itemMap.get("a"));
            if (q.isBlank()) continue;

            Map<String, String> item = new LinkedHashMap<>();
            item.put("q", truncate(q, 50));
            item.put("a", truncate(a, 150));
            result.add(item);
            if (result.size() >= MAX_FAQ_ITEMS) break;
        }
        return result;
    }

    private List<Map<String, String>> normalizeTimelineItems(Object rawItems) {
        List<Map<String, String>> result = new ArrayList<>();
        if (!(rawItems instanceof List<?> list)) {
            return result;
        }

        for (Object rawItem : list) {
            if (!(rawItem instanceof Map<?, ?> itemMap)) {
                continue;
            }
            String time = truncate(stringValue(itemMap.get("time")), 20);
            String title = truncate(stringValue(itemMap.get("title")), 50);
            String desc = truncate(stringValue(itemMap.get("desc")), 150);
            if (time.isBlank() && title.isBlank() && desc.isBlank()) continue;
            if (title.isBlank()) continue;

            Map<String, String> item = new LinkedHashMap<>();
            item.put("time", time);
            item.put("title", title);
            item.put("desc", desc);
            result.add(item);
            if (result.size() >= MAX_TIMELINE_ITEMS) break;
        }
        return result;
    }

    private String writeJson(List<Map<String, String>> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "행사 설정을 저장하지 못했어요.", e);
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String generateAdminCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 8; i++) {
            builder.append(chars.charAt(random.nextInt(chars.length())));
        }
        return builder.toString();
    }

    private int countPhotoFiles(MultipartFile[] photos) {
        if (photos == null) {
            return 0;
        }
        int count = 0;
        for (MultipartFile photo : photos) {
            if (photo != null && !photo.isEmpty()) {
                count++;
            }
        }
        return count;
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }

    private GalleryAssets readGalleryAssets(String eventCode) {
        Path dir = storageProperties.getUploadPath().resolve(eventCode);
        if (!Files.isDirectory(dir)) {
            return new GalleryAssets("", List.of());
        }

        try (Stream<Path> stream = Files.list(dir)) {
            List<Path> files = stream
                    .filter(Files::isRegularFile)
                    .sorted(Comparator.comparing((Path path) -> path.getFileName().toString()))
                    .toList();

            String invitationImageUrl = files.stream()
                    .map(path -> path.getFileName().toString())
                    .filter(name -> name.startsWith(INVITATION_PREFIX))
                    .findFirst()
                    .map(name -> toUploadUrl(eventCode, name))
                    .orElse("");

            List<String> weddingPhotos = files.stream()
                    .map(path -> path.getFileName().toString())
                    .filter(name -> !name.startsWith(INVITATION_PREFIX))
                    .map(name -> toUploadUrl(eventCode, name))
                    .toList();

            return new GalleryAssets(invitationImageUrl, weddingPhotos);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "갤러리 파일을 읽지 못했어요.", e);
        }
    }

    private void deleteInvitationFiles(Path dir) throws IOException {
        if (!Files.isDirectory(dir)) {
            return;
        }

        try (Stream<Path> stream = Files.list(dir)) {
            for (Path path : stream.filter(Files::isRegularFile).toList()) {
                String name = path.getFileName().toString();
                if (name.startsWith(INVITATION_PREFIX)) {
                    Files.deleteIfExists(path);
                }
            }
        }
    }

    private String toUploadUrl(String eventCode, String fileName) {
        return "/uploads/" + eventCode + "/" + fileName;
    }

    private record GalleryAssets(String invitationImageUrl, List<String> weddingPhotos) {
    }
}

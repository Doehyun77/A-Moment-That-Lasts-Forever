package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.Photo;
import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.guest.GuestSessionInfo;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final String LIKED_POST_IDS = "LIKED_POST_IDS";

	private final PostRepository postRepository;
	private final WeddingEventRepository eventRepository;
	private final StorageProperties storageProperties;

	@Autowired
	public PostController(PostRepository postRepository, WeddingEventRepository eventRepository, StorageProperties storageProperties) {
		this.postRepository = postRepository;
		this.eventRepository = eventRepository;
		this.storageProperties = storageProperties;

	}


	@PostMapping
	public Map<String, Object> createPost(@RequestParam String eventCode, @RequestParam String guestName,
			@RequestParam String side, @RequestParam String category, @RequestParam(required = false) String message,
			@RequestParam(required = false) MultipartFile[] photos, HttpSession session) throws Exception {

		GuestSessionInfo guest = GuestSessionController.getSessionInfo(session, eventCode);
		if (guest == null) {
			return Map.of("success", false, "error", "입장 정보가 만료되었어요. 다시 입장해 주세요.");
		}

		WeddingEvent event = eventRepository.findByEventCode(eventCode)
				.orElseThrow(() -> new RuntimeException("행사를 찾을 수 없습니다."));

		Post post = new Post();
		post.setEvent(event);
		if (event == null) {
			throw new RuntimeException("event 없음");
		}
		post.setGuestName(guest.getNick());
		post.setSide(guest.getSide());
		post.setCategory(guest.getCategory());
		post.setMessage(message);
		post.setOwnerSessionId(guest.getOwnerSessionId());

		File dir = storageProperties.getUploadPath().toFile();
		if (!dir.exists()) {
			dir.mkdirs();
		}

		if (photos != null) {
			for (MultipartFile file : photos) {
				if (!file.isEmpty()) {
					String savedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
					Path savePath = storageProperties.getUploadPath().resolve(savedName);
					Files.copy(file.getInputStream(), savePath);

					Photo photo = new Photo();
					photo.setPost(post);
					photo.setFileName(file.getOriginalFilename());
					photo.setFilePath("/uploads/" + savedName);

					post.getPhotos().add(photo);
				}
			}
		}

		postRepository.save(post);

		return Map.of("success", true);
	}

	@GetMapping
	public List<Map<String, Object>> getPosts(@RequestParam String eventCode, HttpSession session) {
		WeddingEvent event = eventRepository.findByEventCode(eventCode)
				.orElseThrow(() -> new RuntimeException("행사를 찾을 수 없습니다."));
		GuestSessionInfo guest = GuestSessionController.getSessionInfo(session, eventCode);
		Set<Long> likedPostIds = getLikedPostIds(session);
		boolean isAdmin = AdminSessionController.isAuthenticatedForEvent(session, eventCode);

		return postRepository.findByEventOrderByCreatedAtDesc(event).stream().map(post -> {
			Map<String, Object> map = new HashMap<>();
			String nick = resolveNick(post);
			map.put("id", post.getId());
			map.put("name", nick);
			map.put("nick", nick);
			map.put("displayName", buildDisplayName(post.getSide(), post.getCategory(), nick));
			map.put("side", post.getSide());
			map.put("category", post.getCategory());
			map.put("msg", post.getMessage());
			map.put("likes", post.getLikes());
            map.put("liked", likedPostIds.contains(post.getId()));
			map.put("time", post.getCreatedAt().toLocalTime().toString().substring(0, 5));
			map.put("photos", post.getPhotos().stream().map(Photo::getFilePath).toList());
			map.put("canDelete", canDeleteWithSession(post, guest));
            map.put("canAdminDelete", isAdmin);
			return map;
		}).toList();
	}

	private String resolveNick(Post post) {
		String guestName = safe(post.getGuestName());
		String side = safe(post.getSide());
		String category = safe(post.getCategory());
		String prefix = buildPrefix(side, category);
		if (!prefix.isBlank() && guestName.startsWith(prefix)) {
			String stripped = guestName.substring(prefix.length()).trim();
			if (!stripped.isBlank()) {
				return stripped;
			}
		}
		return guestName;
	}

	private String buildDisplayName(String side, String category, String nick) {
		String prefix = buildPrefix(side, category);
		String safeNick = safe(nick);
		if (prefix.isBlank()) return safeNick;
		if (safeNick.isBlank()) return prefix;
		return prefix + " " + safeNick;
	}

	private String buildPrefix(String side, String category) {
		String safeSide = safe(side);
		String safeCategory = safe(category);
		if (safeSide.isBlank() && safeCategory.isBlank()) return "";
		if (safeSide.isBlank()) return safeCategory;
		if (safeCategory.isBlank()) return safeSide;
		return safeSide + " " + safeCategory;
	}

	private String safe(String value) {
		return value == null ? "" : value.trim();
	}

	@DeleteMapping("/{postId}")
	public Map<String, Object> deletePost(@PathVariable Long postId, HttpSession session) {
		Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("게시물을 찾을 수 없습니다."));
        if (AdminSessionController.isAuthenticatedForEvent(session, post.getEvent().getEventCode())) {
            postRepository.delete(post);
            return Map.of("success", true, "deletedBy", "admin");
        }
		GuestSessionInfo guest = GuestSessionController.getSessionInfo(session, post.getEvent().getEventCode());

		if (!canDeleteWithSession(post, guest)) {
			return Map.of("success", false, "error", "본인 세션에서 작성한 게시물만 삭제할 수 있어요.");
		}

		postRepository.delete(post);

		return Map.of("success", true, "deletedBy", "owner");
	}

    @PostMapping("/{postId}/like-toggle")
    public Map<String, Object> toggleLike(@PathVariable Long postId, HttpSession session) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("게시물을 찾을 수 없습니다."));
        Set<Long> likedPostIds = getLikedPostIds(session);
        boolean liked;

        if (likedPostIds.contains(postId)) {
            likedPostIds.remove(postId);
            post.setLikes(Math.max(0, post.getLikes() - 1));
            liked = false;
        } else {
            likedPostIds.add(postId);
            post.setLikes(post.getLikes() + 1);
            liked = true;
        }

        session.setAttribute(LIKED_POST_IDS, likedPostIds);
        postRepository.save(post);
        return Map.of("success", true, "liked", liked, "likes", post.getLikes(), "postId", postId);
    }

	private boolean canDeleteWithSession(Post post, GuestSessionInfo guest) {
		return guest != null
				&& post.getOwnerSessionId() != null
				&& post.getEvent() != null
				&& Objects.equals(post.getEvent().getEventCode(), guest.getEventCode())
				&& Objects.equals(post.getOwnerSessionId(), guest.getOwnerSessionId());
	}

    @SuppressWarnings("unchecked")
    private Set<Long> getLikedPostIds(HttpSession session) {
        if (session == null) return new HashSet<>();
        Object value = session.getAttribute(LIKED_POST_IDS);
        if (value instanceof Set<?>) {
            Set<Long> result = new HashSet<>();
            for (Object item : (Set<?>) value) {
                if (item instanceof Long id) {
                    result.add(id);
                } else if (item instanceof Integer id) {
                    result.add(id.longValue());
                }
            }
            return result;
        }
        return new HashSet<>();
    }
}

package com.example.jspbook.controller;

import com.example.jspbook.entity.Photo;
import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

	private final PostRepository postRepository;
	private final WeddingEventRepository eventRepository;

	@Value("${file.upload-dir}")
	private String uploadDir;

	public PostController(PostRepository postRepository, WeddingEventRepository eventRepository) {
		this.postRepository = postRepository;
		this.eventRepository = eventRepository;

	}

	@PostMapping
	public Map<String, Object> createPost(@RequestParam String eventCode, @RequestParam String guestName,
			@RequestParam String side, @RequestParam String category, @RequestParam(required = false) String message,
			@RequestParam String deletePin, @RequestParam(required = false) MultipartFile[] photos) throws Exception {

		WeddingEvent event = eventRepository.findByEventCode(eventCode)
				.orElseThrow(() -> new RuntimeException("행사를 찾을 수 없습니다."));

		Post post = new Post();
		post.setEvent(event);
		if (event == null) {
			throw new RuntimeException("event 없음");
		}
		post.setGuestName(guestName);
		post.setSide(side);
		post.setCategory(category);
		post.setMessage(message);
		post.setDeletePin(deletePin);

		File dir = new File(uploadDir);
		if (!dir.exists()) {
			dir.mkdirs();
		}

		if (photos != null) {
			for (MultipartFile file : photos) {
				if (!file.isEmpty()) {
					String savedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
					Path savePath = Path.of(uploadDir, savedName);
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
	public List<Map<String, Object>> getPosts(@RequestParam String eventCode) {
		WeddingEvent event = eventRepository.findByEventCode(eventCode)
				.orElseThrow(() -> new RuntimeException("행사를 찾을 수 없습니다."));

		return postRepository.findByEventOrderByCreatedAtDesc(event).stream().map(post -> {
			Map<String, Object> map = new HashMap<>();
			map.put("id", post.getId());
			map.put("name", post.getGuestName());
			map.put("side", post.getSide());
			map.put("category", post.getCategory());
			map.put("msg", post.getMessage());
			map.put("likes", post.getLikes());
			map.put("time", post.getCreatedAt().toLocalTime().toString().substring(0, 5));
			map.put("photos", post.getPhotos().stream().map(Photo::getFilePath).toList());
			return map;
		}).toList();
	}

	@DeleteMapping("/{postId}")
	public Map<String, Object> deletePost(@PathVariable Long postId, @RequestBody Map<String, String> body) {
		String pin = body.get("pin");

		Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("게시물을 찾을 수 없습니다."));

		if (!post.getDeletePin().equals(pin)) {
			return Map.of("success", false, "error", "삭제 번호가 다릅니다.");
		}

		postRepository.delete(post);

		return Map.of("success", true);
	}
}
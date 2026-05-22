package com.example.jspbook.repository;

import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
	List<Post> findByEventOrderByCreatedAtDesc(WeddingEvent event);
}

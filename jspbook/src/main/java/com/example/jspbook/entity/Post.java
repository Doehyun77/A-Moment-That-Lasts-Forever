package com.example.jspbook.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "post")
public class Post {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "event_id")
	private WeddingEvent event;

	@Column(name = "guest_name")
	private String guestName;

	private String side;

	private String category;

	@Column(columnDefinition = "TEXT")
	private String message;

	@Column(name = "delete_pin")
	private String deletePin;

	private int likes = 0;

	@Column(name = "created_at")
	private LocalDateTime createdAt = LocalDateTime.now();

	@OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Photo> photos = new ArrayList<>();

	public Long getId() {
		return id;
	}

	public WeddingEvent getEvent() {
		return event;
	}

	public String getGuestName() {
		return guestName;
	}

	public String getSide() {
		return side;
	}

	public String getCategory() {
		return category;
	}

	public String getMessage() {
		return message;
	}

	public String getDeletePin() {
		return deletePin;
	}

	public int getLikes() {
		return likes;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public List<Photo> getPhotos() {
		return photos;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public void setEvent(WeddingEvent event) {
		this.event = event;
	}

	public void setGuestName(String guestName) {
		this.guestName = guestName;
	}

	public void setSide(String side) {
		this.side = side;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public void setDeletePin(String deletePin) {
		this.deletePin = deletePin;
	}

	public void setLikes(int likes) {
		this.likes = likes;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
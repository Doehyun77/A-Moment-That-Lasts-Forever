package com.example.jspbook.controller;

import com.example.jspbook.config.StorageProperties;
import com.example.jspbook.entity.Post;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.guest.GuestSessionInfo;
import com.example.jspbook.repository.PostRepository;
import com.example.jspbook.repository.WeddingEventRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class GuestSessionPostControllerTest {

    private static StorageProperties testStorageProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setRootDir("var-test");
        properties.setUploadDir("uploads-test");
        return properties;
    }

    @Test
    void enterGuest_storesSessionAndReturnsGuest() {
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        GuestSessionController controller = new GuestSessionController(eventRepository);
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");
        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));

        Map<String, Object> result = controller.enterGuest(Map.of(
                "eventCode", "event1234",
                "nick", "민수",
                "category", "대학동기",
                "side", "신랑"
        ), session);

        assertThat(result.get("success")).isEqualTo(true);
        GuestSessionInfo stored = (GuestSessionInfo) session.getAttribute(GuestSessionInfo.SESSION_KEY);
        assertThat(stored).isNotNull();
        assertThat(stored.getEventCode()).isEqualTo("event1234");
        assertThat(stored.getNick()).isEqualTo("민수");
        assertThat(stored.getDisplayName()).isEqualTo("신랑 대학동기 민수");
    }

    @Test
    void getPosts_marksOwnedPostDeletableForSameSession() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        GuestSessionInfo guest = GuestSessionInfo.create("event1234", "민수", "대학동기", "신랑");
        session.setAttribute(GuestSessionInfo.SESSION_KEY, guest);

        Post post = new Post();
        post.setId(1L);
        post.setEvent(event);
        post.setGuestName(guest.getNick());
        post.setSide(guest.getSide());
        post.setCategory(guest.getCategory());
        post.setOwnerSessionId(guest.getOwnerSessionId());

        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));
        when(postRepository.findByEventOrderByCreatedAtDesc(event)).thenReturn(List.of(post));

        List<Map<String, Object>> result = controller.getPosts("event1234", session);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("name")).isEqualTo("민수");
        assertThat(result.get(0).get("nick")).isEqualTo("민수");
        assertThat(result.get(0).get("displayName")).isEqualTo("신랑 대학동기 민수");
        assertThat(result.get(0).get("canDelete")).isEqualTo(true);
    }

    @Test
    void getPosts_normalizesLegacyDisplayNameIntoPureNick() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        GuestSessionInfo guest = GuestSessionInfo.create("event1234", "최도현", "고등친구", "신랑");
        session.setAttribute(GuestSessionInfo.SESSION_KEY, guest);

        Post legacyPost = new Post();
        legacyPost.setId(2L);
        legacyPost.setEvent(event);
        legacyPost.setGuestName("신랑 고등친구 최도현");
        legacyPost.setSide("신랑");
        legacyPost.setCategory("고등친구");
        legacyPost.setOwnerSessionId(guest.getOwnerSessionId());

        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));
        when(postRepository.findByEventOrderByCreatedAtDesc(event)).thenReturn(List.of(legacyPost));

        List<Map<String, Object>> result = controller.getPosts("event1234", session);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("name")).isEqualTo("최도현");
        assertThat(result.get(0).get("nick")).isEqualTo("최도현");
        assertThat(result.get(0).get("displayName")).isEqualTo("신랑 고등친구 최도현");
    }

    @Test
    void deletePost_allowsOwnerSessionWithoutPin() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        HttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        GuestSessionInfo guest = GuestSessionInfo.create("event1234", "민수", "대학동기", "신랑");
        session.setAttribute(GuestSessionInfo.SESSION_KEY, guest);

        Post post = new Post();
        post.setId(1L);
        post.setEvent(event);
        post.setOwnerSessionId(guest.getOwnerSessionId());

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        Map<String, Object> result = controller.deletePost(1L, session);

        assertThat(result.get("success")).isEqualTo(true);
        verify(postRepository).delete(post);
    }

    @Test
    void deletePost_rejectsDifferentSession() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        HttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        GuestSessionInfo owner = GuestSessionInfo.create("event1234", "민수", "대학동기", "신랑");
        GuestSessionInfo other = GuestSessionInfo.create("event1234", "철수", "대학동기", "신랑");
        session.setAttribute(GuestSessionInfo.SESSION_KEY, other);

        Post post = new Post();
        post.setId(1L);
        post.setEvent(event);
        post.setOwnerSessionId(owner.getOwnerSessionId());

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        Map<String, Object> fail = controller.deletePost(1L, session);
        assertThat(fail.get("success")).isEqualTo(false);
        assertThat(fail.get("error")).isEqualTo("본인 세션에서 작성한 게시물만 삭제할 수 있어요.");
        verify(postRepository, never()).delete(post);
    }

    @Test
    void deletePost_allowsAdminSessionToForceDeleteOtherGuestPost() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        HttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        Post post = new Post();
        post.setId(7L);
        post.setEvent(event);
        post.setOwnerSessionId("owner-session");
        session.setAttribute("ADMIN_AUTHENTICATED", true);

        when(postRepository.findById(7L)).thenReturn(Optional.of(post));

        Map<String, Object> result = controller.deletePost(7L, session);

        assertThat(result.get("success")).isEqualTo(true);
        verify(postRepository).delete(post);
    }

    @Test
    void toggleLike_persistsCountAndTogglesSessionLikeState() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        HttpSession session = new MockHttpSession();

        Post post = new Post();
        post.setId(3L);
        post.setLikes(0);

        when(postRepository.findById(3L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> liked = controller.toggleLike(3L, session);
        assertThat(liked.get("success")).isEqualTo(true);
        assertThat(liked.get("liked")).isEqualTo(true);
        assertThat(liked.get("likes")).isEqualTo(1);

        Map<String, Object> unliked = controller.toggleLike(3L, session);
        assertThat(unliked.get("success")).isEqualTo(true);
        assertThat(unliked.get("liked")).isEqualTo(false);
        assertThat(unliked.get("likes")).isEqualTo(0);
    }

    @Test
    void getPosts_marksPostLikedWhenCurrentSessionAlreadyLikedIt() {
        PostRepository postRepository = mock(PostRepository.class);
        WeddingEventRepository eventRepository = mock(WeddingEventRepository.class);
        PostController controller = new PostController(postRepository, eventRepository, testStorageProperties());
        MockHttpSession session = new MockHttpSession();

        WeddingEvent event = new WeddingEvent();
        event.setEventCode("event1234");

        Post post = new Post();
        post.setId(9L);
        post.setEvent(event);
        post.setGuestName("민수");
        post.setSide("신랑");
        post.setCategory("대학동기");
        post.setLikes(2);

        session.setAttribute("LIKED_POST_IDS", new java.util.HashSet<>(java.util.Set.of(9L)));
        when(eventRepository.findByEventCode("event1234")).thenReturn(Optional.of(event));
        when(postRepository.findByEventOrderByCreatedAtDesc(event)).thenReturn(List.of(post));

        List<Map<String, Object>> result = controller.getPosts("event1234", session);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("liked")).isEqualTo(true);
        assertThat(result.get(0).get("likes")).isEqualTo(2);
    }
}

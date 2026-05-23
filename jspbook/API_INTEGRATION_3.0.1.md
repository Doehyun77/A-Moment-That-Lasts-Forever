# jspbook 3.0.1 API Integration

## 반영 파일

- `pom.xml`
  - 프로젝트 버전을 `3.0.1`로 올렸습니다.

- `src/main/webapp/js/api.js`
  - 기존 프론트 전역 함수명을 유지하면서 Spring Boot 백엔드 API를 실제 호출하도록 교체했습니다.
  - 모든 요청은 세션 쿠키 유지를 위해 `credentials: 'include'`로 전송됩니다.
  - 같은 서버에서 HTML을 띄우면 별도 설정 없이 동작합니다.
  - HTML을 다른 포트에서 띄우는 경우 아래처럼 API 서버 주소를 지정할 수 있습니다.

```html
<script>
  window.JSPBOOK_API_BASE_URL = 'http://localhost:8080';
</script>
```

- `src/main/java/com/example/jspbook/config/CorsConfig.java`
  - HTML을 `localhost:5500`, `localhost:3000` 등 다른 개발 서버에서 열 때도 `/api/**` 호출이 가능하도록 CORS를 허용합니다.

- `src/main/webapp/js/upload.js`
  - 하객이 미리보기에서 사진을 삭제했을 때 실제 업로드 파일 목록에서도 같이 제거되도록 수정했습니다.

## 연결되는 주요 기능

- 운영자 로그인/상태 확인/로그아웃
- 웨딩 이벤트 생성 및 이벤트 코드 발급
- 이벤트 목록 조회와 지난 행사 숨김 처리
- QR 링크로 하객 입장
- 하객 세션 저장/조회/초기화
- 사진/메시지 게시글 업로드
- 행사별 게시글/사진 목록 조회
- 좋아요 토글
- 본인 게시글 삭제 및 관리자 삭제

## 백엔드 엔드포인트

| 기능 | Method | Path |
| --- | --- | --- |
| 이벤트 목록 | GET | `/api/events` |
| 이벤트 생성 | POST | `/api/events` |
| 이벤트 조회 | GET | `/api/events/{eventCode}` |
| 이벤트 숨김 | DELETE | `/api/events/{eventCode}` |
| 청첩장/웨딩 사진 업로드 | POST | `/api/events/{eventCode}/gallery` |
| 하객 입장 | POST | `/api/guest-session/enter` |
| 하객 세션 조회 | GET | `/api/guest-session?eventCode=...` |
| 하객 세션 초기화 | DELETE | `/api/guest-session?eventCode=...` |
| 운영자 로그인 | POST | `/api/operator/login` |
| 운영자 상태 | GET | `/api/operator/status` |
| 운영자 로그아웃 | DELETE | `/api/operator/logout` |
| 관리자 코드 로그인 | POST | `/api/admin-session/login` |
| 관리자 상태 | GET | `/api/admin-session` |
| 게시글 업로드 | POST | `/api/posts` |
| 게시글 목록 | GET | `/api/posts?eventCode=...` |
| 게시글 삭제 | DELETE | `/api/posts/{postId}` |
| 좋아요 토글 | POST | `/api/posts/{postId}/like-toggle` |

## 남은 주의점

현재 백엔드의 `/api/events/{eventCode}/gallery`는 파일 저장 후 저장된 이미지 경로를 DB에 연결해서 다시 내려주는 구조가 아직 약합니다. 청첩장/웨딩 대표 사진을 하객 화면에서 계속 보여주려면 이벤트 갤러리 조회 API와 DB 필드가 추가로 필요합니다.

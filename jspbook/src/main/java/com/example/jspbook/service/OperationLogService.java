package com.example.jspbook.service;

import com.example.jspbook.entity.OperatorLog;
import com.example.jspbook.entity.WeddingEvent;
import com.example.jspbook.repository.OperatorLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OperationLogService {

    private static final int MAX_LOGS = 50;

    private final OperatorLogRepository operatorLogRepository;

    public OperationLogService(OperatorLogRepository operatorLogRepository) {
        this.operatorLogRepository = operatorLogRepository;
    }

    @Transactional(readOnly = true)
    public List<OperatorLog> listRecentLogs() {
        List<OperatorLog> logs = operatorLogRepository.findAllByOrderByCreatedAtDescIdDesc();
        return logs.size() <= MAX_LOGS ? logs : logs.subList(0, MAX_LOGS);
    }

    @Transactional
    public void logSiteCreated(WeddingEvent event, int faqCount, int timelineCount) {
        save("SITE_CREATED", "success", event, "사이트가 생성되었습니다",
                String.format("FAQ %d개 · 타임테이블 %d개 · 관리자 코드 발급", faqCount, timelineCount));
    }

    @Transactional
    public void logAdminLoginSuccess(WeddingEvent event) {
        save("ADMIN_LOGIN", "success", event, "관리자 페이지 입장에 성공했습니다", "관리자 코드 인증 완료");
    }

    @Transactional
    public void logAdminLoginFailure(String eventCode, WeddingEvent event, String reason) {
        save("ADMIN_LOGIN", "fail", eventCode, siteLabel(event, eventCode), "관리자 페이지 입장에 실패했습니다", reason);
    }

    @Transactional
    public void logGalleryUpdated(WeddingEvent event, int photoCount, boolean invitationImageUpdated, boolean invitationLinkUpdated) {
        StringBuilder detail = new StringBuilder();
        if (photoCount > 0) {
            detail.append("웨딩 사진 ").append(photoCount).append("장 업로드");
        }
        if (invitationImageUpdated) {
            appendDetail(detail, "청첩장 이미지 변경");
        }
        if (invitationLinkUpdated) {
            appendDetail(detail, "청첩장 링크 변경");
        }
        if (detail.length() == 0) {
            detail.append("갤러리 자산이 업데이트되었습니다");
        }
        save("GALLERY_UPDATED", "success", event, "갤러리 자산이 변경되었습니다", detail.toString());
    }

    @Transactional
    public void logSiteDeleted(WeddingEvent event) {
        save("SITE_DELETED", "warning", event, "사이트가 숨김 처리되었습니다", "사이트 관리 목록에서 제외됩니다");
    }

    @Transactional
    public void logOperatorEvent(String logType, String status, String message, String detail) {
        save(logType, status, null, "운영자 콘솔", message, detail);
    }

    private void appendDetail(StringBuilder detail, String text) {
        if (detail.length() > 0) {
            detail.append(" · ");
        }
        detail.append(text);
    }

    private void save(String logType, String status, WeddingEvent event, String message, String detail) {
        save(logType, status, event == null ? null : event.getEventCode(), siteLabel(event, null), message, detail);
    }

    private void save(String logType, String status, String eventCode, String siteLabel, String message, String detail) {
        OperatorLog log = new OperatorLog();
        log.setLogType(logType);
        log.setStatus(status);
        log.setEventCode(blankToNull(eventCode));
        log.setSiteLabel(blankToNull(siteLabel));
        log.setMessage(truncate(message, 255));
        log.setDetail(truncate(detail, 255));
        log.setCreatedAt(LocalDateTime.now());
        operatorLogRepository.save(log);
        trimOverflow();
    }

    private void trimOverflow() {
        List<OperatorLog> logs = operatorLogRepository.findAllByOrderByCreatedAtDescIdDesc();
        if (logs.size() <= MAX_LOGS) {
            return;
        }
        operatorLogRepository.deleteAll(logs.subList(MAX_LOGS, logs.size()));
    }

    private String siteLabel(WeddingEvent event, String fallbackEventCode) {
        if (event != null) {
            String groom = blankToNull(event.getGroomName());
            String bride = blankToNull(event.getBrideName());
            if (groom != null || bride != null) {
                return String.format("%s ♥ %s", groom == null ? "신랑" : groom, bride == null ? "신부" : bride);
            }
            if (blankToNull(event.getEventCode()) != null) {
                return "행사코드 " + event.getEventCode();
            }
        }
        if (blankToNull(fallbackEventCode) != null) {
            return "행사코드 " + fallbackEventCode;
        }
        return "운영자 콘솔";
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 1)) + "…";
    }
}

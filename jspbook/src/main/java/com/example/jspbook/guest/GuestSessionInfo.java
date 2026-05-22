package com.example.jspbook.guest;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class GuestSessionInfo implements Serializable {

    public static final String SESSION_KEY = "guestSessionInfo";

    private String eventCode;
    private String nick;
    private String category;
    private String side;
    private String displayName;
    private String ownerSessionId;

    public static GuestSessionInfo create(String eventCode, String nick, String category, String side) {
        GuestSessionInfo info = new GuestSessionInfo();
        info.eventCode = eventCode;
        info.nick = nick;
        info.category = category;
        info.side = side;
        info.displayName = side + " " + category + " " + nick;
        info.ownerSessionId = UUID.randomUUID().toString();
        return info;
    }

    public String getEventCode() {
        return eventCode;
    }

    public String getNick() {
        return nick;
    }

    public String getCategory() {
        return category;
    }

    public String getSide() {
        return side;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getOwnerSessionId() {
        return ownerSessionId;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("eventCode", eventCode);
        map.put("nick", nick);
        map.put("category", category);
        map.put("side", side);
        map.put("displayName", displayName);
        return map;
    }
}

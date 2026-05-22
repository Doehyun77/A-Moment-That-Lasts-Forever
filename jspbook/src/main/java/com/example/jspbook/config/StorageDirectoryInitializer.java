package com.example.jspbook.config;

import java.io.IOException;
import java.nio.file.Files;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StorageDirectoryInitializer {

    private final StorageProperties storageProperties;

    public StorageDirectoryInitializer(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureDirectories() throws IOException {
        Files.createDirectories(storageProperties.getRootPath());
        Files.createDirectories(storageProperties.getUploadPath());
        Files.createDirectories(storageProperties.getTempPath());
    }
}

package com.example.jspbook.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String rootDir = "var";
    private String uploadDir = "var/uploads";
    private String tempDir = "var/tmp";

    public String getRootDir() {
        return rootDir;
    }

    public void setRootDir(String rootDir) {
        this.rootDir = rootDir;
    }

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public String getTempDir() {
        return tempDir;
    }

    public void setTempDir(String tempDir) {
        this.tempDir = tempDir;
    }

    public Path getRootPath() {
        return normalize(rootDir);
    }

    public Path getUploadPath() {
        return normalize(uploadDir);
    }

    public Path getTempPath() {
        return normalize(tempDir);
    }

    private Path normalize(String value) {
        return Paths.get(value).toAbsolutePath().normalize();
    }
}

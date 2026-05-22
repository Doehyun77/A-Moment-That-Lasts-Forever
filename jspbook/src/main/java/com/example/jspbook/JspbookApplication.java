package com.example.jspbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class JspbookApplication {

    public static void main(String[] args) {
        SpringApplication.run(JspbookApplication.class, args);
    }
}
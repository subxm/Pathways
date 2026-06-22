package com.pathways.pathservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PathServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PathServiceApplication.class, args);
    }
}

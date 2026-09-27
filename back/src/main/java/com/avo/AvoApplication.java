package com.avo;

import java.util.Date;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class AvoApplication {

    public static void main(String[] args) {
        System.setProperty("file.encoding", "UTF-8");
        org.springframework.context.ConfigurableApplicationContext context = SpringApplication.run(AvoApplication.class,
                args);
        System.out
                .println("Active profiles: " + java.util.Arrays.toString(context.getEnvironment().getActiveProfiles()));
        System.out.println("application version : 1.0.0");
        System.out.println("Application started" + new Date());
    }
}

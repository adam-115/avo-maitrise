package com.avo;

import java.util.Date;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AvoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AvoApplication.class, args);
        System.out.println("Application started" + new Date());
    }
}

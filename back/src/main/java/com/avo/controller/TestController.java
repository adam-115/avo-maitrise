package com.avo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @Value("${name}")
    private String name;

    @GetMapping("/test")
    public String test() {
        return "salam  " + name;
    }
}

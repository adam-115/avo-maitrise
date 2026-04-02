package com.avo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping(value = { "/", "/{path:[^\\.]*}", "/home/**", "/test/**" })
    public String home() {
        return "forward:/index.html";
    }
}

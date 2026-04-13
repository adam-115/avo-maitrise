package com.avo.yente;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aml")
public class AmlController {

    @Autowired
    private ScreeningService screeningService;

    @GetMapping("/screen")
    public ResponseEntity<String> screen(@RequestParam String name) {
        String result = screeningService.checkClient(name);
        return ResponseEntity.ok(result);
    }
}
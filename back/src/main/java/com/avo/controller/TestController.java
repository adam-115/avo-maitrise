package com.avo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.avo.entities.QTestEntity;
import com.avo.entities.TestEntity;
import com.avo.services.TestService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api")
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @Value("${name}")
    private String name;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        QTestEntity qTestEntity = QTestEntity.testEntity;

        return ResponseEntity.ok("salam  " + name);
    }

    @PostMapping("/test")
    public ResponseEntity<TestEntity> create(@RequestBody TestEntity testEntity) {
        return ResponseEntity.ok(testService.create(testEntity));
    }

    @GetMapping("/test/{id}")
    public ResponseEntity<TestEntity> findById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.findById(id));
    }

    @GetMapping("findAll")
    public ResponseEntity<List<TestEntity>> findAll() {
        return ResponseEntity.ok(testService.findAll());
    }

    @GetMapping("testQueryDsl")
    public ResponseEntity<List<TestEntity>> testQueryDsl() {
        return ResponseEntity.ok(testService.testQueryDsl());
    }

}

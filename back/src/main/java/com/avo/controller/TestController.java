package com.avo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.avo.config.BaseController;
import com.avo.dao.TestRepository;
import com.avo.entities.QTestEntity;
import com.avo.entities.TestEntity;

@RestController
@RequestMapping("/api/test")
public class TestController extends BaseController<TestEntity, QTestEntity, Long> {

    public TestController(TestRepository testRepository) {
        super(testRepository, testRepository);
    }

    @Value("${name}")
    private String name;

    @GetMapping("/salam")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("salam  " + name);
    }

    // @PostMapping("/test")
    // public ResponseEntity<TestEntity> create(@RequestBody TestEntity testEntity)
    // {
    // return ResponseEntity.ok(testService.create(testEntity));
    // }

    // @GetMapping("/test/{id}")
    // public ResponseEntity<TestEntity> findById(@PathVariable Long id) {
    // return ResponseEntity.ok(testService.findById(id));
    // }

    // @GetMapping("findAll")
    // public ResponseEntity<List<TestEntity>> findAll() {
    // return ResponseEntity.ok(testService.findAll());
    // }

    // @GetMapping("testQueryDsl")
    // public ResponseEntity<List<TestEntity>> testQueryDsl() {
    // return ResponseEntity.ok(testService.testQueryDsl());
    // }

}

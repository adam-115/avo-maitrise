package com.avo.services;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.avo.dao.TestRepository;
import com.avo.entities.QTestEntity;
import com.avo.entities.TestEntity;
import com.querydsl.core.BooleanBuilder;

@Service
public class TestService {

    private final TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    public TestEntity create(TestEntity testEntity) {
        return testRepository.save(testEntity);
    }

    public TestEntity findById(Long id) {
        return testRepository.findById(id).orElse(null);
    }

    public List<TestEntity> findAll() {
        return testRepository.findAll();
    }

    public List<TestEntity> testQueryDsl() {
        QTestEntity qTestEntity = QTestEntity.testEntity;
        BooleanBuilder predicate = new BooleanBuilder();
        predicate.and(qTestEntity.message.eq("salam")).and(qTestEntity.id.eq(2L));
        return (List<TestEntity>) testRepository.findAll(predicate);

    }

}

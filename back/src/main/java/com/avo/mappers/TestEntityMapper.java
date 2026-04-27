package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.TestEntityDTO;
import com.avo.entities.TestEntity;

@Mapper(componentModel = "spring")
public interface TestEntityMapper {

    TestEntityMapper INSTANCE = Mappers.getMapper(TestEntityMapper.class);

    TestEntityDTO toDto(TestEntity testEntity);

    TestEntity toEntity(TestEntityDTO testEntityDTO);
}

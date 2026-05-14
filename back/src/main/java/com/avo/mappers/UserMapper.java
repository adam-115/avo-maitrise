package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    UserDTO toDto(AppUser user);

    AppUser toEntity(UserDTO userDTO);
}

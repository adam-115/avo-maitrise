package com.avo.dao;

import com.avo.entities.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ClientDao extends JpaRepository<ClientEntity, UUID> {
}

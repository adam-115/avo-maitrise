package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ClientMoral;

@Repository
public interface ClientMoralRepository extends JpaRepository<ClientMoral, Long>,QuerydslPredicateExecutor<ClientMoral> {

}

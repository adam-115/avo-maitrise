package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.AppUser;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Long>, QuerydslPredicateExecutor<AppUser> {
}

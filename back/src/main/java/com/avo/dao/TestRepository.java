package com.avo.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;
import org.springframework.stereotype.Repository;

import com.avo.entities.QTestEntity;
import com.avo.entities.TestEntity;
import com.querydsl.core.types.dsl.StringPath;

@Repository
public interface TestRepository extends JpaRepository<TestEntity, Long>, QuerydslPredicateExecutor<TestEntity>,
        QuerydslBinderCustomizer<QTestEntity> {

    @Override
    default void customize(QuerydslBindings bindings, QTestEntity qTestEntity) {
        // 1. Pour tous les champs String, faire un "contient" insensible à la casse
        bindings.bind(String.class).first((StringPath path, String value) -> path.containsIgnoreCase(value));

        // 2. Exclure un champ de la recherche pour des raisons de sécurité
        // bindings.excluding(user.password);

        // 3. Créer un alias (ex: ?name= au lieu de ?firstname=)
        // bindings.bind(user.firstname).as("name").first(StringExpression::containsIgnoreCase);
    }

}

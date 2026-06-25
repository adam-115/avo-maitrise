-- liquibase formatted sql

-- changeset avo:add-keycloak-id-column
ALTER TABLE app_users ADD COLUMN keycloak_id VARCHAR(255) UNIQUE;

-- rollback ALTER TABLE app_users DROP COLUMN keycloak_id;

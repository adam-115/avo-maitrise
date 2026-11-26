package com.avo.audit;

import jakarta.persistence.Entity;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.tool.schema.spi.DelayedDropRegistryNotAvailableImpl;
import org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Construit le modèle Hibernate + Envers (sans base de données) avec les mêmes conventions de nommage
 * que Spring Boot, et écrit le DDL MySQL dans target/audit-schema.sql.
 *
 * Sert à deux choses :
 * 1. vérifier que le mapping Envers est valide (une association vers une entité non auditée oubliée
 *    ferait échouer la construction du modèle, donc le démarrage de l'application) ;
 * 2. produire le DDL exact des tables *_aud pour écrire la migration Liquibase.
 */
class AuditSchemaExportTest {

    private static final List<String> EXPECTED_AUDIT_TABLES = List.of(
            "audit_revision", "audit_log",
            "dossiers_aud", "dossier_intervenants_aud", "dossier_documents_aud", "dossier_parties_aud",
            "clients_aud", "clients_moraux_aud", "personnes_physiques_aud",
            "documents_aud", "invoice_aud", "ubos_aud",
            "screening_execution_aud", "screening_matches_aud",
            "client_diligence_status_aud", "diligence_form_result_aud", "field_result_aud",
            "form_config_aud", "field_config_aud", "field_option_aud");

    @Test
    void envers_model_builds_and_audit_tables_are_generated() throws Exception {
        Map<String, Object> settings = new HashMap<>();
        settings.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        settings.put("hibernate.boot.allow_jdbc_metadata_access", "false");
        settings.put("hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");
        settings.put("hibernate.implicit_naming_strategy",
                "org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy");
        settings.put("org.hibernate.envers.audit_table_suffix", "_aud");
        settings.put("org.hibernate.envers.revision_field_name", "rev");
        settings.put("org.hibernate.envers.revision_type_field_name", "revtype");
        settings.put("org.hibernate.envers.store_data_at_delete", "true");

        StandardServiceRegistry registry = new StandardServiceRegistryBuilder().applySettings(settings).build();
        try {
            MetadataSources sources = new MetadataSources(registry);
            ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));
            for (BeanDefinition bd : scanner.findCandidateComponents("com.avo")) {
                sources.addAnnotatedClass(Class.forName(bd.getBeanClassName()));
            }
            Metadata metadata = sources.buildMetadata();

            Path output = Path.of("target", "audit-schema.sql").toAbsolutePath();
            Files.deleteIfExists(output);
            Map<String, Object> generation = new HashMap<>(settings);
            generation.put("jakarta.persistence.schema-generation.database.action", "none");
            generation.put("jakarta.persistence.schema-generation.scripts.action", "create");
            generation.put("jakarta.persistence.schema-generation.scripts.create-target", output.toString());
            generation.put("hibernate.hbm2ddl.delimiter", ";");
            generation.put("hibernate.format_sql", "false");
            SchemaManagementToolCoordinator.process(metadata, registry, generation,
                    DelayedDropRegistryNotAvailableImpl.INSTANCE);

            String ddl = Files.readString(output);
            List<String> created;
            try (Stream<String> lines = ddl.lines()) {
                created = lines.map(String::trim)
                        .filter(l -> l.startsWith("create table "))
                        .map(l -> l.substring("create table ".length()).split("\\s|\\(")[0])
                        .collect(Collectors.toList());
            }
            assertThat(created).containsAll(EXPECTED_AUDIT_TABLES);
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}

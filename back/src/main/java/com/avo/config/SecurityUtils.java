package com.avo.config;

import java.util.Arrays;
import java.util.Collection;
import java.util.Objects;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.avo.entities.AppUser;
import com.avo.entities.Document;
import com.avo.entities.Dossier;
import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Utilitaires de Sécurité & Validation Anti-IDOR pour SI-LÉGAL (Avo-Maîtrise).
 * Utilisé directement dans les expressions SpEL des annotations @PreAuthorize.
 * Exemple: @PreAuthorize("@securityUtils.isCurrentUser(#id)")
 */
@Component("securityUtils")
@Slf4j
public class SecurityUtils {

    private final UserRepository userRepository;
    private final DossierRepository dossierRepository;
    private final DocumentRepository documentRepository;
    private final com.avo.repositories.InvoiceRepository invoiceRepository;

    public SecurityUtils(UserRepository userRepository,
                         DossierRepository dossierRepository,
                         DocumentRepository documentRepository,
                         com.avo.repositories.InvoiceRepository invoiceRepository) {
        this.userRepository = userRepository;
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
        this.invoiceRepository = invoiceRepository;
    }


    /**
     * Récupère l'objet Authentication courant.
     */
    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * Récupère l'identifiant Keycloak (subject / UUID) de l'utilisateur connecté.
     */
    public String getCurrentUserKeycloakId() {
        Authentication auth = getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return jwt.getSubject();
        }
        return auth.getName();
    }

    /**
     * Récupère le nom d'utilisateur (preferred_username ou principal name).
     */
    public String getCurrentUsername() {
        Authentication auth = getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return username;
            }
        }
        return auth.getName();
    }

    /**
     * Récupère l'entité AppUser correspondante en base de données.
     */
    public Optional<AppUser> getCurrentAppUser() {
        String keycloakId = getCurrentUserKeycloakId();
        if (keycloakId != null) {
            Optional<AppUser> byKc = userRepository.findByKeycloakId(keycloakId);
            if (byKc.isPresent()) {
                return byKc;
            }
        }
        String username = getCurrentUsername();
        if (username != null) {
            return userRepository.findByUsername(username);
        }
        return Optional.empty();
    }

    /**
     * Vérifie si l'utilisateur possède au moins un des rôles spécifiés.
     */
    public boolean hasAnyRole(String... roles) {
        Authentication auth = getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
        if (authorities == null || authorities.isEmpty()) {
            return false;
        }

        return Arrays.stream(roles).anyMatch(role -> {
            String roleUpper = role.toUpperCase();
            String withRolePrefix = "ROLE_" + roleUpper;
            return authorities.stream().anyMatch(a -> {
                String authName = a.getAuthority().toUpperCase();
                return authName.equals(roleUpper) || authName.equals(withRolePrefix);
            });
        });
    }

    /**
     * Vérifie si l'utilisateur connecté est Administrateur (ADMIN ou SUPER_ADMIN).
     */
    public boolean isAdmin() {
        return hasAnyRole("ADMIN", "SUPER_ADMIN");
    }

    /**
     * Vérifie si l'utilisateur connecté est un Associé (Partner).
     */
    public boolean isAssocie() {
        return isAdmin() || hasAnyRole("ASSOCIE", "PARTNER");
    }

    /**
     * Vérifie si l'utilisateur connecté est un Compliance Officer.
     */
    public boolean isComplianceOfficer() {
        return isAdmin() || hasAnyRole("COMPLIANCE_OFFICER", "COMPLIANCE");
    }

    /**
     * Vérifie si l'utilisateur connecté appartient au secrétariat.
     */
    public boolean isSecretariat() {
        return isAdmin() || hasAnyRole("SECRETARIAT", "SECRETARY");
    }

    /**
     * Vérifie si l'utilisateur connecté est Avocat (Associé ou Titulaire).
     */
    public boolean isAvocat() {
        return isAssocie() || hasAnyRole("AVOCAT", "LAWYER");
    }

    /**
     * Vérifie si l'utilisateur connecté est un Collaborateur (Production).
     */
    public boolean isCollaborateur() {
        return isAvocat() || hasAnyRole("COLLABORATEUR", "COLLAB", "COLLABORATOR");
    }

    /**
     * Vérifie si l'utilisateur a le droit de valider le score de risque, lever une alerte ou modifier le statut AML client.
     * Réservé exclusivement à : ADMIN, SUPER_ADMIN, ASSOCIE, PARTNER, COMPLIANCE_OFFICER / COMPLIANCE.
     * Interdit aux rôles AVOCAT, COLLABORATEUR, SECRETARIAT sans mandat spécifique.
     */
    public boolean canValidateAml() {
        return isAdmin() || isAssocie() || isComplianceOfficer();
    }

    /**
     * Vérifie si l'identifiant d'utilisateur cible correspond à l'utilisateur actuellement connecté.
     * Les administrateurs ont toujours accès.
     */
    public boolean isCurrentUser(Long targetUserId) {
        if (targetUserId == null) {
            return false;
        }
        if (isAdmin()) {
            return true;
        }

        Optional<AppUser> currentOpt = getCurrentAppUser();
        if (currentOpt.isPresent()) {
            return Objects.equals(currentOpt.get().getId(), targetUserId);
        }

        // Fallback: recherche de la cible par ID et comparaison avec le username/keycloakId connecté
        Optional<AppUser> targetOpt = userRepository.findById(targetUserId);
        if (targetOpt.isEmpty()) {
            return false;
        }
        AppUser target = targetOpt.get();
        String currentUsername = getCurrentUsername();
        String currentKeycloakId = getCurrentUserKeycloakId();

        return (currentUsername != null && currentUsername.equalsIgnoreCase(target.getUsername())) ||
               (currentKeycloakId != null && currentKeycloakId.equals(target.getKeycloakId()));
    }

    /**
     * Vérifie si l'utilisateur connecté a le droit de voir TOUS les dossiers du cabinet (ADMIN, ASSOCIÉ, SECRÉTARIAT).
     * Les rôles AVOCAT et COLLABORATEUR ne voient que leurs dossiers assignés ou créés.
     */
    public boolean canViewAllDossiers() {
        return isAdmin() || isAssocie() || isSecretariat();
    }

    /**
     * Récupère la liste de tous les identifiants possibles de l'utilisateur connecté
     * (Username, Keycloak Sub ID, Database ID) pour correspondre avec responsableId, intervenantsIds ou createdBy.
     */
    public java.util.List<String> getCurrentUserIdentifiers() {
        java.util.Set<String> set = new java.util.HashSet<>();
        String username = getCurrentUsername();
        if (username != null && !username.isBlank()) {
            set.add(username);
            set.add(username.toLowerCase());
            set.add(username.toUpperCase());
        }
        String keycloakId = getCurrentUserKeycloakId();
        if (keycloakId != null && !keycloakId.isBlank()) {
            set.add(keycloakId);
        }
        getCurrentAppUser().ifPresent(u -> {
            if (u.getId() != null) {
                set.add(String.valueOf(u.getId()));
            }
            if (u.getUsername() != null && !u.getUsername().isBlank()) {
                set.add(u.getUsername());
                set.add(u.getUsername().toLowerCase());
                set.add(u.getUsername().toUpperCase());
            }
            if (u.getKeycloakId() != null && !u.getKeycloakId().isBlank()) {
                set.add(u.getKeycloakId());
            }
        });
        return new java.util.ArrayList<>(set);
    }

    /**
     * Vérifie si l'utilisateur a le droit d'accéder au dossier (Admin/Associé/Secrétariat, ou Responsable, Créateur, Intervenant).
     */
    public boolean canAccessDossier(Long dossierId) {
        if (dossierId == null) {
            return false;
        }
        if (canViewAllDossiers()) {
            return true;
        }

        Optional<Dossier> dossierOpt = dossierRepository.findById(dossierId);
        if (dossierOpt.isEmpty()) {
            return false;
        }
        return isDossierAllowedForUser(dossierOpt.get());
    }

    /**
     * Vérifie si un dossier spécifique est accessible à l'utilisateur courant.
     */
    public boolean isDossierAllowedForUser(Dossier dossier) {
        if (dossier == null) {
            return false;
        }
        if (canViewAllDossiers()) {
            return true;
        }

        java.util.List<String> userIds = getCurrentUserIdentifiers();
        if (userIds.isEmpty()) {
            return false;
        }

        // 1. Vérification Responsable
        if (dossier.getResponsableId() != null) {
            String resp = dossier.getResponsableId();
            if (userIds.stream().anyMatch(id -> id.equalsIgnoreCase(resp))) {
                return true;
            }
        }

        // 2. Vérification Créateur
        if (dossier.getCreatedBy() != null) {
            String creator = dossier.getCreatedBy();
            if (userIds.stream().anyMatch(id -> id.equalsIgnoreCase(creator))) {
                return true;
            }
        }

        // 3. Vérification Intervenants / Collaborateurs
        if (dossier.getIntervenantsIds() != null && !dossier.getIntervenantsIds().isEmpty()) {
            for (String interId : dossier.getIntervenantsIds()) {
                if (interId != null && userIds.stream().anyMatch(id -> id.equalsIgnoreCase(interId))) {
                    return true;
                }
            }
        }

        return false;
    }


    /**
     * Vérifie si l'utilisateur a le droit d'accéder/modifier un document (Anti-IDOR).
     */
    public boolean isDocumentOwnerOrAllowed(Long documentId) {
        if (documentId == null) {
            return false;
        }
        if (isAssocie()) {
            return true;
        }

        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isEmpty()) {
            return false;
        }
        Document doc = docOpt.get();

        // Si le document est lié à un dossier, vérifier les droits sur ce dossier
        if (doc.getDossier() != null && doc.getDossier().getId() != null) {
            return canAccessDossier(doc.getDossier().getId());
        }

        // Si document orphelin ou client sans dossier spécifique, l'utilisateur authentifié standard est autorisé
        return getAuthentication() != null && getAuthentication().isAuthenticated();
    }

    /**
     * Vérifie si l'utilisateur a le droit de supprimer définitivement un document.
     * Selon la matrice RBAC : ADMIN (OUI), ASSOCIÉ (OUI), AVOCAT (Ses pièces), COLLAB (NON), COMPLIANCE (NON), SECRÉTARIAT (NON).
     */
    public boolean canDeleteDocument(Long documentId) {
        if (documentId == null) {
            return false;
        }
        if (isAssocie()) {
            return true;
        }
        if (hasAnyRole("AVOCAT", "LAWYER")) {
            return isDocumentOwnerOrAllowed(documentId);
        }
        return false;
    }

    /**
     * Vérifie si l'utilisateur a le droit d'accéder/gérer une facture (Admin/Associé/Secrétariat, ou dossier assigné/créé par l'avocat).
     */
    public boolean canAccessInvoice(Long invoiceId) {
        if (invoiceId == null) {
            return false;
        }
        if (canViewAllDossiers()) {
            return true;
        }

        java.util.Optional<com.avo.entities.Invoice> invOpt = invoiceRepository.findById(invoiceId);
        if (invOpt.isEmpty()) {
            return false;
        }
        com.avo.entities.Invoice invoice = invOpt.get();
        if (invoice.getDossier() != null) {
            return isDossierAllowedForUser(invoice.getDossier());
        }
        return true;
    }

    /**
     * Construit l'expression QueryDSL pour restreindre les factures aux dossiers autorisés pour l'utilisateur.
     * Si l'utilisateur a accès à tous les dossiers (Admin/Associé/Secrétariat), retourne null (aucun filtre).
     */
    public com.querydsl.core.types.dsl.BooleanExpression getInvoiceScopeExpression() {
        if (canViewAllDossiers()) {
            return null;
        }
        java.util.List<String> userIds = getCurrentUserIdentifiers();
        if (userIds.isEmpty()) {
            return com.avo.entities.QInvoice.invoice.id.isNull();
        }
        com.avo.entities.QInvoice invoice = com.avo.entities.QInvoice.invoice;
        return invoice.dossier.responsableId.in(userIds)
                .or(invoice.dossier.createdBy.in(userIds))
                .or(invoice.dossier.intervenantsIds.any().in(userIds));
    }

    /**
     * Construit l'expression QueryDSL pour restreindre les dossiers aux dossiers autorisés pour l'utilisateur.
     * Si l'utilisateur a accès à tous les dossiers (Admin/Associé/Secrétariat), retourne null (aucun filtre).
     */
    public com.querydsl.core.types.dsl.BooleanExpression getDossierScopeExpression() {
        if (canViewAllDossiers()) {
            return null;
        }
        java.util.List<String> userIds = getCurrentUserIdentifiers();
        if (userIds.isEmpty()) {
            return com.avo.entities.QDossier.dossier.id.isNull();
        }
        com.avo.entities.QDossier dossier = com.avo.entities.QDossier.dossier;
        return dossier.responsableId.in(userIds)
                .or(dossier.createdBy.in(userIds))
                .or(dossier.intervenantsIds.any().in(userIds));
    }

    /**
     * Construit l'expression QueryDSL pour restreindre les prestations (InvoiceDossierService) aux dossiers autorisés.
     * Si l'utilisateur a accès à tous les dossiers (Admin/Associé/Secrétariat), retourne null (aucun filtre).
     */
    public com.querydsl.core.types.dsl.BooleanExpression getInvoiceDossierServiceScopeExpression() {
        if (canViewAllDossiers()) {
            return null;
        }
        java.util.List<String> userIds = getCurrentUserIdentifiers();
        if (userIds.isEmpty()) {
            return com.avo.entities.QInvoiceDossierService.invoiceDossierService.id.isNull();
        }
        com.avo.entities.QInvoiceDossierService p = com.avo.entities.QInvoiceDossierService.invoiceDossierService;
        return p.dossier.responsableId.in(userIds)
                .or(p.dossier.createdBy.in(userIds))
                .or(p.dossier.intervenantsIds.any().in(userIds));
    }
}



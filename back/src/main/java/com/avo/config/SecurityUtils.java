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

    public SecurityUtils(UserRepository userRepository,
                         DossierRepository dossierRepository,
                         DocumentRepository documentRepository) {
        this.userRepository = userRepository;
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
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
        return isAdmin() || hasAnyRole("SECRETARIAT");
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
     * Vérifie si l'utilisateur a le droit d'accéder au dossier (Admin, Associé, Responsable ou Intervenant).
     */
    public boolean canAccessDossier(Long dossierId) {
        if (dossierId == null) {
            return false;
        }
        if (isAssocie()) {
            return true;
        }

        Optional<Dossier> dossierOpt = dossierRepository.findById(dossierId);
        if (dossierOpt.isEmpty()) {
            return false;
        }
        Dossier dossier = dossierOpt.get();

        String currentUsername = getCurrentUsername();
        String currentKeycloakId = getCurrentUserKeycloakId();
        Optional<AppUser> currentAppUser = getCurrentAppUser();
        String currentUserIdStr = currentAppUser.map(u -> String.valueOf(u.getId())).orElse(null);

        // Vérification responsable
        if (dossier.getResponsableId() != null) {
            String resp = dossier.getResponsableId();
            if (resp.equalsIgnoreCase(currentUsername) ||
                resp.equals(currentKeycloakId) ||
                (currentUserIdStr != null && resp.equals(currentUserIdStr))) {
                return true;
            }
        }

        // Vérification intervenants
        if (dossier.getIntervenantsIds() != null && !dossier.getIntervenantsIds().isEmpty()) {
            for (String interId : dossier.getIntervenantsIds()) {
                if (interId != null && (
                    interId.equalsIgnoreCase(currentUsername) ||
                    interId.equals(currentKeycloakId) ||
                    (currentUserIdStr != null && interId.equals(currentUserIdStr)))) {
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
}

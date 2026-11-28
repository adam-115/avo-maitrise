package com.avo.services;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.avo.dtos.CreateUserRequest;
import com.avo.dtos.PasswordResetRequest;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;
import com.avo.mappers.UserMapper;
import com.avo.repositories.UserRepository;
import com.querydsl.core.types.Predicate;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class UserService {

    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String NUMBERS = "0123456789";
    private static final String SPECIAL_CHARS = "!@#$%^&*()-_=+";
    private static final String ALL_CHARS = CHAR_LOWER + CHAR_UPPER + NUMBERS + SPECIAL_CHARS;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository repository;
    private final UserMapper mapper;
    private final KeycloakUserManagementService keycloakService;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${app.bootstrap.admin-usernames:admin,adam}")
    private String bootstrapAdminUsernames;

    public UserService(UserRepository repository, UserMapper mapper,
                       KeycloakUserManagementService keycloakService, EmailService emailService) {
        this.repository = repository;
        this.mapper = mapper;
        this.keycloakService = keycloakService;
        this.emailService = emailService;
    }

    public static String generateSecurePassword(int length) {
        if (length < 12) length = 14;
        StringBuilder sb = new StringBuilder(length);
        sb.append(CHAR_LOWER.charAt(SECURE_RANDOM.nextInt(CHAR_LOWER.length())));
        sb.append(CHAR_UPPER.charAt(SECURE_RANDOM.nextInt(CHAR_UPPER.length())));
        sb.append(NUMBERS.charAt(SECURE_RANDOM.nextInt(NUMBERS.length())));
        sb.append(SPECIAL_CHARS.charAt(SECURE_RANDOM.nextInt(SPECIAL_CHARS.length())));
        for (int i = 4; i < length; i++) {
            sb.append(ALL_CHARS.charAt(SECURE_RANDOM.nextInt(ALL_CHARS.length())));
        }
        char[] array = sb.toString().toCharArray();
        for (int i = array.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return new String(array);
    }

    public Page<UserDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<UserDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<UserDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public UserDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    /**
     * Création stricte : l'utilisateur doit exister (ou être créé) dans Keycloak AVANT d'être sauvegardé en base,
     * avec synchronisation garantie du même keycloakId et du rôle métier.
     */
    @Transactional
    public UserDTO create(UserDTO dto) {
        String temporaryPassword = (dto.getTempPassword() != null && !dto.getTempPassword().trim().isEmpty())
                ? dto.getTempPassword().trim()
                : generateSecurePassword(14);

        String kcId = ensureUserInKeycloak(dto, temporaryPassword);
        dto.setKeycloakId(kcId);

        AppUser savedUser = repository.save(mapper.toEntity(dto));
        return mapper.toDto(savedUser);
    }

    /**
     * Mise à jour d'un utilisateur : met à jour la base locale puis synchronise Keycloak (infos, rôle et keycloakId).
     */
    @Transactional
    public UserDTO update(UserDTO dto) {
        AppUser existingUser = repository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (dto.getKeycloakId() == null || dto.getKeycloakId().isBlank()) {
            dto.setKeycloakId(existingUser.getKeycloakId());
        }
        if (dto.getCreatedAt() == null) {
            dto.setCreatedAt(existingUser.getCreatedAt());
        }

        String kcId = ensureUserInKeycloak(dto, null);
        dto.setKeycloakId(kcId);

        AppUser saved = repository.save(mapper.toEntity(dto));
        return mapper.toDto(saved);
    }

    /**
     * Synchronisation explicite d'un utilisateur existant dans app_users vers Keycloak (bouton "Synchroniser").
     * Lie le compte Keycloak existant (par keycloakId/username/email) ou le crée, puis synchronise le même keycloakId et le rôle.
     */
    @Transactional
    public UserDTO syncWithKeycloak(Long id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        UserDTO dto = mapper.toDto(entity);
        String kcId = ensureUserInKeycloak(dto, generateSecurePassword(14));
        entity.setKeycloakId(kcId);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Liaison / provisionnement automatique (JIT) lors d'une connexion JWT Keycloak :
     * - Si l'utilisateur existe en base (par keycloakId, username ou email), met à jour son keycloakId si manquant/différent.
     * - Sinon, crée automatiquement sa fiche app_users avec le même keycloakId.
     */
    @Transactional
    public Optional<AppUser> linkOrProvisionFromJwt(String keycloakSub, String preferredUsername,
                                                    String email, String firstName, String lastName,
                                                    String detectedRole) {
        if (keycloakSub == null || keycloakSub.isBlank()) {
            return Optional.empty();
        }

        Optional<AppUser> found = repository.findByKeycloakId(keycloakSub);
        if (found.isEmpty() && preferredUsername != null && !preferredUsername.isBlank()) {
            found = repository.findByUsernameIgnoreCase(preferredUsername);
        }
        if (found.isEmpty() && email != null && !email.isBlank()) {
            found = repository.findByEmailIgnoreCase(email);
        }

        boolean isBootstrapAdmin = isBootstrapAdmin(preferredUsername, email);
        boolean keycloakGrantsAdmin = "ADMIN".equalsIgnoreCase(detectedRole) || "SUPER_ADMIN".equalsIgnoreCase(detectedRole);

        if (found.isPresent()) {
            AppUser user = found.get();
            boolean changed = false;
            boolean newlyLinked = !keycloakSub.equals(user.getKeycloakId());
            if (newlyLinked) {
                log.info("Liaison automatique keycloak_id={} pour l'utilisateur '{}' (id={})",
                        keycloakSub, user.getUsername(), user.getId());
                user.setKeycloakId(keycloakSub);
                user.setLastLogin(new Date());
                changed = true;
            }
            // Promotion automatique ADMIN si rôle ADMIN dans Keycloak ou listé dans app.bootstrap.admin-usernames
            if ((keycloakGrantsAdmin || isBootstrapAdmin) && !"ADMIN".equalsIgnoreCase(user.getRole())) {
                log.info("Synchronisation automatique du rôle ADMIN dans app_users pour '{}' (source={})",
                        user.getUsername(), keycloakGrantsAdmin ? "Keycloak" : "bootstrap");
                user.setRole("ADMIN");
                changed = true;
            }
            if (changed) {
                user = repository.save(user);
                String dbRole = user.getRole() != null ? user.getRole().trim().toUpperCase() : null;
                if (dbRole != null && !dbRole.isBlank() && !dbRole.equalsIgnoreCase(detectedRole)) {
                    try {
                        keycloakService.syncAppRoles(keycloakSub, List.of(dbRole));
                        log.info("Rôle '{}' synchronisé automatiquement vers Keycloak pour '{}' (keycloak_id={})",
                                dbRole, user.getUsername(), keycloakSub);
                    } catch (Exception e) {
                        log.warn("Impossible de synchroniser le rôle '{}' vers Keycloak pour '{}' : {}",
                                dbRole, user.getUsername(), e.getMessage());
                    }
                }
            }
            return Optional.of(user);
        }

        // JIT provisioning : utilisateur créé directement dans Keycloak mais absent de app_users
        String safeUsername = (preferredUsername != null && !preferredUsername.isBlank())
                ? preferredUsername.trim()
                : (email != null && !email.isBlank() ? email.trim() : "kc_" + keycloakSub.substring(0, Math.min(8, keycloakSub.length())));
        String safeEmail = (email != null && !email.isBlank())
                ? email.trim()
                : safeUsername + "@local.invalid";

        String resolvedRole;
        if (keycloakGrantsAdmin || isBootstrapAdmin || !repository.existsByRoleIgnoreCase("ADMIN")) {
            resolvedRole = "ADMIN";
        } else if (detectedRole != null && !detectedRole.isBlank()) {
            resolvedRole = detectedRole.toUpperCase();
        } else {
            resolvedRole = "AVOCAT";
        }

        AppUser provisioned = new AppUser();
        provisioned.setKeycloakId(keycloakSub);
        provisioned.setUsername(safeUsername);
        provisioned.setEmail(safeEmail);
        provisioned.setFirstName(firstName != null && !firstName.isBlank() ? firstName.trim() : safeUsername);
        provisioned.setLastName(lastName != null && !lastName.isBlank() ? lastName.trim() : "-");
        provisioned.setRole(resolvedRole);
        provisioned.setActive(true);
        provisioned.setLastLogin(new Date());

        AppUser saved = repository.save(provisioned);
        log.info("Provisionnement JIT créé dans app_users pour '{}' (keycloak_id={}, role={})",
                saved.getUsername(), keycloakSub, saved.getRole());
        return Optional.of(saved);
    }

    private boolean isBootstrapAdmin(String preferredUsername, String email) {
        if (bootstrapAdminUsernames == null || bootstrapAdminUsernames.isBlank()) {
            return false;
        }
        for (String entry : bootstrapAdminUsernames.split(",")) {
            String trimmed = entry.trim();
            if (trimmed.isEmpty()) continue;
            if (preferredUsername != null && trimmed.equalsIgnoreCase(preferredUsername.trim())) {
                return true;
            }
            if (email != null && trimmed.equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    @Transactional
    public void disableUser(Long id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        entity.setActive(false);
        String kcUserId = ensureUserInKeycloak(mapper.toDto(entity), null);
        entity.setKeycloakId(kcUserId);
        repository.save(entity);
        keycloakService.disableUser(kcUserId);
    }

    @Transactional
    public void enableUser(Long id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        entity.setActive(true);
        String kcUserId = ensureUserInKeycloak(mapper.toDto(entity), null);
        entity.setKeycloakId(kcUserId);
        repository.save(entity);
    }

    @Transactional
    public void updateRole(Long id, String newRole) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        entity.setRole(newRole);
        String kcUserId = ensureUserInKeycloak(mapper.toDto(entity), null);
        entity.setKeycloakId(kcUserId);
        repository.save(entity);
    }

    public void delete(Long id) {
        // Suppression physique désactivée : utiliser disableUser(id)
    }

    @Transactional
    public String resetPassword(Long id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        UserDTO user = mapper.toDto(entity);
        String kcUserId = ensureUserInKeycloak(user, null);
        entity.setKeycloakId(kcUserId);
        repository.save(entity);

        String newPassword = generateSecurePassword(14);
        keycloakService.resetPassword(new PasswordResetRequest(kcUserId, newPassword, true));

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String emailText = "Bonjour " + user.getFirstName() + ",\n\n"
                        + "Votre mot de passe a été réinitialisé par un administrateur.\n"
                        + "Votre nouveau mot de passe temporaire est : " + newPassword + "\n"
                        + "Veuillez vous connecter et le modifier immédiatement.\n\n"
                        + "Cordialement,\nL'équipe Avo-Maitrise.";
                emailService.sendSimpleEmail(user.getEmail(), "Réinitialisation de votre mot de passe", emailText);
            } catch (Exception mailEx) {
                log.warn("Échec d'envoi du mail de réinitialisation à {}: {}", user.getEmail(), mailEx.getMessage());
            }
        }
        return newPassword;
    }

    @Transactional
    public void requireOtpReconfiguration(Long id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        String kcUserId = ensureUserInKeycloak(mapper.toDto(entity), null);
        entity.setKeycloakId(kcUserId);
        repository.save(entity);
        keycloakService.requireUserAction(kcUserId, "CONFIGURE_TOTP");
    }

    /**
     * Garantit l'existence de l'utilisateur dans Keycloak, synchronise son profil et son rôle métier,
     * et retourne son identifiant Keycloak (sub). Lève une ResponseStatusException en cas d'échec (mode strict).
     */
    private String ensureUserInKeycloak(UserDTO dto, String temporaryPassword) {
        try {
            String kcUserId = resolveExistingKeycloakId(dto);
            CreateUserRequest kcRequest = buildKeycloakRequest(dto, temporaryPassword);

            if (kcUserId != null) {
                keycloakService.updateUser(kcUserId, kcRequest);
                return kcUserId;
            }

            if (kcRequest.getPassword() == null || kcRequest.getPassword().isBlank()) {
                kcRequest.setPassword(generateSecurePassword(14));
            }
            kcRequest.setRequiredActions(List.of("UPDATE_PASSWORD", "CONFIGURE_TOTP"));
            return keycloakService.createUser(kcRequest);
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.error("Échec de synchronisation Keycloak pour '{}': {}", dto.getUsername(), e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Impossible de synchroniser l'utilisateur avec Keycloak : " + e.getMessage(),
                    e);
        }
    }

    private String resolveExistingKeycloakId(UserDTO dto) {
        if (dto.getKeycloakId() != null && !dto.getKeycloakId().isBlank()) {
            return dto.getKeycloakId().trim();
        }
        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            String byUsername = keycloakService.getUserIdByUsername(dto.getUsername().trim());
            if (byUsername != null) return byUsername;
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            return keycloakService.getUserIdByEmail(dto.getEmail().trim());
        }
        return null;
    }

    private CreateUserRequest buildKeycloakRequest(UserDTO dto, String temporaryPassword) {
        CreateUserRequest req = new CreateUserRequest();
        String safeUsername = (dto.getUsername() != null && !dto.getUsername().isBlank())
                ? dto.getUsername().trim()
                : "user_" + (dto.getId() != null ? dto.getId() : System.currentTimeMillis());
        req.setUsername(safeUsername);
        req.setEmail(dto.getEmail());
        req.setFirstName(dto.getFirstName());
        req.setLastName(dto.getLastName());
        req.setEnabled(dto.isActive());
        req.setPassword(temporaryPassword);
        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            req.setRoles(List.of(dto.getRole().trim().toUpperCase()));
        }
        return req;
    }
}

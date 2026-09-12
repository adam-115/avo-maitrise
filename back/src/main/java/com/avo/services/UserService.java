package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;
import com.avo.mappers.UserMapper;
import com.avo.repositories.UserRepository;
import com.querydsl.core.types.Predicate;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

import com.avo.dtos.CreateUserRequest;
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

    public UserService(UserRepository repository, UserMapper mapper, KeycloakUserManagementService keycloakService, EmailService emailService) {
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

    public UserDTO create(UserDTO dto) {
        // 1. Create user in Keycloak
        CreateUserRequest kcRequest = new CreateUserRequest();
        kcRequest.setUsername(dto.getUsername());
        kcRequest.setEmail(dto.getEmail());
        kcRequest.setFirstName(dto.getFirstName());
        kcRequest.setLastName(dto.getLastName());
        kcRequest.setEnabled(dto.isActive());
        
        // Generate secure temporary password if none supplied
        String temporaryPassword = (dto.getTempPassword() != null && !dto.getTempPassword().trim().isEmpty())
                ? dto.getTempPassword()
                : generateSecurePassword(14);
        kcRequest.setPassword(temporaryPassword);

        List<String> targetRoles = dto.getRoles();
        if (targetRoles != null && !targetRoles.isEmpty()) {
            kcRequest.setRoles(targetRoles);
        } else if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            kcRequest.setRoles(List.of(dto.getRole()));
        }
        
        // Force the user to update their password and configure OTP upon first login
        kcRequest.setRequiredActions(List.of("UPDATE_PASSWORD", "CONFIGURE_TOTP"));

        try {
            String kcId = keycloakService.createUser(kcRequest);
            dto.setKeycloakId(kcId);
        } catch (Exception e) {
            log.error("Failed to create user in Keycloak: {}", e.getMessage());
        }

        // 2. Save to local DB
        AppUser entity = mapper.toEntity(dto);
        if (targetRoles != null && !targetRoles.isEmpty()) {
            entity.setRole(String.join(",", targetRoles));
        }
        AppUser savedUser = repository.save(entity);

        // 3. Send welcome email with temporary password if email is available
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            try {
                String emailText = "Bonjour " + (dto.getFirstName() != null ? dto.getFirstName() : "") + ",\n\n"
                    + "Votre compte Avo-Maîtrise a été créé.\n"
                    + "Identifiant : " + dto.getUsername() + "\n"
                    + "Mot de passe temporaire : " + temporaryPassword + "\n\n"
                    + "Veuillez vous connecter et définir votre mot de passe personnel dès votre première connexion.\n\n"
                    + "Cordialement,\nL'équipe Avo-Maitrise.";
                emailService.sendSimpleEmail(dto.getEmail(), "Bienvenue sur Avo-Maîtrise - Vos identifiants", emailText);
            } catch (Exception mailEx) {
                log.warn("Could not send welcome email to {}: {}", dto.getEmail(), mailEx.getMessage());
            }
        }

        return mapper.toDto(savedUser);
    }

    public UserDTO update(UserDTO dto) {
        // Load existing user to preserve important fields like keycloakId
        AppUser existingUser = repository.findById(dto.getId()).orElse(null);
        if (existingUser != null) {
            if (dto.getKeycloakId() == null) {
                dto.setKeycloakId(existingUser.getKeycloakId());
            }
            if (dto.getCreatedAt() == null) {
                dto.setCreatedAt(existingUser.getCreatedAt());
            }
        }

        // Auto-healing : si on n'a toujours pas de keycloakId (même en BDD), on tente de le récupérer depuis Keycloak
        if (dto.getKeycloakId() == null && dto.getUsername() != null) {
            try {
                String fetchedKcId = keycloakService.getUserIdByUsername(dto.getUsername());
                if (fetchedKcId != null) {
                    dto.setKeycloakId(fetchedKcId);
                }
            } catch (Exception e) {
                log.warn("Impossible de récupérer l'ID Keycloak par username: {}", e.getMessage());
            }
        }

        AppUser entity = mapper.toEntity(dto);
        List<String> targetRoles = dto.getRoles();
        if (targetRoles != null && !targetRoles.isEmpty()) {
            entity.setRole(String.join(",", targetRoles));
        }
        UserDTO updatedDto = mapper.toDto(repository.save(entity));

        // Sync with Keycloak
        try {
            String kcUserId = getOrSyncKeycloakId(dto);
            if (kcUserId != null) {
                CreateUserRequest kcRequest = new CreateUserRequest();
                kcRequest.setFirstName(dto.getFirstName());
                kcRequest.setLastName(dto.getLastName());
                kcRequest.setEmail(dto.getEmail());
                kcRequest.setEnabled(dto.isActive());
                if (targetRoles != null && !targetRoles.isEmpty()) {
                    kcRequest.setRoles(targetRoles);
                } else if (dto.getRole() != null && !dto.getRole().isEmpty()) {
                    kcRequest.setRoles(List.of(dto.getRole()));
                }
                keycloakService.updateUser(kcUserId, kcRequest);
            }
        } catch (Exception e) {
            log.error("Failed to sync user update with Keycloak: {}", e.getMessage());
        }

        return updatedDto;
    }

    private String getOrSyncKeycloakId(UserDTO dto) {
        if (dto.getKeycloakId() != null && !dto.getKeycloakId().isEmpty()) {
            return dto.getKeycloakId();
        }

        String kcUserId = null;
        if (dto.getUsername() != null) {
            kcUserId = keycloakService.getUserIdByUsername(dto.getUsername());
        }
        if (kcUserId != null) {
            updateKeycloakIdInDb(dto.getId(), kcUserId);
            return kcUserId;
        }

        // Fallback by email
        kcUserId = keycloakService.getUserIdByEmail(dto.getEmail());
        if (kcUserId != null) {
            updateKeycloakIdInDb(dto.getId(), kcUserId);
            return kcUserId;
        }

        // Auto-create in Keycloak for resilience against manual DB inserts
        CreateUserRequest kcRequest = new CreateUserRequest();
        String safeUsername = dto.getUsername() != null 
            ? dto.getUsername().replaceAll("[^a-zA-Z0-9\\-_\\.]", "_") 
            : "user_" + dto.getId();
        kcRequest.setUsername(safeUsername);
        
        kcRequest.setEmail(dto.getEmail());
        kcRequest.setFirstName(dto.getFirstName());
        kcRequest.setLastName(dto.getLastName());
        kcRequest.setEnabled(dto.isActive());
        kcRequest.setPassword(generateSecurePassword(14));
        if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            kcRequest.setRoles(List.of(dto.getRole()));
        }
        
        try {
            String newKcId = keycloakService.createUser(kcRequest);
            updateKeycloakIdInDb(dto.getId(), newKcId);
            return newKcId;
        } catch (Exception e) {
            log.error("Failed to auto-create user in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Impossible de synchroniser avec Keycloak: " + e.getMessage(), e);
        }
    }

    private void updateKeycloakIdInDb(Long id, String keycloakId) {
        repository.findById(id).ifPresent(entity -> {
            entity.setKeycloakId(keycloakId);
            repository.save(entity);
        });
    }

    public void disableUser(Long id) {
        UserDTO user = findById(id);
        if (user != null) {
            user.setActive(false);
            repository.save(mapper.toEntity(user));
            
            try {
                String kcUserId = getOrSyncKeycloakId(user);
                if (kcUserId != null) {
                    keycloakService.disableUser(kcUserId);
                }
            } catch (Exception e) {
                log.error("Failed to disable user in Keycloak: {}", e.getMessage());
            }
        }
    }

    public void enableUser(Long id) {
        UserDTO user = findById(id);
        if (user != null) {
            user.setActive(true);
            repository.save(mapper.toEntity(user));
            
            try {
                String kcUserId = getOrSyncKeycloakId(user);
                if (kcUserId != null) {
                    CreateUserRequest updateReq = new CreateUserRequest();
                    updateReq.setFirstName(user.getFirstName());
                    updateReq.setLastName(user.getLastName());
                    updateReq.setEmail(user.getEmail());
                    updateReq.setEnabled(true);
                    keycloakService.updateUser(kcUserId, updateReq);
                }
            } catch (Exception e) {
                log.error("Failed to enable user in Keycloak: {}", e.getMessage());
            }
        }
    }

    public void updateRole(Long id, String newRole) {
        UserDTO user = findById(id);
        if (user != null) {
            String oldRole = user.getRole();
            user.setRole(newRole);
            repository.save(mapper.toEntity(user));
            
            try {
                String kcUserId = getOrSyncKeycloakId(user);
                if (kcUserId != null) {
                    if (oldRole != null && !oldRole.isEmpty()) {
                        keycloakService.removeRole(kcUserId, oldRole);
                    }
                    if (newRole != null && !newRole.isEmpty()) {
                        keycloakService.assignRole(kcUserId, newRole);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to update role in Keycloak: {}", e.getMessage());
            }
        }
    }

    public void delete(Long id) {
        // repository.deleteById(id);
    }

    public String resetPassword(Long id) {
        UserDTO user = findById(id);
        if (user != null) {
            String kcUserId = getOrSyncKeycloakId(user);
            if (kcUserId != null) {
                // Generate cryptographically strong random password
                String newPassword = generateSecurePassword(14);
                
                com.avo.dtos.PasswordResetRequest req = new com.avo.dtos.PasswordResetRequest(kcUserId, newPassword, true);
                keycloakService.resetPassword(req);
                
                // Envoi de l'e-mail avec le mot de passe temporaire
                if (user.getEmail() != null) {
                    String emailText = "Bonjour " + user.getFirstName() + ",\n\n"
                        + "Votre mot de passe a été réinitialisé par un administrateur.\n"
                        + "Votre nouveau mot de passe temporaire est : " + newPassword + "\n"
                        + "Veuillez vous connecter et le modifier immédiatement.\n\n"
                        + "Cordialement,\nL'équipe Avo-Maitrise.";
                    emailService.sendSimpleEmail(user.getEmail(), "Réinitialisation de votre mot de passe", emailText);
                }
                
                return newPassword;
            }
        }
        throw new RuntimeException("Utilisateur introuvable ou impossible à synchroniser avec Keycloak");
    }

    public void requireOtpReconfiguration(Long id) {
        UserDTO user = findById(id);
        if (user != null) {
            String kcUserId = getOrSyncKeycloakId(user);
            if (kcUserId != null) {
                keycloakService.requireUserAction(kcUserId, "CONFIGURE_TOTP");
            }
        }
    }
}

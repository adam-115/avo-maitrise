package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;
import com.avo.mappers.UserMapper;
import com.avo.repositories.UserRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

import com.avo.dtos.CreateUserRequest;

@Service
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;
    private final KeycloakUserManagementService keycloakService;

    public UserService(UserRepository repository, UserMapper mapper, KeycloakUserManagementService keycloakService) {
        this.repository = repository;
        this.mapper = mapper;
        this.keycloakService = keycloakService;
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
        // Set requested temporary password or fallback
        if (dto.getTempPassword() != null && !dto.getTempPassword().isEmpty()) {
            kcRequest.setPassword(dto.getTempPassword());
        } else {
            kcRequest.setPassword("AvoMaitrise@123");
        }
        if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            kcRequest.setRoles(List.of(dto.getRole()));
        }
        
        // Force the user to update their password and configure OTP upon first login
        kcRequest.setRequiredActions(List.of("UPDATE_PASSWORD", "CONFIGURE_TOTP"));

        try {
            String kcId = keycloakService.createUser(kcRequest);
            dto.setKeycloakId(kcId);
        } catch (Exception e) {
            System.err.println("Failed to create user in Keycloak: " + e.getMessage());
        }

        // 2. Save to local DB
        AppUser entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
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
                System.err.println("Could not fetch keycloakId for auto-healing: " + e.getMessage());
            }
        }

        // 1. Save to local DB
        AppUser entity = mapper.toEntity(dto);
        UserDTO saved = mapper.toDto(repository.save(entity));

        // 2. Update user in Keycloak
        try {
            String kcUserId = dto.getKeycloakId() != null ? dto.getKeycloakId() : keycloakService.getUserIdByUsername(dto.getUsername());
            if (kcUserId != null) {
                CreateUserRequest kcRequest = new CreateUserRequest();
                kcRequest.setFirstName(dto.getFirstName());
                kcRequest.setLastName(dto.getLastName());
                kcRequest.setEmail(dto.getEmail());
                kcRequest.setEnabled(dto.isActive());
                keycloakService.updateUser(kcUserId, kcRequest);
            }
        } catch (Exception e) {
            System.err.println("Failed to update user in Keycloak: " + e.getMessage());
        } 

        return saved;
    }

    private String getOrSyncKeycloakId(UserDTO dto) {
        if (dto.getKeycloakId() != null) {
            return dto.getKeycloakId();
        }
        
        String kcUserId = keycloakService.getUserIdByUsername(dto.getUsername());
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
        kcRequest.setUsername(dto.getUsername());
        kcRequest.setEmail(dto.getEmail());
        kcRequest.setFirstName(dto.getFirstName());
        kcRequest.setLastName(dto.getLastName());
        kcRequest.setEnabled(dto.isActive());
        kcRequest.setPassword("AvoMaitrise@123");
        if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            kcRequest.setRoles(List.of(dto.getRole()));
        }
        
        try {
            String newKcId = keycloakService.createUser(kcRequest);
            updateKeycloakIdInDb(dto.getId(), newKcId);
            return newKcId;
        } catch (Exception e) {
            System.err.println("Failed to auto-create user in Keycloak: " + e.getMessage());
            return null;
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
                System.err.println("Failed to disable user in Keycloak: " + e.getMessage());
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
                System.err.println("Failed to enable user in Keycloak: " + e.getMessage());
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
                System.err.println("Failed to update role in Keycloak: " + e.getMessage());
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
                // Générer un mot de passe temporaire complexe de 12 caractères
                String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < 12; i++) {
                    sb.append(chars.charAt((int) (Math.random() * chars.length())));
                }
                String newPassword = sb.toString();
                
                com.avo.dtos.PasswordResetRequest req = new com.avo.dtos.PasswordResetRequest(kcUserId, newPassword, true);
                keycloakService.resetPassword(req);
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

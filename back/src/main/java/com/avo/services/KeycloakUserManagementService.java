package com.avo.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.avo.dtos.CreateUserRequest;
import com.avo.dtos.PasswordResetRequest;
import com.avo.dtos.UserRoleRequest;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class KeycloakUserManagementService {

    @Autowired
    private RealmResource realmResource;

    @Autowired
    private EmailService emailService;

    public String getUserIdByUsername(String username) {
        if (username == null) return null;
        List<UserRepresentation> users = realmResource.users().searchByUsername(username, true);
        if (users != null && !users.isEmpty()) {
            return users.get(0).getId();
        }
        return null;
    }

    /**
     * Recherche un utilisateur par son email (exact match).
     */
    public String getUserIdByEmail(String email) {
        if (email == null) return null;
        List<UserRepresentation> users = realmResource.users().searchByEmail(email, true);
        if (users != null && !users.isEmpty()) {
            return users.get(0).getId();
        }
        return null;
    }

    /**
     * Crée un utilisateur dans Keycloak.
     * Retourne l'ID de l'utilisateur créé.
     */
    public String createUser(CreateUserRequest request) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEnabled(request.isEnabled());
        user.setEmailVerified(true);
        
        if (request.getRequiredActions() != null && !request.getRequiredActions().isEmpty()) {
            user.setRequiredActions(request.getRequiredActions());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(true); // Force temporary password
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(request.getPassword());
            user.setCredentials(Collections.singletonList(credential));
        }

        UsersResource usersResource = realmResource.users();
        Response response = usersResource.create(user);
        
        if (response.getStatus() == 201) {
            String path = response.getLocation().getPath();
            String userId = path.substring(path.lastIndexOf('/') + 1);
            
            // Assignation des rôles si fournis
            if (request.getRoles() != null && !request.getRoles().isEmpty()) {
                assignRoles(userId, request.getRoles());
            }
            log.info("Utilisateur créé dans Keycloak avec l'ID: {}", userId);
            
            // Send email
            if (request.getEmail() != null) {
                String emailText = "Bonjour " + request.getFirstName() + ",\n\n"
                    + "Votre compte a été créé avec succès.\n"
                    + "Votre nom d'utilisateur est : " + request.getUsername() + "\n";
                if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                    emailText += "Votre mot de passe temporaire est : " + request.getPassword() + "\n"
                              + "Veuillez le modifier lors de votre première connexion.\n";
                }
                emailText += "\nCordialement,\nL'équipe Avo-Maitrise.";
                emailService.sendSimpleEmail(request.getEmail(), "Création de votre compte", emailText);
            }
            
            return userId;
        } else {
            String errorBody = "";
            try {
                errorBody = response.readEntity(String.class);
            } catch (Exception e) {
                errorBody = "Could not read response body";
            }
            log.error("Échec de création de l'utilisateur. Status: {}, Body: {}", response.getStatus(), errorBody);
            throw new RuntimeException("Failed to create user in Keycloak, status: " + response.getStatus() + ", details: " + errorBody);
        }
    }

    /**
     * Met à jour les informations de base d'un utilisateur existant.
     */
    public void updateUser(String userId, CreateUserRequest request) {
        UserResource userResource = realmResource.users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setEnabled(request.isEnabled());
        userResource.update(user);
        log.info("Utilisateur mis à jour dans Keycloak: {}", userId);
    }

    /**
     * Gère l'ajout ou la suppression d'un rôle.
     */
    public void manageRole(UserRoleRequest request) {
        if (request.isAdd()) {
            assignRole(request.getUserId(), request.getRoleName());
        } else {
            removeRole(request.getUserId(), request.getRoleName());
        }
    }

    public void assignRole(String userId, String roleName) {
        UserResource userResource = realmResource.users().get(userId);
        RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
        userResource.roles().realmLevel().add(Collections.singletonList(role));
        log.info("Rôle '{}' assigné à l'utilisateur: {}", roleName, userId);
    }

    public void assignRoles(String userId, List<String> roleNames) {
        UserResource userResource = realmResource.users().get(userId);
        List<RoleRepresentation> roles = new ArrayList<>();
        for (String roleName : roleNames) {
            RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
            roles.add(role);
        }
        userResource.roles().realmLevel().add(roles);
    }

    public void removeRole(String userId, String roleName) {
        UserResource userResource = realmResource.users().get(userId);
        RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
        userResource.roles().realmLevel().remove(Collections.singletonList(role));
        log.info("Rôle '{}' retiré de l'utilisateur: {}", roleName, userId);
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur.
     */
    public void resetPassword(PasswordResetRequest request) {
        UserResource userResource = realmResource.users().get(request.getUserId());
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setTemporary(request.isTemporary());
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getNewPassword());
        userResource.resetPassword(credential);
        log.info("Mot de passe réinitialisé pour l'utilisateur: {}", request.getUserId());
    }

    /**
     * Désactive un utilisateur.
     */
    public void disableUser(String userId) {
        UserResource userResource = realmResource.users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        user.setEnabled(false);
        userResource.update(user);
        log.info("Utilisateur désactivé: {}", userId);
    }

    /**
     * Supprime définitivement un utilisateur.
     */
    public void deleteUser(String userId) {
        realmResource.users().get(userId).remove();
        log.info("Utilisateur supprimé: {}", userId);
    }

    /**
     * Ajoute une action requise pour l'utilisateur.
     */
    public void requireUserAction(String userId, String action) {
        UserResource userResource = realmResource.users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        List<String> requiredActions = user.getRequiredActions();
        if (requiredActions == null) {
            requiredActions = new ArrayList<>();
        }
        if (!requiredActions.contains(action)) {
            requiredActions.add(action);
            user.setRequiredActions(requiredActions);
            userResource.update(user);
            log.info("Action requise '{}' ajoutée pour l'utilisateur: {}", action, userId);

            if (user.getEmail() != null) {
                String actionName = action;
                if ("CONFIGURE_TOTP".equals(action)) {
                    actionName = "la configuration de l'Authentification à Double Facteur (2FA)";
                } else if ("UPDATE_PASSWORD".equals(action)) {
                    actionName = "la mise à jour de votre mot de passe";
                }
                
                String emailText = "Bonjour " + user.getFirstName() + ",\n\n"
                    + "Une action est requise sur votre compte. Vous devez effectuer " + actionName + " lors de votre prochaine connexion.\n\n"
                    + "Cordialement,\nL'équipe Avo-Maitrise.";
                emailService.sendSimpleEmail(user.getEmail(), "Action requise sur votre compte", emailText);
            }
        }
    }
}
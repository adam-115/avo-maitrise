package com.avo.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.avo.dtos.CreateUserRequest;
import com.avo.dtos.PasswordResetRequest;

/**
 * Test d'intégration réel pour KeycloakUserManagementService.
 * Ne mocke pas les données. Assurez-vous que Keycloak tourne sur localhost:7070.
 */
@SpringBootTest
@ActiveProfiles("staging") // Utiliser le profil qui pointe vers localhost:7070
public class KeycloakUserManagementServiceIntegrationTest {

    @Autowired
    private KeycloakUserManagementService keycloakUserManagementService;

    private String testUserId;
    private String testUsername;

    @BeforeEach
    public void setup() {
        // Préparer un nom d'utilisateur unique pour éviter les conflits dans Keycloak
        testUsername = "testuser_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @AfterEach
    public void cleanup() {
        // Nettoyer l'utilisateur après chaque test s'il a été créé
        if (testUserId != null) {
            try {
                keycloakUserManagementService.deleteUser(testUserId);
            } catch (Exception e) {
                // L'utilisateur n'existe peut-être plus ou a déjà été supprimé
            }
        }
    }

    @Test
    public void testFullUserLifecycleInKeycloak() {
        // 1. Create User
        CreateUserRequest createReq = new CreateUserRequest();
        createReq.setUsername(testUsername);
        createReq.setEmail(testUsername + "@test.com");
        createReq.setFirstName("Test");
        createReq.setLastName("User");
        createReq.setPassword("P@ssw0rd123");
        createReq.setEnabled(true);
        
        // Exécuter la création
        testUserId = keycloakUserManagementService.createUser(createReq);
        assertNotNull(testUserId, "L'ID de l'utilisateur ne doit pas être nul après la création");
        assertTrue(!testUserId.isEmpty(), "L'ID de l'utilisateur ne doit pas être vide");

        // 2. Update User
        CreateUserRequest updateReq = new CreateUserRequest();
        updateReq.setFirstName("TestUpdated");
        updateReq.setLastName("UserUpdated");
        updateReq.setEmail(testUsername + "_updated@test.com");
        updateReq.setEnabled(true);

        assertDoesNotThrow(() -> {
            keycloakUserManagementService.updateUser(testUserId, updateReq);
        }, "La mise à jour de l'utilisateur ne doit pas lever d'exception");

        // 3. Reset Password
        PasswordResetRequest pwdReq = new PasswordResetRequest();
        pwdReq.setUserId(testUserId);
        pwdReq.setNewPassword("N3wP@ssw0rd456");
        pwdReq.setTemporary(false);

        assertDoesNotThrow(() -> {
            keycloakUserManagementService.resetPassword(pwdReq);
        }, "La réinitialisation du mot de passe ne doit pas lever d'exception");

        // 4. Disable User
        assertDoesNotThrow(() -> {
            keycloakUserManagementService.disableUser(testUserId);
        }, "La désactivation de l'utilisateur ne doit pas lever d'exception");

        // (Remarque : Pour tester l'assignation de rôle, il faudrait s'assurer 
        // qu'un rôle spécifique existe dans le Realm Keycloak, par ex 'USER' ou 'ADMIN'.
        // Si vous avez un rôle garanti d'exister, vous pouvez le décommenter ci-dessous).
        
        /*
        UserRoleRequest roleReq = new UserRoleRequest();
        roleReq.setUserId(testUserId);
        roleReq.setRoleName("USER"); // Assurez-vous que ce rôle existe dans votre Realm 'avo-app-test'
        roleReq.setAdd(true);
        assertDoesNotThrow(() -> {
            keycloakUserManagementService.manageRole(roleReq);
        });
        */
        
        // 5. Delete User (sera fait dans le block @AfterEach)
    }
}

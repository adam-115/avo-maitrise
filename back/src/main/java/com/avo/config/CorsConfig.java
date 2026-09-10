package com.avo.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * =========================================================================================
 * CLASSE DE CONFIGURATION CORS (Cross-Origin Resource Sharing)
 * =========================================================================================
 * Rôle : Permet au serveur de développement Angular (ex: http://localhost:4200 via `ng serve`)
 * de communiquer avec l'API backend Spring Boot (ex: http://localhost:8080) sans être bloqué
 * par la politique de même origine (Same-Origin Policy) du navigateur.
 */
@Configuration // Déclare cette classe comme une source de configuration Spring (@Bean)
@Profile({"dev", "test"}) // SÉCURITÉ : Active cette configuration UNIQUEMENT pour les profils 'dev' et 'test'.
                          // En production ('prod'), cette classe est totalement ignorée car le frontend et le backend
                          // partagent le même domaine, éliminant tout risque d'attaque cross-origin.
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Récupère la liste des origines autorisées depuis le fichier application-dev.properties.
     * Si la propriété n'est pas définie, utilise par défaut "http://localhost:4200".
     */
    @Value("${app.cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    /**
     * Bean CorsConfigurationSource utilisé automatiquement par Spring Security
     * (notamment dans SecurityFilterChain via .cors(withDefaults())).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 1. Découpe la chaîne d'origines séparées par des virgules en liste nettoyée (sans espaces ni entrées vides)
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // 2. Définit la liste blanche stricte des domaines autorisés (AUCUN wildcard '*' dangereux)
        configuration.setAllowedOrigins(origins);

        // 3. Spécifie explicitement les verbes HTTP autorisés pour les requêtes cross-origin
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 4. Définit les en-têtes HTTP que le frontend est autorisé à envoyer au backend
        configuration.setAllowedHeaders(List.of(
                "Authorization",                  // Pour l'envoi du Bearer Token JWT Keycloak
                "Content-Type",                   // Pour l'envoi de JSON (application/json) ou multipart
                "X-Requested-With",               // Pour identifier les requêtes AJAX/XHR
                "Accept",                         // Pour négocier le type de contenu de réponse
                "Origin",                         // Contient le domaine d'origine de la requête
                "Access-Control-Request-Method",  // En-tête envoyé lors du preflight OPTIONS
                "Access-Control-Request-Headers"  // En-tête listant les headers demandés lors du preflight
        ));

        // 5. Expose les en-têtes de réponse pour que le code JavaScript Angular puisse les lire
        // (ex: Content-Disposition pour le nom des fichiers PDF/téléchargements, Authorization pour refresh token)
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));

        // 6. Autorise l'envoi des identifiants (Cookies, jetons d'authentification HTTP Authorization)
        configuration.setAllowCredentials(true);

        // 7. Durée maximale (en secondes) pendant laquelle le navigateur peut mettre en cache la réponse preflight OPTIONS.
        // 3600 secondes = 1 heure (évite d'envoyer une requête OPTIONS avant chaque appel API réel, booste les perfs).
        configuration.setMaxAge(3600L);

        // 8. Enregistre cette configuration de sécurité CORS pour tous les endpoints de l'application (/**)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configuration CORS au niveau de la couche Spring MVC (WebMvcConfigurer).
     * Assure la cohérence entre les contrôleurs Spring MVC et les filtres de sécurité.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Découpe la liste des origines sous forme de tableau de chaînes
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        // Applique les règles de filtrage CORS sur toutes les routes de l'API
        registry.addMapping("/**")
                .allowedOrigins(origins)                                                      // Origines autorisées (ex: http://localhost:4200)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")           // Méthodes HTTP autorisées
                .allowedHeaders("*")                                                          // Tous les en-têtes valides acceptés
                .exposedHeaders("Authorization", "Content-Disposition")                       // En-têtes visibles par Angular
                .allowCredentials(true)                                                       // Autorise les tokens/cookies
                .maxAge(3600);                                                                // Cache preflight de 1 heure
    }
}

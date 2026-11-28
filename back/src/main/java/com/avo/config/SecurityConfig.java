package com.avo.config;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("!dev & !test")
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        return http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. Public API endpoints & OAuth2 provider callbacks (protected by signed one-time state)
                        .requestMatchers("/api/public/**", "/api/mail-integration/oauth/*/callback").permitAll()
                        
                        // 2. Health & Info probes for reverse proxy / monitoring
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        
                        // 3. Sensitive actuator endpoints restricted to ADMIN / SUPER_ADMIN
                        .requestMatchers("/actuator/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "admin", "super_admin")
                        
                        // 3b. Journal d'audit & configuration OAuth2 messagerie : administrateurs uniquement
                        .requestMatchers("/api/audit/**", "/api/mail-integration/config").hasAnyRole("ADMIN", "SUPER_ADMIN", "admin", "super_admin")

                        // 4. All business API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()
                        
                        // 5. Frontend SPA static routes & assets
                        .requestMatchers(
                                "/", "/index.html", "/favicon.ico",
                                "/*.js", "/*.css", "/*.map",
                                "/*.jpg", "/*.jpeg", "/*.png", "/*.gif", "/*.webp", "/*.svg", "/*.ico", "/*.mp4",
                                "/*.woff", "/*.woff2", "/*.ttf", "/*.json", "/*.webmanifest",
                                "/assets/**",
                                "/error",
                                "/home/**", "/test/**",
                                "/{path:[^\\.]*}"
                        ).permitAll()
                        
                        // 6. Any other request requires authentication
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    @SuppressWarnings("unchecked")
    public JwtAuthenticationConverter jwtAuthenticationConverter(com.avo.services.UserService userService) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            java.util.Set<org.springframework.security.core.GrantedAuthority> authorities = new java.util.LinkedHashSet<>();
            String detectedAppRole = null;
            java.util.Set<String> knownAppRoles = java.util.Set.of(
                    "ADMIN", "SUPER_ADMIN", "ASSOCIE", "AVOCAT", "COLLABORATEUR",
                    "SECRETARIAT", "COMPLIANCE_OFFICER", "STANDARD", "CONSULTANT"
            );

            // 1. Rôles Realm Keycloak (realm_access.roles)
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                for (Object r : roles) {
                    if (r != null) {
                        String roleStr = r.toString();
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleStr));
                        if (detectedAppRole == null && knownAppRoles.contains(roleStr.toUpperCase())) {
                            detectedAppRole = roleStr.toUpperCase();
                        }
                    }
                }
            }

            // 2. Rôles Client Keycloak (resource_access.<client>.roles)
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                for (Object clientEntry : resourceAccess.values()) {
                    if (clientEntry instanceof Map<?, ?> clientMap && clientMap.get("roles") instanceof Collection<?> clientRoles) {
                        for (Object r : clientRoles) {
                            if (r != null) {
                                String roleStr = r.toString();
                                authorities.add(new SimpleGrantedAuthority("ROLE_" + roleStr));
                                if (detectedAppRole == null && knownAppRoles.contains(roleStr.toUpperCase())) {
                                    detectedAppRole = roleStr.toUpperCase();
                                }
                            }
                        }
                    }
                }
            }

            // 3. Liaison automatique & JIT provisioning sur app_users (synchronise keycloak_id + injecte le rôle DB)
            try {
                userService.linkOrProvisionFromJwt(
                        jwt.getSubject(),
                        jwt.getClaimAsString("preferred_username"),
                        jwt.getClaimAsString("email"),
                        jwt.getClaimAsString("given_name"),
                        jwt.getClaimAsString("family_name"),
                        detectedAppRole
                ).map(com.avo.entities.AppUser::getRole)
                 .filter(role -> role != null && !role.isBlank())
                 .ifPresent(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role.trim().toUpperCase())));
            } catch (Exception ignored) {
                // Ne jamais bloquer l'authentification si la lookup/JIT DB échoue
            }

            return authorities;
        });
        return converter;
    }
}
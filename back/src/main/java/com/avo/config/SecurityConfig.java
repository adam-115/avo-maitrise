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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. Public API endpoints
                        .requestMatchers("/api/public/**").permitAll()
                        
                        // 2. Health & Info probes for reverse proxy / monitoring
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        
                        // 3. Sensitive actuator endpoints restricted to ADMIN / SUPER_ADMIN
                        .requestMatchers("/actuator/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "admin", "super_admin")
                        
                        // 4. All business API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()
                        
                        // 5. Frontend SPA static routes & assets
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/*.js", "/*.css", "/assets/**", "/home/**", "/test/**", "/{path:[^\\.]*}").permitAll()
                        
                        // 6. Any other request requires authentication
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()))
                .build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null || !realmAccess.containsKey("roles")) {
                return Collections.emptyList();
            }
            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });
        return converter;
    }
}
package com.avo.audit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AuditContextTest {

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void keycloak_user_is_recorded_with_readable_username_and_subject() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("3f2a9c1e-uuid")
                .claim("preferred_username", "me.martin")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt, AuthorityUtils.NO_AUTHORITIES));

        assertThat(AuditContext.currentUser()).isEqualTo("me.martin (3f2a9c1e-uuid)");
        assertThat(AuditContext.currentOrigin()).isEqualTo(AuditContext.ORIGIN_USER);
    }

    @Test
    void no_authentication_means_system_actor() {
        assertThat(AuditContext.currentUser()).isEqualTo(AuditContext.SYSTEM_USER);
        assertThat(AuditContext.currentOrigin()).isEqualTo(AuditContext.ORIGIN_SYSTEM);
    }

    @Test
    void anonymous_user_is_treated_as_system() {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));

        assertThat(AuditContext.currentUser()).isEqualTo(AuditContext.SYSTEM_USER);
    }
}

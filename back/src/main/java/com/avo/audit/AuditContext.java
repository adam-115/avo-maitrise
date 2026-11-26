package com.avo.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Qui agit, et d'où : informations communes au journal des consultations et à l'historique Envers.
 * Hors requête HTTP (tâches planifiées, vérification Yente automatique...), l'acteur est {@link #SYSTEM_USER}.
 */
public final class AuditContext {

    public static final String SYSTEM_USER = "SYSTEME";
    public static final String ORIGIN_USER = "UTILISATEUR";
    public static final String ORIGIN_SYSTEM = "SYSTEME";

    private AuditContext() {}

    public static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken
                || auth.getName() == null) {
            return SYSTEM_USER;
        }
        // Avec Keycloak, getName() renvoie l'identifiant technique (UUID « sub ») : illisible pour un contrôleur.
        // On enregistre le nom d'utilisateur Keycloak, suivi de l'UUID pour lever toute ambiguïté.
        if (auth.getPrincipal() instanceof Jwt jwt) {
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return truncate(username + " (" + jwt.getSubject() + ")", 255);
            }
        }
        return truncate(auth.getName(), 255);
    }

    public static String currentOrigin() {
        return SYSTEM_USER.equals(currentUser()) ? ORIGIN_SYSTEM : ORIGIN_USER;
    }

    /** Adresse IP du client, en tenant compte du reverse proxy (Caddy) qui transmet X-Forwarded-For. */
    public static String currentIp() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return truncate(forwarded.split(",")[0].trim(), 64);
        }
        return truncate(request.getRemoteAddr(), 64);
    }

    public static String currentUserAgent() {
        HttpServletRequest request = currentRequest();
        return request == null ? null : truncate(request.getHeader("User-Agent"), 512);
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletAttributes) {
            return servletAttributes.getRequest();
        }
        return null;
    }

    static String truncate(String value, int max) {
        return (value == null || value.length() <= max) ? value : value.substring(0, max);
    }
}

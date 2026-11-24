package com.avo.services.mail;

import com.avo.entities.MailAccount;
import com.avo.repositories.MailAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gère le flux OAuth2 (Microsoft 365 & Google Workspace) en mode :
 * - E-mail : LECTURE SEULE (Mail.Read / gmail.readonly) — aucune permission d'envoi.
 * - Calendrier : ÉCRITURE (Calendars.ReadWrite / calendar.events).
 */
@Service
@Slf4j
public class MailOAuth2Service {

    private static final String MS_SCOPES = "openid profile email offline_access User.Read Mail.Read Calendars.ReadWrite";
    private static final String GOOGLE_SCOPES =
            "https://www.googleapis.com/auth/gmail.readonly " +
            "https://www.googleapis.com/auth/calendar.events " +
            "https://www.googleapis.com/auth/userinfo.email " +
            "https://www.googleapis.com/auth/userinfo.profile";

    private record OAuthState(String ownerUsername, String provider, Instant expiresAt) {}

    private final Map<String, OAuthState> pendingStates = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper objectMapper;
    private final MailAccountRepository accountRepository;
    private final MailCredentialCrypto crypto;

    @Value("${mail.integration.frontend-url:http://localhost:8080}")
    private String frontendUrl;

    @Value("${mail.integration.oauth.microsoft.client-id:}")
    private String msClientId;
    @Value("${mail.integration.oauth.microsoft.client-secret:}")
    private String msClientSecret;
    @Value("${mail.integration.oauth.microsoft.tenant-id:common}")
    private String msTenantId;
    @Value("${mail.integration.oauth.microsoft.redirect-uri:http://localhost:8080/api/mail-integration/oauth/microsoft/callback}")
    private String msRedirectUri;

    @Value("${mail.integration.oauth.google.client-id:}")
    private String googleClientId;
    @Value("${mail.integration.oauth.google.client-secret:}")
    private String googleClientSecret;
    @Value("${mail.integration.oauth.google.redirect-uri:http://localhost:8080/api/mail-integration/oauth/google/callback}")
    private String googleRedirectUri;

    public MailOAuth2Service(ObjectMapper objectMapper,
                             MailAccountRepository accountRepository,
                             MailCredentialCrypto crypto) {
        this.objectMapper = objectMapper;
        this.accountRepository = accountRepository;
        this.crypto = crypto;
    }

    public Map<String, Object> getProvidersConfigStatus() {
        return Map.of(
                "microsoftConfigured", isMicrosoftConfigured(),
                "googleConfigured", isGoogleConfigured(),
                "microsoftRedirectUri", msRedirectUri,
                "googleRedirectUri", googleRedirectUri,
                "microsoftScopes", MS_SCOPES,
                "googleScopes", GOOGLE_SCOPES
        );
    }

    public boolean isMicrosoftConfigured() {
        return msClientId != null && !msClientId.isBlank() && msClientSecret != null && !msClientSecret.isBlank();
    }

    public boolean isGoogleConfigured() {
        return googleClientId != null && !googleClientId.isBlank() && googleClientSecret != null && !googleClientSecret.isBlank();
    }

    public String getFrontendRedirectBase() {
        return frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:8080";
    }

    public String buildAuthorizeUrl(String provider, String ownerUsername) {
        cleanupExpiredStates();
        String state = UUID.randomUUID().toString();
        pendingStates.put(state, new OAuthState(ownerUsername, provider.toUpperCase(), Instant.now().plusSeconds(600)));

        if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(provider)) {
            if (!isMicrosoftConfigured()) {
                throw new IllegalStateException("Microsoft OAuth2 non configuré (définissez MICROSOFT_OAUTH_CLIENT_ID et MICROSOFT_OAUTH_CLIENT_SECRET).");
            }
            String tenant = (msTenantId == null || msTenantId.isBlank()) ? "common" : msTenantId;
            return "https://login.microsoftonline.com/" + enc(tenant) + "/oauth2/v2.0/authorize"
                    + "?client_id=" + enc(msClientId)
                    + "&response_type=code"
                    + "&redirect_uri=" + enc(msRedirectUri)
                    + "&response_mode=query"
                    + "&scope=" + enc(MS_SCOPES)
                    + "&prompt=select_account"
                    + "&state=" + enc(state);
        }

        if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(provider)) {
            if (!isGoogleConfigured()) {
                throw new IllegalStateException("Google OAuth2 non configuré (définissez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET).");
            }
            return "https://accounts.google.com/o/oauth2/v2/auth"
                    + "?client_id=" + enc(googleClientId)
                    + "&response_type=code"
                    + "&redirect_uri=" + enc(googleRedirectUri)
                    + "&scope=" + enc(GOOGLE_SCOPES)
                    + "&access_type=offline"
                    + "&prompt=consent"
                    + "&state=" + enc(state);
        }

        throw new IllegalArgumentException("Fournisseur OAuth2 inconnu : " + provider);
    }

    public MailAccount handleCallback(String provider, String code, String state) {
        OAuthState st = pendingStates.remove(state);
        if (st == null || st.expiresAt().isBefore(Instant.now()) || !st.provider().equalsIgnoreCase(provider)) {
            throw new IllegalArgumentException("État OAuth2 invalide ou expiré. Veuillez relancer la connexion.");
        }

        if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(provider)) {
            return exchangeMicrosoftCode(code, st.ownerUsername());
        } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(provider)) {
            return exchangeGoogleCode(code, st.ownerUsername());
        }
        throw new IllegalArgumentException("Fournisseur OAuth2 inconnu : " + provider);
    }

    /**
     * Retourne un access_token valide, en le rafraîchissant automatiquement s'il expire dans moins de 2 minutes.
     */
    public String getValidAccessToken(MailAccount account) {
        if (account.getEncryptedAccessToken() != null
                && account.getTokenExpiresAt() != null
                && account.getTokenExpiresAt().isAfter(LocalDateTime.now().plusMinutes(2))) {
            return crypto.decrypt(account.getEncryptedAccessToken());
        }
        String refreshToken = crypto.decrypt(account.getEncryptedSecret());
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalStateException("Jeton de rafraîchissement manquant — veuillez reconnecter le compte " + account.getEmailAddress());
        }

        JsonNode tokenJson;
        if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(account.getProvider())) {
            String tenant = (msTenantId == null || msTenantId.isBlank()) ? "common" : msTenantId;
            String form = "client_id=" + enc(msClientId)
                    + "&client_secret=" + enc(msClientSecret)
                    + "&grant_type=refresh_token"
                    + "&refresh_token=" + enc(refreshToken)
                    + "&scope=" + enc(MS_SCOPES);
            tokenJson = postForm("https://login.microsoftonline.com/" + enc(tenant) + "/oauth2/v2.0/token", form);
        } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(account.getProvider())) {
            String form = "client_id=" + enc(googleClientId)
                    + "&client_secret=" + enc(googleClientSecret)
                    + "&grant_type=refresh_token"
                    + "&refresh_token=" + enc(refreshToken);
            tokenJson = postForm("https://oauth2.googleapis.com/token", form);
        } else {
            throw new IllegalArgumentException("Compte non OAuth2 : " + account.getProvider());
        }

        String accessToken = tokenJson.path("access_token").asText("");
        if (accessToken.isBlank()) {
            throw new IllegalStateException("Impossible de rafraîchir le jeton OAuth2 : " + tokenJson.path("error_description").asText(tokenJson.toString()));
        }
        int expiresIn = tokenJson.path("expires_in").asInt(3500);
        account.setEncryptedAccessToken(crypto.encrypt(accessToken));
        account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        if (tokenJson.hasNonNull("refresh_token")) {
            account.setEncryptedSecret(crypto.encrypt(tokenJson.get("refresh_token").asText()));
        }
        account.setLastError(null);
        accountRepository.save(account);
        return accessToken;
    }

    private MailAccount exchangeMicrosoftCode(String code, String ownerUsername) {
        String tenant = (msTenantId == null || msTenantId.isBlank()) ? "common" : msTenantId;
        String form = "client_id=" + enc(msClientId)
                + "&client_secret=" + enc(msClientSecret)
                + "&grant_type=authorization_code"
                + "&code=" + enc(code)
                + "&redirect_uri=" + enc(msRedirectUri)
                + "&scope=" + enc(MS_SCOPES);
        JsonNode tokenJson = postForm("https://login.microsoftonline.com/" + enc(tenant) + "/oauth2/v2.0/token", form);
        String accessToken = tokenJson.path("access_token").asText("");
        String refreshToken = tokenJson.path("refresh_token").asText("");
        int expiresIn = tokenJson.path("expires_in").asInt(3500);
        if (accessToken.isBlank()) {
            throw new IllegalStateException("Échec de l'échange OAuth2 Microsoft : " + tokenJson.path("error_description").asText(""));
        }

        JsonNode me = getJson("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", accessToken);
        String email = me.path("mail").asText("");
        if (email.isBlank()) email = me.path("userPrincipalName").asText("outlook-user@microsoft.com");
        String displayName = me.path("displayName").asText(email);

        return upsertOAuthAccount(ownerUsername, MailAccount.PROVIDER_MICROSOFT, email, displayName, accessToken, refreshToken, expiresIn);
    }

    private MailAccount exchangeGoogleCode(String code, String ownerUsername) {
        String form = "client_id=" + enc(googleClientId)
                + "&client_secret=" + enc(googleClientSecret)
                + "&grant_type=authorization_code"
                + "&code=" + enc(code)
                + "&redirect_uri=" + enc(googleRedirectUri);
        JsonNode tokenJson = postForm("https://oauth2.googleapis.com/token", form);
        String accessToken = tokenJson.path("access_token").asText("");
        String refreshToken = tokenJson.path("refresh_token").asText("");
        int expiresIn = tokenJson.path("expires_in").asInt(3500);
        if (accessToken.isBlank()) {
            throw new IllegalStateException("Échec de l'échange OAuth2 Google : " + tokenJson.path("error_description").asText(""));
        }

        JsonNode me = getJson("https://www.googleapis.com/oauth2/v2/userinfo", accessToken);
        String email = me.path("email").asText("gmail-user@gmail.com");
        String displayName = me.path("name").asText(email);

        return upsertOAuthAccount(ownerUsername, MailAccount.PROVIDER_GOOGLE, email, displayName, accessToken, refreshToken, expiresIn);
    }

    private MailAccount upsertOAuthAccount(String ownerUsername, String provider, String email, String displayName,
                                           String accessToken, String refreshToken, int expiresIn) {
        MailAccount account = accountRepository
                .findByOwnerUsernameAndProviderAndEmailAddressIgnoreCase(ownerUsername, provider, email)
                .orElseGet(MailAccount::new);
        account.setOwnerUsername(ownerUsername);
        account.setProvider(provider);
        account.setEmailAddress(email);
        account.setDisplayName(displayName);
        account.setEncryptedAccessToken(crypto.encrypt(accessToken));
        if (refreshToken != null && !refreshToken.isBlank()) {
            account.setEncryptedSecret(crypto.encrypt(refreshToken));
        }
        account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        account.setCalendarSyncEnabled(true);
        account.setActive(true);
        account.setLastError(null);
        account.setLastSyncAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    private JsonNode postForm(String url, String formBody) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readTree(resp.body());
        } catch (Exception e) {
            throw new RuntimeException("Erreur réseau OAuth2 (" + url + ") : " + e.getMessage(), e);
        }
    }

    private JsonNode getJson(String url, String bearerToken) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + bearerToken)
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readTree(resp.body());
        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture profil OAuth2 : " + e.getMessage(), e);
        }
    }

    private void cleanupExpiredStates() {
        Instant now = Instant.now();
        pendingStates.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }
}

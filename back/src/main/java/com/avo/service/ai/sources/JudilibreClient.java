package com.avo.service.ai.sources;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Vérifie l'existence d'un arrêt de la Cour de cassation par son numéro de pourvoi, via l'API officielle
 * Judilibre (plateforme PISTE de l'État). Une clé gratuite est nécessaire : variable JUDILIBRE_KEY_ID.
 * Sans clé, le service est désactivé et la vérification se limite aux documents du cabinet.
 *
 * Les résultats sont gardés en cache 24 h (une décision publiée ne disparaît pas) ; seul le numéro de pourvoi
 * est transmis à l'API, jamais le contenu du dossier ou de la question de l'avocat.
 */
@Component
public class JudilibreClient implements OfficialReferenceChecker {

    private static final Logger log = LoggerFactory.getLogger(JudilibreClient.class);
    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private static final String DECISION_URL = "https://www.courdecassation.fr/decision/";

    private final String keyId;
    private final RestClient client;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    private record Cached(Result result, Instant at) {}

    public JudilibreClient(@Value("${judilibre.key-id:}") String keyId,
            @Value("${judilibre.base-url:https://api.piste.gouv.fr/cassation/judilibre/v1.0}") String baseUrl,
            @Value("${judilibre.timeout-seconds:6}") int timeoutSeconds) {
        this.keyId = keyId == null ? "" : keyId.trim();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(timeoutSeconds)).build());
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
        if (this.keyId.isEmpty()) {
            log.info("Judilibre désactivé (JUDILIBRE_KEY_ID absent) : les numéros de pourvoi sont vérifiés "
                    + "uniquement dans les documents du cabinet.");
        }
    }

    @Override
    public boolean isEnabled() {
        return !keyId.isEmpty();
    }

    @Override
    public Result checkPourvoi(String pourvoiKey) {
        if (!isEnabled() || pourvoiKey == null) {
            return Result.unavailable();
        }
        Cached cached = cache.get(pourvoiKey);
        if (cached != null && cached.at().plus(CACHE_TTL).isAfter(Instant.now())) {
            return cached.result();
        }
        try {
            JsonNode body = client.get()
                    .uri(uri -> uri.path("/search").queryParam("query", pourvoiKey).queryParam("page_size", 10).build())
                    .header("KeyId", keyId)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(JsonNode.class);
            Result result = Result.notFound();
            if (body != null && body.has("results")) {
                for (JsonNode decision : body.get("results")) {
                    if (matches(decision, pourvoiKey)) {
                        String id = decision.path("id").asText(null);
                        result = Result.found(new OfficialDecision(id, pourvoiKey,
                                decision.path("decision_date").asText(null),
                                decision.path("jurisdiction").asText(null),
                                decision.path("chamber").asText(null),
                                id == null ? null : DECISION_URL + id));
                        break;
                    }
                }
            }
            cache.put(pourvoiKey, new Cached(result, Instant.now()));
            return result;
        } catch (Exception e) {
            // Service officiel indisponible : on ne conclut rien (ni trouvé, ni introuvable)
            log.warn("Judilibre indisponible pour le pourvoi {} : {}", pourvoiKey, e.getMessage());
            return Result.unavailable();
        }
    }

    /** Le numéro recherché figure-t-il parmi les numéros de la décision renvoyée ? */
    private static boolean matches(JsonNode decision, String pourvoiKey) {
        String wanted = pourvoiKey.replaceAll("\\D", "");
        if (decision.path("number").asText("").replaceAll("\\D", "").equals(wanted)) {
            return true;
        }
        for (JsonNode n : decision.path("numbers")) {
            if (n.asText("").replaceAll("\\D", "").equals(wanted)) {
                return true;
            }
        }
        return false;
    }
}

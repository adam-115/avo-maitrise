package com.avo.yente;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ScreeningService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String checkClient(String fullName) {
        // Option A : Recherche globale (plus sûr pour tester)
        String url = "http://localhost:8000/match/default";

        // Option B : Si tu es sûr du nom (ex: "default")
        // String url = "http://localhost:8000/match/default";

        // 1. Structure des propriétés (Indispensable : le nom doit être dans une LISTE)
        Map<String, List<String>> properties = new HashMap<>();
        properties.put("name", Collections.singletonList(fullName)); // Résultat : "name": ["Vladimir Putin"]

        // 2. Détails de la requête
        Map<String, Object> queryDetails = new HashMap<>();
        queryDetails.put("schema", "Person");
        queryDetails.put("properties", properties);

        // 3. L'enveloppe globale "queries"
        Map<String, Map<String, Object>> queries = new HashMap<>();
        queries.put("q1", queryDetails);

        Map<String, Object> payload = new HashMap<>();
        payload.put("queries", queries);

        try {
            return restTemplate.postForObject(url, payload, String.class);
        } catch (Exception e) {
            System.err.println("Erreur détaillée : " + e.getMessage());
            return "Erreur lors de l'appel à Yente";
        }
    }
}
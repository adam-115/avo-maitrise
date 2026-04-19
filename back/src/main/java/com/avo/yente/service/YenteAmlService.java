package com.avo.yente.service;

import com.avo.dao.ClientRepository;
import com.avo.entities.ClientEntity;
import com.avo.yente.client.YenteApiClient;
import com.avo.yente.models.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class YenteAmlService {

    private final YenteApiClient yenteApiClient;
    private final ClientRepository clientrepository;

    public YenteAmlService(YenteApiClient yenteApiClient, ClientRepository clientDao) {
        this.yenteApiClient = yenteApiClient;
        this.clientrepository = clientDao;
    }

    public AmlAnalysisResult checkClientAndSave(Long clientId) {
        ClientEntity client = clientrepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        AmlAnalysisResult result = checkClientStatus(client);

        client.setAmlMatchScore(result.getMatchScore());
        client.setAmlTargetEntityName(result.getMatchName());
        client.setAmlSanctionReason(result.getSanctionReason());
        client.setAmlAnalysisStatus(result.getStatus());
        client.setAmlLastVerificationDate(new Date());

        clientrepository.save(client);
        return result;
    }

    public AmlAnalysisResult checkClientStatus(ClientEntity client) {
        String schema = "Person";
        String fullName = "";
        String country = null;

        if (client instanceof com.avo.entities.PersonnePhysique p) {
            String prenom = p.getPrenom() != null ? p.getPrenom() : "";
            String nom = p.getNom() != null ? p.getNom() : "";
            fullName = (prenom + " " + nom).trim();
            country = p.getNationalite();
        } else if (client instanceof com.avo.entities.ClientMoral m) {
            schema = "Company";
            fullName = m.getNomCommercial() != null ? m.getNomCommercial() : "";
        } else if (client instanceof com.avo.entities.Association a) {
            schema = "Organization";
            fullName = a.getNom() != null ? a.getNom() : "";
        }

        Map<String, List<String>> properties = new HashMap<>();
        if (!fullName.isEmpty()) {
            properties.put("name", List.of(fullName));
        }

        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country));
        }

        YenteMatchQuery query = new YenteMatchQuery(schema, properties);
        Map<String, YenteMatchQuery> queries = new HashMap<>();
        queries.put("query-1", query);

        YenteMatchRequest request = new YenteMatchRequest(queries);

        YenteMatchResponse response;
        try {
            response = yenteApiClient.match(request);
        } catch (Exception e) {
            throw new RuntimeException("Failed to query Yente API: " + e.getMessage(), e);
        }

        return parseResponse(response);
    }

    private AmlAnalysisResult parseResponse(YenteMatchResponse response) {
        AmlAnalysisResult result = new AmlAnalysisResult();
        result.setPep(false);
        result.setSanctioned(false);
        result.setFamilyMember(false);
        result.setStatus("OK");

        if (response == null || response.responses() == null || !response.responses().containsKey("query-1")) {
            return result;
        }

        YenteQueryResponse queryResp = response.responses().get("query-1");
        List<YenteMatchResult> matches = queryResp.results();

        if (matches == null || matches.isEmpty()) {
            return result;
        }

        // Focus on the highest-scoring match
        YenteMatchResult topMatch = matches.get(0);
        result.setMatchScore(topMatch.score());

        // Extract matched target name
        if (topMatch.properties() != null && topMatch.properties().containsKey("name")) {
            List<String> names = topMatch.properties().get("name");
            if (names != null && !names.isEmpty()) {
                result.setMatchName(names.get(0));
            }
        }

        // Analyze topics (like 'sanction', 'role.pep', 'family')
        if (topMatch.properties() != null && topMatch.properties().containsKey("topics")) {
            List<String> topics = topMatch.properties().get("topics");
            if (topics != null) {
                for (String topic : topics) {
                    if (topic.toLowerCase().contains("sanction")) {
                        result.setSanctioned(true);
                    }
                    if (topic.toLowerCase().contains("pep")) {
                        result.setPep(true);
                    }
                    if (topic.toLowerCase().contains("family") || topic.toLowerCase().contains("rel")) {
                        result.setFamilyMember(true);
                    }
                }
            }
        }

        // Analyze datasets origins
        if (topMatch.datasets() != null) {
            for (String dataset : topMatch.datasets()) {
                if (dataset.toLowerCase().contains("sanction")) {
                    result.setSanctioned(true);
                }
                if (dataset.toLowerCase().contains("pep")) {
                    result.setPep(true);
                }
            }
        }

        if (result.isSanctioned()) {
            result.setSanctionReason("Matched against sanctions dataset or flagged topic");
            result.setStatus("BLOCKED");
        } else if (result.isPep() || result.isFamilyMember()) {
            result.setSanctionReason("Flagged as PEP or related family member");
            result.setStatus("SUSPECT");
        }

        return result;
    }
}

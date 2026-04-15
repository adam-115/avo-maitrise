package com.avo.yente.service;

import com.avo.dao.ClientDao;
import com.avo.entities.ClientEntity;
import com.avo.yente.client.YenteApiClient;
import com.avo.yente.models.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class YenteAmlService {

    private final YenteApiClient yenteApiClient;
    private final ClientDao clientDao;

    public YenteAmlService(YenteApiClient yenteApiClient, ClientDao clientDao) {
        this.yenteApiClient = yenteApiClient;
        this.clientDao = clientDao;
    }

    public AmlAnalysisResult checkClientAndSave(UUID clientId) {
        ClientEntity client = clientDao.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        AmlAnalysisResult result = checkClientStatus(client);

        client.setAmlMatchScore(result.getMatchScore());
        client.setAmlTargetEntityName(result.getMatchName());
        client.setAmlSanctionReason(result.getSanctionReason());
        client.setAmlAnalysisStatus(result.getStatus());
        client.setAmlLastVerificationDate(new Date());

        clientDao.save(client);
        return result;
    }

    public AmlAnalysisResult checkClientStatus(ClientEntity client) {
        String schema = (client.getType() != null && client.getType().name().equals("SOCIETE")) ? "Company" : "Person";

        Map<String, List<String>> properties = new HashMap<>();
        String prenom = client.getPrenom() != null ? client.getPrenom() : "";
        String nom = client.getNom() != null ? client.getNom() : "";
        String fullName = (prenom + " " + nom).trim();

        if (fullName.isEmpty() && client.getType() != null && client.getType().name().equals("SOCIETE")) {
            fullName = client.getNom();
        }

        properties.put("name", List.of(fullName));

        if (client.getPaysResidance() != null && !client.getPaysResidance().isEmpty()) {
            properties.put("country", List.of(client.getPaysResidance()));
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

package com.avo.yente.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.avo.entities.ClientEntity;
import com.avo.repositories.ClientRepository;
import com.avo.yente.client.YenteApiClient;
import com.avo.yente.models.AmlAnalysisResult;
import com.avo.yente.models.YenteMatchQuery;
import com.avo.yente.models.YenteMatchRequest;
import com.avo.yente.models.YenteMatchResponse;
import com.avo.yente.models.YenteMatchResult;
import com.avo.yente.models.YenteQueryResponse;

@Service
public class YenteAmlService {

    private final double blockThreshold;
    private final double suspectThreshold;

    private final YenteApiClient yenteApiClient;
    private final ClientRepository clientrepository;

    public YenteAmlService(YenteApiClient yenteApiClient, ClientRepository clientDao,
            @Value("${aml.block.threshold}") double blockThreshold,
            @Value("${aml.suspect.threshold}") double suspectThreshold) {
        this.blockThreshold = blockThreshold;
        this.suspectThreshold = suspectThreshold;
        this.yenteApiClient = yenteApiClient;
        this.clientrepository = clientDao;
    }

    /**
     * Executes the overall AML verification flow for a client.
     * Fetches the client by ID, triggers the Yente status check, and updates the
     * client entity
     * with the latest match score and sanctions status before saving it back to the
     * database.
     *
     * @param clientId The ID of the client to verify
     * @return The complete AML analysis result
     */
    public AmlAnalysisResult checkClientAndSave(Long clientId) {
        ClientEntity client = clientrepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        List<AmlAnalysisResult> result = checkClientStatus(client);
        AmlAnalysisResult bestResult = result.get(0);

        client.setAmlMatchScore(bestResult.getMatchScore());
        client.setAmlTargetEntityName(bestResult.getMatchName());
        client.setAmlSanctionReason(bestResult.getSanctionReason());
        client.setAmlAnalysisStatus(bestResult.getStatus());
        client.setAmlLastVerificationDate(new Date());

        clientrepository.save(client);
        return bestResult;
    }

    /**
     * Checks the health of the connected Yente API endpoint (/healthz).
     *
     * @return true if the API is reachable and healthy, false otherwise
     */
    public boolean checkYenteHealth() {
        return yenteApiClient.checkHealth();
    }

    /**
     * Inspects the subclass type of the given ClientEntity to correctly dispatch
     * the FollowTheMoney schema identification logic.
     *
     * @param client The abstract client entity (PersonnePhysique, ClientMoral,
     *               Association, etc.)
     * @return The AML match results retrieved from Yente
     */
    public List<AmlAnalysisResult> checkClientStatus(ClientEntity client) {
        if (client instanceof com.avo.entities.PersonnePhysique p) {
            return matchPerson(p.getPrenom(), p.getNom(), p.getNationalite());
        } else if (client instanceof com.avo.entities.ClientMoral m) {
            return matchCompany(m.getNomCommercial(), m.getPays());
        } else if (client instanceof com.avo.entities.Association a) {
            return matchOrganization(a.getNom(), a.getPays());
        }

        AmlAnalysisResult emptyResult = new AmlAnalysisResult();
        emptyResult.setStatus("OK");
        return List.of(emptyResult);
    }

    /**
     * Matches a natural person against the Yente/OpenSanctions dataset.
     *
     * @param firstName The person's first name
     * @param lastName  The person's last name
     * @param country   The person's nationality or country of residence
     * @return The outcome of the matching operation
     */
    public List<AmlAnalysisResult> matchPerson(String firstName, String lastName, String country) {
        Map<String, List<String>> properties = new HashMap<>();
        String fullName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        fullName = fullName.trim();
        if (!fullName.isEmpty()) {
            properties.put("name", List.of(fullName));
        }
        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country));
        }
        return executeMatchQuery("Person", properties);
    }

    /**
     * Matches a commercial company against the Yente/OpenSanctions dataset.
     *
     * @param name    The commercial or legal name of the company
     * @param country The jurisdiction or country of registration
     * @return The outcome of the matching operation
     */
    public List<AmlAnalysisResult> matchCompany(String name, String country) {
        Map<String, List<String>> properties = new HashMap<>();
        if (name != null && !name.isEmpty()) {
            properties.put("name", List.of(name));
        }
        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country)); // FollowTheMoney allows country/jurisdiction
        }
        return executeMatchQuery("Company", properties);
    }

    /**
     * Matches an organization or association against the Yente/OpenSanctions
     * dataset.
     *
     * @param name    The name of the organization
     * @param country The country where the organization operates
     * @return The outcome of the matching operation
     */
    public List<AmlAnalysisResult> matchOrganization(String name, String country) {
        Map<String, List<String>> properties = new HashMap<>();
        if (name != null && !name.isEmpty()) {
            properties.put("name", List.of(name));
        }
        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country));
        }
        return executeMatchQuery("Organization", properties);
    }

    /**
     * Matches a marine vessel against the Yente/OpenSanctions dataset.
     *
     * @param name      The name of the vessel
     * @param imoNumber The International Maritime Organization identifier for the
     *                  vessel
     * @param country   The flag under which the vessel is registered
     * @return The outcome of the matching operation
     */
    public List<AmlAnalysisResult> matchVessel(String name, String imoNumber, String country) {
        Map<String, List<String>> properties = new HashMap<>();
        if (name != null && !name.isEmpty()) {
            properties.put("name", List.of(name));
        }
        if (imoNumber != null && !imoNumber.isEmpty()) {
            properties.put("imoNumber", List.of(imoNumber));
        }
        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country));
        }
        return executeMatchQuery("Vessel", properties);
    }

    /**
     * Matches an airplane against the Yente/OpenSanctions dataset.
     *
     * @param name               The name or model of the airplane
     * @param registrationNumber The aircraft registration or tail number
     * @param country            The registering country of the aircraft
     * @return The outcome of the matching operation
     */
    public List<AmlAnalysisResult> matchAirplane(String name, String registrationNumber, String country) {
        Map<String, List<String>> properties = new HashMap<>();
        if (name != null && !name.isEmpty()) {
            properties.put("name", List.of(name));
        }
        if (registrationNumber != null && !registrationNumber.isEmpty()) {
            properties.put("registrationNumber", List.of(registrationNumber));
        }
        if (country != null && !country.isEmpty()) {
            properties.put("country", List.of(country));
        }
        return executeMatchQuery("Airplane", properties);
    }

    /**
     * Packages the properties and schema into a Yente exact match query, executes
     * the HTTP request,
     * and delegates the result logic to the parser.
     *
     * @param schema     The FollowTheMoney semantic schema requested
     * @param properties The dictionary of attributes to evaluate against the
     *                   dataset
     * @return The aggregated and parsed analysis result
     */
    private List<AmlAnalysisResult> executeMatchQuery(String schema, Map<String, List<String>> properties) {
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

    /**
     * Extracts and calculates the AML risk profile by examining the returned
     * YenteMatchResponse.
     * It highlights explicit "sanction" or "pep" topics and dataset origins
     * natively provided by FollowTheMoney.
     *
     * @param response The raw JSON mapped response from the Yente API
     * @return A consolidated summary describing the risk level and matching
     *         identifiers
     */
    private List<AmlAnalysisResult> parseResponse(YenteMatchResponse response) {
        List<AmlAnalysisResult> amlAnalysisResults = new ArrayList<>();

        if (response == null || response.responses() == null || !response.responses().containsKey("query-1")) {
            return amlAnalysisResults;
        }

        YenteQueryResponse queryResp = response.responses().get("query-1");
        List<YenteMatchResult> matches = queryResp.results();

        if (matches == null || matches.isEmpty()) {
            return amlAnalysisResults;
        }

        // Focus load all math > aml.suspect.threshold=60
        // aml.block.threshold=80
        // aml.ignore.threshold=40

        for (YenteMatchResult match : matches) {

            AmlAnalysisResult amlAnalysisResult = new AmlAnalysisResult();
            amlAnalysisResult.setPep(false);
            amlAnalysisResult.setSanctioned(false);
            amlAnalysisResult.setFamilyMember(false);
            amlAnalysisResult.setMatchScore(match.score());
            amlAnalysisResult.setReferents(match.referents());

            if (match.score() >= suspectThreshold) {
                // extract the yent ID 
                amlAnalysisResult.setYenteId(match.id());
                                
                // Extract matched target name
                if (match.properties() != null && match.properties().containsKey("name")) {
                    List<String> names = match.properties().get("name");
                    if (names != null && !names.isEmpty()) {
                        amlAnalysisResult.setMatchName(names.get(0));
                    }
                }

                // Analyze topics (like 'sanction', 'role.pep', 'family')
                if (match.properties() != null && match.properties().containsKey("topics")) {
                    List<String> topics = match.properties().get("topics");
                    if (topics != null) {
                        for (String topic : topics) {
                            if (topic.toLowerCase().contains("sanction")) {
                                amlAnalysisResult.setSanctioned(true);
                            }
                            if (topic.toLowerCase().contains("pep")) {
                                amlAnalysisResult.setPep(true);
                            }
                            if (topic.toLowerCase().contains("family") || topic.toLowerCase().contains("rel")) {
                                amlAnalysisResult.setFamilyMember(true);
                            }
                            if (topic.toLowerCase().contains("rca")) {
                                amlAnalysisResult.setRca(true);
                            }
                            if (topic.toLowerCase().contains("poi")) {
                                amlAnalysisResult.setPoi(true);
                            }
                            if (topic.toLowerCase().contains("debarment")) {
                                amlAnalysisResult.setDebarment(true);
                            }
                            if (topic.toLowerCase().contains("false")) {
                                amlAnalysisResult.setFalsePositive(true);
                            }
                        }
                    }
                }

                amlAnalysisResult.setReferents(match.referents());

                // Analyze datasets origins
                if (match.datasets() != null) {
                    for (String dataset : match.datasets()) {
                        if (dataset.toLowerCase().contains("sanction")) {
                            amlAnalysisResult.setSanctioned(true);
                        }
                        if (dataset.toLowerCase().contains("pep")) {
                            amlAnalysisResult.setPep(true);
                        }
                    }
                }

                if (amlAnalysisResult.isSanctioned()) {
                    amlAnalysisResult.setSanctionReason("Matched against sanctions dataset or flagged topic");
                    amlAnalysisResult.setStatus("BLOCKED");
                } else if (amlAnalysisResult.isPep() || amlAnalysisResult.isFamilyMember()) {
                    amlAnalysisResult.setSanctionReason("Flagged as PEP or related family member");
                    amlAnalysisResult.setStatus("SUSPECT");
                }

                amlAnalysisResults.add(amlAnalysisResult);
            }

        }
        return amlAnalysisResults;

    }
}

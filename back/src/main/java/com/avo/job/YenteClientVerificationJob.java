package com.avo.job;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.dtos.ScreeningMatchDTO;
import com.avo.dtos.UBODTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.ScreeningExecutionStatus;
import com.avo.mappers.ClientEntityMapper;
import com.avo.repositories.ClientRepository;
import com.avo.services.ClientService;
import com.avo.services.ScreeningMatchService;
import com.avo.services.UBOService;
import com.avo.yente.service.ScreeningExecutionService;
import com.avo.yente.service.YenteAmlService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Background job to periodically verify clients and Ultimate Beneficial Owners (UBOs)
 * against international sanction lists via the Yente API.
 */
@Component
public class YenteClientVerificationJob {

    // --- Configuration Thresholds ---
    @Value("${aml.match.batch.size}")
    private int batchSize;
    
    @Value("${aml.suspect.threshold}")
    private double suspectThreshold;
    
    @Value("${aml.block.threshold}")
    private double blockThreshold;

    // --- Required Mappers, Services and Repositories ---
    private final ObjectMapper objectMapper;
    private final YenteAmlService yenteAmlService;
    private final ClientEntityMapper clientEntityMapper;
    private final ClientService clientService;
    private final ScreeningMatchService screeningMatchService;
    private final ScreeningExecutionService screeningExecutionService;
    private final ClientRepository clientRepository;
    private final UBOService uboService;
    private final com.avo.repositories.ScreeningMatchRepository screeningMatchRepository;
    private final com.avo.repositories.NotificationRepository notificationRepository;
    private final com.avo.mappers.ScreeningExecutionMapper screeningExecutionMapper;

    public YenteClientVerificationJob(YenteAmlService yenteAmlService, ClientService clientService,
            ScreeningMatchService screeningMatchService,
            com.avo.yente.service.ScreeningExecutionService screeningExecutionService,
            com.avo.repositories.ClientRepository clientRepository,
            UBOService uboService, ClientEntityMapper clientEntityMapper, ObjectMapper objectMapper,
            com.avo.repositories.ScreeningMatchRepository screeningMatchRepository,
            com.avo.repositories.NotificationRepository notificationRepository,
            com.avo.mappers.ScreeningExecutionMapper screeningExecutionMapper) {
        this.yenteAmlService = yenteAmlService;
        this.clientService = clientService;
        this.screeningMatchService = screeningMatchService;
        this.screeningExecutionService = screeningExecutionService;
        this.clientRepository = clientRepository;
        this.uboService = uboService;
        this.clientEntityMapper = clientEntityMapper;
        this.objectMapper = objectMapper;
        this.screeningMatchRepository = screeningMatchRepository;
        this.notificationRepository = notificationRepository;
        this.screeningExecutionMapper = screeningExecutionMapper;
    }

    /**
     * Scheduled task to execute AML compliance checks for all registered Clients.
     * Runs every 10 minutes (600,000 milliseconds) and processes clients in batches/pages.
     */
    // @Scheduled(fixedRate = 600000)
    @Transactional
    public void executeMatchClient() {
        System.out.println("executeMatchClient executed at " + LocalDateTime.now());
        int pageNumber = 0;
        Slice<ClientEntity> slice;
        
        // Paginate through all client entities in the database
        do {
            Pageable pageable = PageRequest.of(pageNumber, batchSize);
            slice = clientRepository.findAll(pageable);
            processAMLForClient(slice.getContent());
            pageNumber++;
        } while (slice.hasNext());
    }

    /**
     * Performs verification against Yente API for a batch of client entities.
     *
     * @param clientList List of client entities to verify
     */
    public void processAMLForClient(List<ClientEntity> clientList) {

        clientList.stream().forEach(client -> {

            JsonNode jsonNodeResult = null;
            
            // 1. Initialize audit log entry for this screening execution
            ScreeningExecutionDTO screeningExecutionDTO = new ScreeningExecutionDTO();
            screeningExecutionDTO.setClientEntityDTO(clientEntityMapper.toDto(client));
            screeningExecutionDTO.setCreatedAt(LocalDateTime.now());

            try {
                // 2. Call the Yente AML microservice API to check client status
                String matchResultAsString = this.yenteAmlService.checkClientStatusAsString(client);
                jsonNodeResult = objectMapper.readTree(matchResultAsString);
                screeningExecutionDTO.setRawResponse(jsonNodeResult);

                // 3. Extract the list of sanction matches from Yente's JSON response
                JsonNode result = null;
                if (jsonNodeResult != null && jsonNodeResult.has("responses")) {
                    JsonNode responsesNode = jsonNodeResult.get("responses");
                    if (responsesNode.has("query-1")) {
                        result = responsesNode.get("query-1").get("results");
                    }
                }

                // Set of Yente IDs found in the current check run to track active alerts
                java.util.Set<String> currentYenteIds = new java.util.HashSet<>();
                boolean hasMatchAboveThreshold = false;

                // 4. Process screening results if any hits are returned
                if (result != null && result.isArray() && result.size() > 0) {
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "Client checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    ScreeningExecutionDTO savedExecutionDTO = screeningExecutionService.create(screeningExecutionDTO);

                    // Iterate over each match details returned by Yente
                    for (JsonNode resNode : result) {
                        double matchScore = resNode.get("score").asDouble();
                        String yenteId = resNode.has("id") ? resNode.get("id").asText() : null;
                        String yenteUpdate = resNode.has("last_change") ? resNode.get("last_change").asText() : null;

                        if (yenteId != null)
                            currentYenteIds.add(yenteId);

                        // 5. If the match score meets the AML warning threshold
                        if (matchScore >= suspectThreshold && yenteId != null) {
                            hasMatchAboveThreshold = true;
                            
                            // Check if this particular match was already identified previously
                            java.util.Optional<com.avo.entities.ScreeningMatch> lastMatchOpt = screeningMatchRepository
                                    .findFirstByClientIdAndYenteIdOrderByCreatedAtDesc(client.getId(), yenteId);

                            boolean needsNewMatch = false;
                            com.avo.entities.ScreeningMatchStatus newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                            if (lastMatchOpt.isPresent()) {
                                com.avo.entities.ScreeningMatch lastMatch = lastMatchOpt.get();
                                // If the sanction record has been updated at the source, prompt for re-evaluation
                                if (yenteUpdate != null && !yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
                                    needsNewMatch = true;
                                    newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                                    // Resolve representative client name for notifications
                                    String clientName = client.getId().toString();
                                    if (client instanceof com.avo.entities.ClientPersonnePhysique) {
                                        clientName = ((com.avo.entities.ClientPersonnePhysique) client).getNom();
                                    } else if (client instanceof com.avo.entities.ClientMoral) {
                                        clientName = ((com.avo.entities.ClientMoral) client).getNomCommercial();
                                    }

                                    // Save alert notification for the lawyers
                                    notificationRepository.save(new com.avo.entities.Notification(
                                            "Mise à jour Sanctions",
                                            "L'entité " + yenteId
                                                    + " a été mise à jour. Une re-évaluation est requise pour "
                                                    + clientName,
                                            client.getId()));
                                }
                            } else {
                                // Entirely new sanction hit identified
                                needsNewMatch = true;
                            }

                            // 6. Record or update the match details in our local database
                            if (needsNewMatch) {
                                // Put client status in manual validation state
                                client.setClientStatus(com.avo.entities.ClientStatus.VERIFICATION_AML_REQUIRED);
                                
                                ScreeningMatchDTO screeningMatchDTO = new ScreeningMatchDTO();
                                screeningMatchDTO.setClientEntityDTO(clientEntityMapper.toDto(client));
                                screeningMatchDTO.setRawResponse(jsonNodeResult);
                                screeningMatchDTO.setScore(matchScore);
                                screeningMatchDTO.setYenteId(yenteId);
                                screeningMatchDTO.setYenteLastUpdate(yenteUpdate);
                                screeningMatchDTO.setStatus(newStatus.name());

                                // Extract list of topics/reasons (e.g. PEP, sanction, crime)
                                if (resNode.has("properties") && resNode.get("properties").has("topics")) {
                                    JsonNode topicsNode = resNode.get("properties").get("topics");
                                    java.util.List<String> topicsList = new java.util.ArrayList<>();
                                    for (JsonNode t : topicsNode)
                                        topicsList.add(t.asText());
                                    screeningMatchDTO.setMatchReason(String.join(", ", topicsList));
                                }

                                screeningMatchDTO.setCreatedAt(LocalDateTime.now());
                                screeningMatchDTO.setScreeningExecutionDTO(savedExecutionDTO);
                                screeningMatchService.create(screeningMatchDTO);
                            } else {
                                // Update existing match link to point to this latest execution audit run
                                lastMatchOpt.ifPresent(m -> {
                                    m.setScreeningExecution(screeningExecutionMapper.toEntity(savedExecutionDTO));
                                    screeningMatchRepository.save(m);
                                });
                            }
                        }
                    }
                } else {
                    // No sanction records returned at all
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "Client checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    screeningExecutionService.create(screeningExecutionDTO);
                }

                // 7. If no suspect matches were found above threshold, validate the client
                if (!hasMatchAboveThreshold) {
                    client.setClientStatus(com.avo.entities.ClientStatus.VALIDATED);
                }
                clientRepository.save(client);

                // 8. Create a high-priority warning notification if client review is required
                if (client.getClientStatus() == com.avo.entities.ClientStatus.VERIFICATION_AML_REQUIRED) {
                    String clientName = client.getId().toString();
                    if (client instanceof com.avo.entities.ClientPersonnePhysique) {
                        com.avo.entities.ClientPersonnePhysique p = (com.avo.entities.ClientPersonnePhysique) client;
                        clientName = p.getPrenom() + " " + p.getNom();
                    } else if (client instanceof com.avo.entities.ClientMoral) {
                        com.avo.entities.ClientMoral m = (com.avo.entities.ClientMoral) client;
                        clientName = m.getNomCommercial();
                    } else if (client instanceof com.avo.entities.Association) {
                        com.avo.entities.Association a = (com.avo.entities.Association) client;
                        clientName = a.getNom();
                    } else if (client instanceof com.avo.entities.Institution) {
                        com.avo.entities.Institution i = (com.avo.entities.Institution) client;
                        clientName = i.getNom();
                    }

                    notificationRepository.save(new com.avo.entities.Notification(
                            "Alerte AML : Revue Requise",
                            "Des correspondances suspectes ont été identifiées pour le client " + clientName
                                    + ". Une évaluation de conformité AML est requise.",
                            client.getId()));
                }
                

                // 9. CLEANUP: If a previously logged match is no longer flagged by the Yente API,
                // mark its status as NO_LONGER_SANCTIONED.
                java.util.List<com.avo.entities.ScreeningMatch> dbMatches = screeningMatchRepository
                        .findByClientId(client.getId());
                for (com.avo.entities.ScreeningMatch m : dbMatches) {
                    if (m.getStatus() != com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED
                            && !currentYenteIds.contains(m.getYenteId())) {
                        m.setStatus(com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED);
                        screeningMatchRepository.save(m);
                    }
                }
            } catch (Exception e) {
                // Log execution failure in database audit trail
                screeningExecutionDTO.setExecutionMessage("Error: " + e.getMessage());
                screeningExecutionDTO.setStatus(ScreeningExecutionStatus.FAILED);
                screeningExecutionService.create(screeningExecutionDTO);
                e.printStackTrace();
            }

        });
    }

    /**
     * Scheduled task to execute AML compliance checks for all Ultimate Beneficial Owners (UBOs).
     * Runs every 10 minutes (600,000 milliseconds) and processes UBOs in batches.
     */
    // @Scheduled(fixedRate = 600000)
    @Transactional
    public void executeMatchUbos() {
        System.out.println("executeMatchUbos executed at " + LocalDateTime.now());
        int pageNum = 0;
        Page<UBODTO> page;

        // Paginate through all Ultimate Beneficial Owners in the database
        do {
            Pageable pageable = PageRequest.of(pageNum, batchSize);
            page = uboService.findAll(pageable);
            processAMLForUbo(page.getContent());
            pageNum++;
        } while (page.hasNext());
    }

    /**
     * Performs verification against Yente API for a batch of Ultimate Beneficial Owners (UBOs).
     *
     * @param uboList List of UBO DTOs to verify
     */
    public void processAMLForUbo(List<UBODTO> uboList) {
        uboList.stream().forEach(ubo -> {
            JsonNode jsonNodeResult = null;
            
            // 1. Initialize audit log entry for this UBO screening execution
            ScreeningExecutionDTO screeningExecutionDTO = new ScreeningExecutionDTO();
            screeningExecutionDTO.setUboDTO(ubo);
            if (ubo.getClientMoralId() != null) {
                clientRepository.findById(ubo.getClientMoralId()).ifPresent(client -> {
                    screeningExecutionDTO.setClientEntityDTO(clientEntityMapper.toDto(client));
                });
            }
            screeningExecutionDTO.setCreatedAt(LocalDateTime.now());

            try {
                // 2. Call the Yente AML API to verify person status by full name and nationality
                String matchResultAsString = this.yenteAmlService.matchPersonAsString(ubo.getFullName(), "",
                        ubo.getNationality());
                jsonNodeResult = objectMapper.readTree(matchResultAsString);
                screeningExecutionDTO.setRawResponse(jsonNodeResult);

                // 3. Extract the list of sanction matches from Yente's JSON response
                JsonNode result = null;
                if (jsonNodeResult != null && jsonNodeResult.has("responses")) {
                    JsonNode responsesNode = jsonNodeResult.get("responses");
                    if (responsesNode.has("query-1")) {
                        result = responsesNode.get("query-1").get("results");
                    }
                }

                // Set of active Yente IDs matching this UBO
                java.util.Set<String> currentYenteIds = new java.util.HashSet<>();

                // 4. Process screening results if matches exist
                if (result != null && result.isArray() && result.size() > 0) {
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "UBO checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    ScreeningExecutionDTO savedExecutionDTO = screeningExecutionService.create(screeningExecutionDTO);

                    for (JsonNode resNode : result) {
                        double matchScore = resNode.get("score").asDouble();
                        String yenteId = resNode.has("id") ? resNode.get("id").asText() : null;
                        String yenteUpdate = resNode.has("last_change") ? resNode.get("last_change").asText() : null;

                        if (yenteId != null)
                            currentYenteIds.add(yenteId);

                        // 5. If the match score meets the AML suspect warning threshold
                        if (matchScore >= suspectThreshold && yenteId != null) {
                            
                            // Check if this UBO sanction match was already logged previously
                            java.util.Optional<com.avo.entities.ScreeningMatch> lastMatchOpt = screeningMatchRepository
                                    .findFirstByUboIdAndYenteIdOrderByCreatedAtDesc(ubo.getId(), yenteId);

                            boolean needsNewMatch = false;
                            com.avo.entities.ScreeningMatchStatus newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                            if (lastMatchOpt.isPresent()) {
                                com.avo.entities.ScreeningMatch lastMatch = lastMatchOpt.get();
                                // If the sanction record has been updated, prompt for re-evaluation
                                if (yenteUpdate != null && !yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
                                    needsNewMatch = true;
                                    newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                                    // Save alert notification for the lawyers
                                    notificationRepository.save(new com.avo.entities.Notification(
                                             "Mise à jour Sanctions (UBO)",
                                             "L'entité " + yenteId
                                                     + " a été mise à jour. Re-évaluation requise pour l'UBO "
                                                     + ubo.getFullName(),
                                             ubo.getClientMoralId()));
                                }
                            } else {
                                // Entirely new sanction hit for this UBO
                                needsNewMatch = true;
                            }

                            // 6. Record or update the match details in local database
                            if (needsNewMatch) {
                                ScreeningMatchDTO screeningMatchDTO = new ScreeningMatchDTO();
                                screeningMatchDTO.setUboDTO(ubo);
                                screeningMatchDTO.setRawResponse(jsonNodeResult);
                                screeningMatchDTO.setScore(matchScore);
                                screeningMatchDTO.setYenteId(yenteId);
                                screeningMatchDTO.setYenteLastUpdate(yenteUpdate);
                                screeningMatchDTO.setStatus(newStatus.name());

                                // Extract list of topics/reasons (e.g. PEP, sanction, crime)
                                if (resNode.has("properties") && resNode.get("properties").has("topics")) {
                                    JsonNode topicsNode = resNode.get("properties").get("topics");
                                    java.util.List<String> topicsList = new java.util.ArrayList<>();
                                    for (JsonNode t : topicsNode)
                                        topicsList.add(t.asText());
                                    screeningMatchDTO.setMatchReason(String.join(", ", topicsList));
                                }

                                screeningMatchDTO.setCreatedAt(LocalDateTime.now());
                                screeningMatchDTO.setScreeningExecutionDTO(savedExecutionDTO);
                                screeningMatchService.create(screeningMatchDTO);
                            } else {
                                // Update existing match link to point to this latest execution audit run
                                lastMatchOpt.ifPresent(m -> {
                                    m.setScreeningExecution(screeningExecutionMapper.toEntity(savedExecutionDTO));
                                    screeningMatchRepository.save(m);
                                });
                            }
                        }
                    }
                } else {
                    // No matches found for this UBO
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "UBO checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    screeningExecutionService.create(screeningExecutionDTO);
                }

                // 7. CLEANUP: If a previously logged match is no longer flagged by the Yente API,
                // mark its status as NO_LONGER_SANCTIONED.
                java.util.List<com.avo.entities.ScreeningMatch> dbMatches = screeningMatchRepository
                        .findByUboId(ubo.getId());
                for (com.avo.entities.ScreeningMatch m : dbMatches) {
                    if (m.getStatus() != com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED
                            && !currentYenteIds.contains(m.getYenteId())) {
                        m.setStatus(com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED);
                        screeningMatchRepository.save(m);
                    }
                }
            } catch (Exception e) {
                // Log execution failure in database audit trail
                screeningExecutionDTO.setExecutionMessage("Error: " + e.getMessage());
                screeningExecutionDTO.setStatus(ScreeningExecutionStatus.FAILED);
                screeningExecutionService.create(screeningExecutionDTO);
                e.printStackTrace();
            }
        });
    }

}

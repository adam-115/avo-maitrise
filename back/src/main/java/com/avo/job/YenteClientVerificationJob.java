package com.avo.job;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.dtos.UBODTO;
import com.avo.dtos.ScreeningMatchDTO;
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

@Component
public class YenteClientVerificationJob {

    @Value("${aml.match.batch.size}")
    private int batchSize;
    @Value("${aml.suspect.threshold}")
    private double suspectThreshold;
    @Value("${aml.block.threshold}")
    private double blockThreshold;

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

    public YenteClientVerificationJob(YenteAmlService yenteAmlService, ClientService clientService,
            ScreeningMatchService screeningMatchService,
            com.avo.yente.service.ScreeningExecutionService screeningExecutionService,
            com.avo.repositories.ClientRepository clientRepository,
            UBOService uboService, ClientEntityMapper clientEntityMapper, ObjectMapper objectMapper,
            com.avo.repositories.ScreeningMatchRepository screeningMatchRepository,
            com.avo.repositories.NotificationRepository notificationRepository) {
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
    }

    // @Scheduled(fixedDelay = 100000)  
    @Transactional
    public void executeMatchClient() {
        System.out.println("executeMatchClient executed at " + LocalDateTime.now());
        int pageNumber = 0;
        Slice<ClientEntity> slice;
        do {
            Pageable pageable = PageRequest.of(pageNumber, batchSize);
            slice = clientRepository.findAll(pageable);
            processAMLForClient(slice.getContent());
            pageNumber++;
        } while (slice.hasNext());
    }

    public void processAMLForClient(List<ClientEntity> clientList) {

        clientList.stream().forEach(client -> {

            JsonNode jsonNodeResult = null;
            ScreeningExecutionDTO screeningExecutionDTO = new ScreeningExecutionDTO();
            screeningExecutionDTO.setClientEntityDTO(clientEntityMapper.toDto(client));
            screeningExecutionDTO.setCreatedAt(LocalDateTime.now());

            try {

                String matchResultAsString = this.yenteAmlService.checkClientStatusAsString(client);
                jsonNodeResult = objectMapper.readTree(matchResultAsString);
                screeningExecutionDTO.setRawResponse(jsonNodeResult);
                
                JsonNode result = null;
                if (jsonNodeResult != null && jsonNodeResult.has("responses")) {
                    JsonNode responsesNode = jsonNodeResult.get("responses");
                    if (responsesNode.has("query-1")) {
                        result = responsesNode.get("query-1").get("results");
                    }
                }

                java.util.Set<String> currentYenteIds = new java.util.HashSet<>();
                
                if (result != null && result.isArray() && result.size() > 0) {
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "Client checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    ScreeningExecutionDTO savedExecutionDTO = screeningExecutionService.create(screeningExecutionDTO);

                    for (JsonNode resNode : result) {
                        double matchScore = resNode.get("score").asDouble();
                        String yenteId = resNode.has("id") ? resNode.get("id").asText() : null;
                        String yenteUpdate = resNode.has("last_change") ? resNode.get("last_change").asText() : null;
                        
                        if (yenteId != null) currentYenteIds.add(yenteId);

                        if (matchScore >= suspectThreshold && yenteId != null) {
                            // Check for existing match in DB
                            java.util.Optional<com.avo.entities.ScreeningMatch> lastMatchOpt = 
                                screeningMatchRepository.findFirstByClientIdAndYenteIdOrderByCreatedAtDesc(client.getId(), yenteId);
                            
                            boolean needsNewMatch = false;
                            com.avo.entities.ScreeningMatchStatus newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                            if (lastMatchOpt.isPresent()) {
                                com.avo.entities.ScreeningMatch lastMatch = lastMatchOpt.get();
                                if (yenteUpdate != null && !yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
                                    // UPDATE DETECTED
                                    needsNewMatch = true;
                                    newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;
                                    
                                    // Notify lawyer of update
                                    String clientName = client.getId().toString();
                                    if (client instanceof com.avo.entities.ClientPersonnePhysique) {
                                        clientName = ((com.avo.entities.ClientPersonnePhysique) client).getNom();
                                    } else if (client instanceof com.avo.entities.ClientMoral) {
                                        clientName = ((com.avo.entities.ClientMoral) client).getNomCommercial();
                                    }

                                    notificationRepository.save(new com.avo.entities.Notification(
                                        "Mise à jour Sanctions",
                                        "L'entité " + yenteId + " a été mise à jour. Une re-évaluation est requise pour " + clientName,
                                        client.getId()
                                    ));
                                }
                            } else {
                                // NEW HIT
                                needsNewMatch = true;
                            }

                            if (needsNewMatch) {
                                ScreeningMatchDTO screeningMatchDTO = new ScreeningMatchDTO();
                                screeningMatchDTO.setClientEntityDTO(clientEntityMapper.toDto(client));
                                screeningMatchDTO.setRawResponse(jsonNodeResult);
                                screeningMatchDTO.setScore(matchScore);
                                screeningMatchDTO.setYenteId(yenteId);
                                screeningMatchDTO.setYenteLastUpdate(yenteUpdate);
                                screeningMatchDTO.setStatus(newStatus.name());
                                
                                // Extract Reason
                                if (resNode.has("properties") && resNode.get("properties").has("topics")) {
                                    JsonNode topicsNode = resNode.get("properties").get("topics");
                                    java.util.List<String> topicsList = new java.util.ArrayList<>();
                                    for (JsonNode t : topicsNode) topicsList.add(t.asText());
                                    screeningMatchDTO.setMatchReason(String.join(", ", topicsList));
                                }
                                
                                screeningMatchDTO.setCreatedAt(LocalDateTime.now());
                                screeningMatchDTO.setScreeningExecutionDTO(savedExecutionDTO);
                                screeningMatchService.create(screeningMatchDTO);
                            }
                        }
                    }
                } else {
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "Client checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    screeningExecutionService.create(screeningExecutionDTO);
                }

                // CLEANUP: Mark missing matches as NO_LONGER_SANCTIONED
                java.util.List<com.avo.entities.ScreeningMatch> dbMatches = screeningMatchRepository.findByClientId(client.getId());
                for (com.avo.entities.ScreeningMatch m : dbMatches) {
                    if (m.getStatus() != com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED && !currentYenteIds.contains(m.getYenteId())) {
                        m.setStatus(com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED);
                        screeningMatchRepository.save(m);
                    }
                }
            } catch (Exception e) {
                screeningExecutionDTO.setExecutionMessage("Error: " + e.getMessage());
                screeningExecutionDTO.setStatus(ScreeningExecutionStatus.FAILED);
                screeningExecutionService.create(screeningExecutionDTO);
                e.printStackTrace();
            }

        });
    }

    @Transactional
    public void executeMatchUbos() {
        System.out.println("executeMatchUbos executed at " + LocalDateTime.now());
        int pageNum = 0;
        Page<UBODTO> page;

        do {
            Pageable pageable = PageRequest.of(pageNum, batchSize);
            page = uboService.findAll(pageable);
            processAMLForUbo(page.getContent());
            pageNum++;
        } while (page.hasNext());
    }

    public void processAMLForUbo(List<UBODTO> uboList) {
        uboList.stream().forEach(ubo -> {
            JsonNode jsonNodeResult = null;
            ScreeningExecutionDTO screeningExecutionDTO = new ScreeningExecutionDTO();
            screeningExecutionDTO.setUboDTO(ubo);
            screeningExecutionDTO.setCreatedAt(LocalDateTime.now());

            try {
                String matchResultAsString = this.yenteAmlService.matchPersonAsString(ubo.getFullName(), "", ubo.getNationality());
                jsonNodeResult = objectMapper.readTree(matchResultAsString);
                screeningExecutionDTO.setRawResponse(jsonNodeResult);

                JsonNode result = null;
                if (jsonNodeResult != null && jsonNodeResult.has("responses")) {
                    JsonNode responsesNode = jsonNodeResult.get("responses");
                    if (responsesNode.has("query-1")) {
                        result = responsesNode.get("query-1").get("results");
                    }
                }

                java.util.Set<String> currentYenteIds = new java.util.HashSet<>();

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

                        if (yenteId != null) currentYenteIds.add(yenteId);

                        if (matchScore >= suspectThreshold && yenteId != null) {
                            // Check for existing match in DB
                            java.util.Optional<com.avo.entities.ScreeningMatch> lastMatchOpt = 
                                screeningMatchRepository.findFirstByUboIdAndYenteIdOrderByCreatedAtDesc(ubo.getId(), yenteId);

                            boolean needsNewMatch = false;
                            com.avo.entities.ScreeningMatchStatus newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;

                            if (lastMatchOpt.isPresent()) {
                                com.avo.entities.ScreeningMatch lastMatch = lastMatchOpt.get();
                                if (yenteUpdate != null && !yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
                                    needsNewMatch = true;
                                    newStatus = com.avo.entities.ScreeningMatchStatus.PENDING;
                                    
                                    // Notification
                                    notificationRepository.save(new com.avo.entities.Notification(
                                        "Mise à jour Sanctions (UBO)",
                                        "L'entité " + yenteId + " a été mise à jour. Re-évaluation requise pour l'UBO " + ubo.getFullName(),
                                        ubo.getClientMoralId()
                                    ));
                                }
                            } else {
                                needsNewMatch = true;
                            }

                            if (needsNewMatch) {
                                ScreeningMatchDTO screeningMatchDTO = new ScreeningMatchDTO();
                                screeningMatchDTO.setUboDTO(ubo);
                                screeningMatchDTO.setRawResponse(jsonNodeResult);
                                screeningMatchDTO.setScore(matchScore);
                                screeningMatchDTO.setYenteId(yenteId);
                                screeningMatchDTO.setYenteLastUpdate(yenteUpdate);
                                screeningMatchDTO.setStatus(newStatus.name());

                                if (resNode.has("properties") && resNode.get("properties").has("topics")) {
                                    JsonNode topicsNode = resNode.get("properties").get("topics");
                                    java.util.List<String> topicsList = new java.util.ArrayList<>();
                                    for (JsonNode t : topicsNode) topicsList.add(t.asText());
                                    screeningMatchDTO.setMatchReason(String.join(", ", topicsList));
                                }

                                screeningMatchDTO.setCreatedAt(LocalDateTime.now());
                                screeningMatchDTO.setScreeningExecutionDTO(savedExecutionDTO);
                                screeningMatchService.create(screeningMatchDTO);
                            }
                        }
                    }
                } else {
                    screeningExecutionDTO.setStatus(ScreeningExecutionStatus.PASSED);
                    screeningExecutionDTO.setExecutionMessage(
                            "UBO checked at:" + LocalDateTime.now().toString() + " Status: "
                                    + screeningExecutionDTO.getStatus());
                    screeningExecutionService.create(screeningExecutionDTO);
                }

                // CLEANUP
                java.util.List<com.avo.entities.ScreeningMatch> dbMatches = screeningMatchRepository.findByUboId(ubo.getId());
                for (com.avo.entities.ScreeningMatch m : dbMatches) {
                    if (m.getStatus() != com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED && !currentYenteIds.contains(m.getYenteId())) {
                        m.setStatus(com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED);
                        screeningMatchRepository.save(m);
                    }
                }
            } catch (Exception e) {
                screeningExecutionDTO.setExecutionMessage("Error: " + e.getMessage());
                screeningExecutionDTO.setStatus(ScreeningExecutionStatus.FAILED);
                screeningExecutionService.create(screeningExecutionDTO);
                e.printStackTrace();
            }
        });
    }

}

package com.avo.yente.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.avo.repositories.ClientRepository;
import com.avo.yente.client.YenteApiClient;
import com.avo.yente.models.AmlAnalysisResult;
import com.avo.yente.models.YenteMatchRequest;
import com.avo.yente.models.YenteMatchResponse;
import com.avo.yente.models.YenteMatchResult;
import com.avo.yente.models.YenteQueryResponse;

@ExtendWith(MockitoExtension.class)
class YenteAmlServiceTest {

    @Mock
    private YenteApiClient yenteApiClient;

    @Mock
    private ClientRepository clientDao;

    @InjectMocks
    private YenteAmlService yenteAmlService;

    private com.avo.entities.PersonnePhysique dummyClient;

    @BeforeEach
    void setUp() {
        dummyClient = new com.avo.entities.PersonnePhysique();
        dummyClient.setId(1L);
        dummyClient.setPrenom("John");
        dummyClient.setNom("Doe");
        dummyClient.setNationalite("France");
    }

    @Test
    void testCheckClientStatus_NoMatches() {
        // Arrange
        YenteMatchResponse emptyResponse = new YenteMatchResponse(new HashMap<>());
        when(yenteApiClient.match(any(YenteMatchRequest.class))).thenReturn(emptyResponse);

        // Act
        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertNotNull(results.get(0));
        assertEquals("OK", results.get(0).getStatus());
        assertFalse(results.get(0).isPep());
        assertFalse(results.get(0).isSanctioned());
    }

    @Test
    void testCheckClientStatus_WithSanctionMatch() {
        // Arrange
        Map<String, List<String>> properties = new HashMap<>();
        properties.put("name", List.of("John Doe"));
        properties.put("topics", List.of("sanction"));

        YenteMatchResult matchResult = new YenteMatchResult(
                "123", "Person", properties, List.of("us_ofac"), null, true,
                "2020", "2021", "2022", 0.95, true);

        YenteQueryResponse queryResponse = new YenteQueryResponse(null, List.of(matchResult));
        Map<String, YenteQueryResponse> responses = new HashMap<>();
        responses.put("query-1", queryResponse);

        YenteMatchResponse yenteResponse = new YenteMatchResponse(responses);
        when(yenteApiClient.match(any(YenteMatchRequest.class))).thenReturn(yenteResponse);

        // Act
        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertTrue(results.get(0).isSanctioned());
        assertFalse(results.get(0).isPep());
        assertEquals("BLOCKED", results.get(0).getStatus());
        assertEquals(0.95, results.get(0).getMatchScore());
        assertEquals("John Doe", results.get(0).getMatchName());
    }

    @Test
    void testCheckClientStatus_WithPepMatch() {
        // Arrange
        Map<String, List<String>> properties = new HashMap<>();
        properties.put("name", List.of("John Doe PEP"));
        properties.put("topics", List.of("role.pep"));

        YenteMatchResult matchResult = new YenteMatchResult(
                "124", "Person", properties, List.of("pep_dataset"), null, true,
                "2020", "2021", "2022", 0.88, true);

        YenteQueryResponse queryResponse = new YenteQueryResponse(null, List.of(matchResult));
        Map<String, YenteQueryResponse> responses = new HashMap<>();
        responses.put("query-1", queryResponse);

        YenteMatchResponse yenteResponse = new YenteMatchResponse(responses);
        when(yenteApiClient.match(any(YenteMatchRequest.class))).thenReturn(yenteResponse);

        // Act
        List<AmlAnalysisResult> result = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertTrue(result.get(0).isPep());
        assertFalse(result.get(0).isSanctioned());
        assertEquals("SUSPECT", result.get(0).getStatus());
        assertEquals(0.88, result.get(0).getMatchScore());
        assertEquals("John Doe PEP", result.get(0).getMatchName());
    }

    @Test
    void testCheckClientAndSave() {
        // Arrange
        when(clientDao.findById(dummyClient.getId())).thenReturn(Optional.of(dummyClient));

        Map<String, List<String>> properties = new HashMap<>();
        properties.put("name", List.of("John Doe"));
        properties.put("topics", List.of("sanction"));
        YenteMatchResult matchResult = new YenteMatchResult(
                "123", "Person", properties, List.of("us_ofac"), null, true,
                "2020", "2021", "2022", 0.95, true);
        YenteQueryResponse queryResponse = new YenteQueryResponse(null, List.of(matchResult));
        Map<String, YenteQueryResponse> responses = new HashMap<>();
        responses.put("query-1", queryResponse);
        YenteMatchResponse yenteResponse = new YenteMatchResponse(responses);

        when(yenteApiClient.match(any(YenteMatchRequest.class))).thenReturn(yenteResponse);

        // Act
        AmlAnalysisResult result = yenteAmlService.checkClientAndSave(dummyClient.getId());

        // Assert
        assertEquals("BLOCKED", result.getStatus());
        verify(clientDao, times(1)).save(dummyClient);
        assertEquals("BLOCKED", dummyClient.getAmlAnalysisStatus());
        assertEquals(0.95, dummyClient.getAmlMatchScore());
    }
}

package com.avo.yente.service;

import com.avo.entities.ClientEntity;
import com.avo.entities.ClientTypeEnum;
import com.avo.repositories.ClientRepository;
import com.avo.yente.client.YenteApiClient;
import com.avo.yente.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
        AmlAnalysisResult result = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertNotNull(result);
        assertEquals("OK", result.getStatus());
        assertFalse(result.isPep());
        assertFalse(result.isSanctioned());
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
        AmlAnalysisResult result = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertTrue(result.isSanctioned());
        assertFalse(result.isPep());
        assertEquals("BLOCKED", result.getStatus());
        assertEquals(0.95, result.getMatchScore());
        assertEquals("John Doe", result.getMatchName());
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
        AmlAnalysisResult result = yenteAmlService.checkClientStatus(dummyClient);

        // Assert
        assertTrue(result.isPep());
        assertFalse(result.isSanctioned());
        assertEquals("SUSPECT", result.getStatus());
        assertEquals(0.88, result.getMatchScore());
        assertEquals("John Doe PEP", result.getMatchName());
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

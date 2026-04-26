package com.avo.yente.client;

import com.avo.yente.models.YenteMatchRequest;
import com.avo.yente.models.YenteMatchResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class YenteApiClient {

    private final RestTemplate restTemplate;
    private final String yenteApiUrl;
    private final String yenteApiKey;
    private final String yenteDefaultDataset;
    private final String yenteDefaultMatchPath;

    public YenteApiClient(
            @Value("${yente.api.url}") String yenteApiUrl,
            @Value("${yente.api.key}") String yenteApiKey,
            @Value("${yente.api.default.dataset}") String yenteDefaultDataset,
            @Value("${yente.api.default.match.path}") String yenteDefaultMatchPath) {
        this.restTemplate = new RestTemplate();
        this.yenteApiUrl = yenteApiUrl;
        this.yenteApiKey = yenteApiKey;
        this.yenteDefaultDataset = yenteDefaultDataset;
        this.yenteDefaultMatchPath = yenteDefaultMatchPath;
    }

   

    public boolean checkHealth() {
        try {
            String url = yenteApiUrl + "/healthz";
            log.debug("Checking Yente API health at {}", url);
            org.springframework.http.ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            boolean isHealthy = response.getStatusCode().is2xxSuccessful();
            log.info("Yente API health check result: {}", isHealthy);
            return isHealthy;
        } catch (Exception e) {
            log.error("Yente API health check failed: {}", e.getMessage());
            return false;
        }
    }


     public YenteMatchResponse match(YenteMatchRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (yenteApiKey != null && !yenteApiKey.trim().isEmpty()) {
            // Include both common formats just to be safe if the middleware changed
            headers.set("Authorization", yenteApiKey);
            headers.set("X-API-Key", yenteApiKey);
        }

        HttpEntity<YenteMatchRequest> entity = new HttpEntity<>(request, headers);

        String url = yenteApiUrl + yenteDefaultMatchPath + yenteDefaultDataset;
        log.info("Sending match request to Yente API: {}", url);
        log.debug("Request payload: {}", request);
        YenteMatchResponse response = restTemplate.postForObject(url, entity, YenteMatchResponse.class);
        log.info("Received match response from Yente API");
        return response;
    }


    public String matchAsString(YenteMatchRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (yenteApiKey != null && !yenteApiKey.trim().isEmpty()) {
            // Include both common formats just to be safe if the middleware changed
            headers.set("Authorization", yenteApiKey);
            headers.set("X-API-Key", yenteApiKey);
        }
        HttpEntity<YenteMatchRequest> entity = new HttpEntity<>(request, headers);
        String url = yenteApiUrl + yenteDefaultMatchPath + yenteDefaultDataset;
        log.info("Sending match request to Yente API: {}", url);
        log.debug("Request payload: {}", request);
        String response = restTemplate.postForObject(url, entity, String.class);
        log.info("Received match response from Yente API : {}", response);
        return response;
    }


    

    


}

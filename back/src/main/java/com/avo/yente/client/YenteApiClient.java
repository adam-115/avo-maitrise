package com.avo.yente.client;

import com.avo.yente.models.YenteMatchRequest;
import com.avo.yente.models.YenteMatchResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

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
        return restTemplate.postForObject(url, entity, YenteMatchResponse.class);
    }

    public boolean checkHealth() {
        try {
            String url = yenteApiUrl + "/healthz";
            org.springframework.http.ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }


    

    


}

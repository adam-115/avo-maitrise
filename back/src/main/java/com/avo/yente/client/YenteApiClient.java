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

    public YenteApiClient(
            @Value("${yente.api.url}") String yenteApiUrl,
            @Value("${yente.api.key}") String yenteApiKey) {
        this.restTemplate = new RestTemplate();
        this.yenteApiUrl = yenteApiUrl;
        this.yenteApiKey = yenteApiKey;
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

        String url = yenteApiUrl + "/match/default";
        return restTemplate.postForObject(url, entity, YenteMatchResponse.class);
    }
}

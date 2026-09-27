package com.avo.dtos;

import lombok.Data;

@Data
public class AiConfigurationDTO {
    private Long id;
    private String provider;
    private String modelName;
    private String apiKey;
    private String baseUrl;
    private Double temperature;
    private Integer timeoutMinutes;
    private Boolean isActive;
}

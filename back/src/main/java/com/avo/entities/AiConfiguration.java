package com.avo.entities;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "ai_configuration")
public class AiConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider", nullable = false)
    private String provider; // "OLLAMA", "OPENAI", "GEMINI", "CLAUDE"

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "base_url")
    private String baseUrl;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "timeout_minutes")
    private Integer timeoutMinutes;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    public AiConfiguration() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Integer getTimeoutMinutes() { return timeoutMinutes; }
    public void setTimeoutMinutes(Integer timeoutMinutes) { this.timeoutMinutes = timeoutMinutes; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}

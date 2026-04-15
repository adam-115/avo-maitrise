package com.avo.yente.models;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

public record YenteMatchResult(
    String id,
    String schema,
    Map<String, List<String>> properties,
    List<String> datasets,
    List<String> referents,
    Boolean target,
    @JsonProperty("first_seen") String firstSeen,
    @JsonProperty("last_seen") String lastSeen,
    @JsonProperty("last_change") String lastChange,
    
    // specific to match result
    Double score,
    Boolean match
) {}

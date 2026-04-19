package com.avo.yente.models;

import java.util.Map;

public record YenteMatchRequest(
    /** A map containing multiple match queries, where the string key is an arbitrary query identifier (e.g., 'query-1'). */
    Map<String, YenteMatchQuery> queries
) {}

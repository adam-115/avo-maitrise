package com.avo.yente.models;

import java.util.Map;

public record YenteMatchResponse(
    /** A map of query responses, where the string key corresponds to the query identifier provided in the matching request. */
    Map<String, YenteQueryResponse> responses
) {}

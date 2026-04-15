package com.avo.yente.models;

import java.util.Map;

public record YenteMatchResponse(
    Map<String, YenteQueryResponse> responses
) {}

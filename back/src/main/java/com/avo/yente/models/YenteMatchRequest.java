package com.avo.yente.models;

import java.util.Map;

public record YenteMatchRequest(
    Map<String, YenteMatchQuery> queries
) {}

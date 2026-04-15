package com.avo.yente.models;

import java.util.List;
import java.util.Map;

public record YenteMatchQuery(
    String schema,
    Map<String, List<String>> properties
) {}

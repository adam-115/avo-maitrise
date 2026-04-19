package com.avo.yente.models;

import java.util.List;
import java.util.Map;

public record YenteMatchQuery(
    /** The schema of the entity to match against (e.g., 'Person', 'Company', 'Organization'). */
    String schema,

    /** The properties of the entity to match against (e.g., 'name', 'country', 'birthDate'). */
    Map<String, List<String>> properties
) {}

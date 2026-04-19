package com.avo.yente.models;

import java.util.List;

public record YenteQueryResponse(
    /** The original query object that was submitted to the Yente service. */
    YenteMatchQuery query,

    /** The list of matched results returned by Yente, typically ordered by match score. */
    List<YenteMatchResult> results
) {}

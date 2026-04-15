package com.avo.yente.models;

import java.util.List;

public record YenteQueryResponse(
    YenteMatchQuery query,
    List<YenteMatchResult> results
) {}

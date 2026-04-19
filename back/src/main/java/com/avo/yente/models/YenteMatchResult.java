package com.avo.yente.models;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

public record YenteMatchResult(
    /** The unique identifier of the matched entity within the FollowTheMoney or OpenSanctions system. */
    String id,

    /** The FollowTheMoney semantic schema representing the matched entity type (e.g., 'Person', 'Company'). */
    String schema,

    /** A dictionary of properties associated with the matched entity including names, topics, aliases, and locations. */
    Map<String, List<String>> properties,

    /** The list of datasets in which the matched entity is present (e.g., 'us_ofac', 'eu_fsf'). */
    List<String> datasets,

    /** An array of arbitrary strings that provide cross-references to other systems or internal IDs. */
    List<String> referents,

    /** Indicates whether the entity is marked as an active target of sanctions or monitoring. */
    Boolean target,

    /** A timestamp indicating when the entity was first processed or seen by the data aggregator. */
    @JsonProperty("first_seen") String firstSeen,

    /** A timestamp indicating when the entity was most recently seen or verified in an update. */
    @JsonProperty("last_seen") String lastSeen,

    /** A timestamp indicating the last time the entity's properties were meaningfully altered. */
    @JsonProperty("last_change") String lastChange,
    
    /** The confidence score indicating how closely the queried entity matches this result. */
    Double score,

    /** A boolean indicator suggesting if Yente strongly believes this is a positive match based on threshold. */
    Boolean match
) {}

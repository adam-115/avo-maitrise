package com.avo.entities;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter

@Entity
@Table(name = "screening_matches")
public class ScreeningMatch {

    /**
     * The unique identifier for the screening match record.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The client associated with this screening match.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    /**
     * The unique identifier of the matched entity from the external Yente/OpenSanctions API.
     */
    private String yenteId;

    /**
     * The matching score representing the similarity or probability of the match.
     */
    private Double score;

    /**
     * The name of the target entity that was matched.
     */
    private String targetName;

    /**
     * The raw JSON response received from the Yente API, stored for audit and detailed review purposes.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_response", columnDefinition = "json")
    private JsonNode rawResponse;

    /**
     * The timestamp indicating when this screening match was recorded in the system.
     */
    private LocalDateTime createdAt = LocalDateTime.now();

}

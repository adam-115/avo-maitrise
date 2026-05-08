package com.avo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "aml_allow_list")
public class AmlAllowList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "ubo_id")
    private Long uboId;

    @Column(name = "yente_id", nullable = false)
    private String yenteId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public AmlAllowList(Long clientId, Long uboId, String yenteId, String reason) {
        this.clientId = clientId;
        this.uboId = uboId;
        this.yenteId = yenteId;
        this.reason = reason;
    }
}

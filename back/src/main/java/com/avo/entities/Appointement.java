package com.avo.entities;

import jakarta.persistence.*;
import java.util.Date;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "appointements")
public class Appointement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "client_case")
    private String clientCase;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.MERGE)
    @JoinColumn(name = "client_id", nullable = true)
    @NotFound(action = NotFoundAction.IGNORE)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.MERGE)
    @JoinColumn(name = "dossier_id", nullable = true)
    @NotFound(action = NotFoundAction.IGNORE)
    private Dossier dossier;

    @Column(nullable = false)
    private String time; // "HH:mm"

    @Column(name = "end_time", nullable = false)
    private String endTime; // "HH:mm"

    private String location;

    @Column(nullable = false)
    private String status; // "Urgent", "Standard", "Reporté"

    @Temporal(TemporalType.DATE)
    @Column(nullable = false)
    private Date date;

    public Appointement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getClientCase() { return clientCase; }
    public void setClientCase(String clientCase) { this.clientCase = clientCase; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public Dossier getDossier() { return dossier; }
    public void setDossier(Dossier dossier) { this.dossier = dossier; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }
}

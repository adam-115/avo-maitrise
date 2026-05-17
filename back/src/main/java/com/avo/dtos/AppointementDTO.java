package com.avo.dtos;

import java.util.Date;

public class AppointementDTO {
    private Long id;
    private String title;
    private String clientCase;
    private Long clientId;
    private Long dossierId;
    private String time;
    private String endTime;
    private String location;
    private String status;
    private Date date;

    public AppointementDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getClientCase() { return clientCase; }
    public void setClientCase(String clientCase) { this.clientCase = clientCase; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getDossierId() { return dossierId; }
    public void setDossierId(Long dossierId) { this.dossierId = dossierId; }

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

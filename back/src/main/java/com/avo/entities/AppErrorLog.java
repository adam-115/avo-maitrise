package com.avo.entities;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "app_error_logs", indexes = {
    @Index(name = "idx_app_error_logs_error_id", columnList = "error_id"),
    @Index(name = "idx_app_error_logs_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@Builder
public class AppErrorLog {

    public AppErrorLog() {}

    public AppErrorLog(Long id, String errorId, LocalDateTime timestamp, String httpMethod, String requestUri,
                       Integer httpStatus, String exceptionClass, String message, String stackTrace,
                       String username, String clientIp, String userAgent, boolean resolved) {
        this.id = id;
        this.errorId = errorId;
        this.timestamp = timestamp;
        this.httpMethod = httpMethod;
        this.requestUri = requestUri;
        this.httpStatus = httpStatus;
        this.exceptionClass = exceptionClass;
        this.message = message;
        this.stackTrace = stackTrace;
        this.username = username;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
        this.resolved = resolved;
    }

    public static class AppErrorLogBuilder {
        public AppErrorLogBuilder() {}
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_id", nullable = false, length = 64)
    private String errorId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "request_uri", length = 500)
    private String requestUri;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "exception_class", length = 255)
    private String exceptionClass;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Lob
    @Column(name = "stack_trace", columnDefinition = "LONGTEXT")
    private String stackTrace;

    @Column(length = 100)
    private String username;

    @Column(name = "client_ip", length = 50)
    private String clientIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Builder.Default
    @Column(nullable = false)
    private boolean resolved = false;
}

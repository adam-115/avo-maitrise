package com.avo.services;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.avo.entities.AppErrorLog;
import com.avo.repositories.AppErrorLogRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ErrorLogService {

    private final AppErrorLogRepository repository;

    public ErrorLogService(AppErrorLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logError(String errorId, Throwable ex, String uri, String method, int status, String username, String ip, String userAgent) {
        try {
            StringWriter sw = new StringWriter();
            if (ex != null) {
                ex.printStackTrace(new PrintWriter(sw));
            }

            String exceptionClassName = (ex != null) ? ex.getClass().getName() : "UnknownException";
            String errorMessage = (ex != null && ex.getMessage() != null) ? ex.getMessage() : "No message provided";

            // Sanitize length if necessary
            if (uri != null && uri.length() > 500) {
                uri = uri.substring(0, 500);
            }
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }

            AppErrorLog errorLog = AppErrorLog.builder()
                    .errorId(errorId)
                    .timestamp(LocalDateTime.now())
                    .httpMethod(method)
                    .requestUri(uri)
                    .httpStatus(status)
                    .exceptionClass(exceptionClassName)
                    .message(errorMessage)
                    .stackTrace(sw.toString())
                    .username(username != null ? username : "Anonyme")
                    .clientIp(ip)
                    .userAgent(userAgent)
                    .resolved(false)
                    .build();

            repository.save(errorLog);
            log.info("💾 [ErrorLogService] Error {} saved to database successfully", errorId);
        } catch (Exception dbEx) {
            log.error("⚠️ [ErrorLogService] Failed to save error log {} to database: {}", errorId, dbEx.getMessage());
        }
    }
}

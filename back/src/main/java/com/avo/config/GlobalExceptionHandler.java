package com.avo.config;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.avo.dtos.ApiErrorResponse;
import com.avo.services.ErrorLogService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private final ErrorLogService errorLogService;

    public GlobalExceptionHandler(ErrorLogService errorLogService) {
        this.errorLogService = errorLogService;
    }

    // 1. Validation errors from @Valid on DTOs
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));

        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Certains champs du formulaire sont invalides ou manquants.")
                .path(extractPath(request))
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    // 2. Business / Illegal argument errors
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {

        log.warn("⚠️ IllegalArgumentException: {}", ex.getMessage());

        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage() != null ? ex.getMessage() : "Requête invalide.")
                .path(extractPath(request))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // 3. Database / SQL Constraint violation (Duplicate keys, foreign keys) -> Sanitized message without SQL leak
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, WebRequest request) {

        String rawMsg = ex.getMessage();
        log.warn("⚠️ DataIntegrityViolationException caught: {}", rawMsg);

        String userFriendlyMessage = "Erreur de contrainte d'intégrité des données.";
        if (rawMsg != null && rawMsg.contains("Duplicate entry")) {
            userFriendlyMessage = "Cette référence ou valeur unique existe déjà dans la base de données.";
        }

        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Data Integrity Conflict")
                .message(userFriendlyMessage)
                .path(extractPath(request))
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    // 4. Spring Security: Access Denied (403 Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {

        log.warn("⛔ AccessDeniedException: User '{}' attempted unauthorized access to {}", 
                getCurrentUsername(), extractPath(request));

        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("Forbidden")
                .message("Vous ne disposez pas des permissions nécessaires pour exécuter cette opération.")
                .path(extractPath(request))
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // 5. Client Aborted / Connection Reset (User refreshed page, closed tab, or navigated away)
    @ExceptionHandler(value = {
        org.apache.catalina.connector.ClientAbortException.class,
        org.springframework.web.context.request.async.AsyncRequestNotUsableException.class
    })
    public void handleClientAbort(Exception ex) {
        log.debug("Le client a interrompu la connexion HTTP (rafraîchissement ou navigation rapide) : {}", ex.getMessage());
    }

    // 6. Uncaught 500 Exceptions -> Log to Database & SLF4J, return clean sanitized JSON with ErrorId
    @ExceptionHandler(value = { Throwable.class })
    public ResponseEntity<ApiErrorResponse> handleAllUncaughtExceptions(
            Throwable ex, WebRequest request) {

        String errorId = "ERR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String path = extractPath(request);
        String method = extractMethod(request);
        String username = getCurrentUsername();
        String clientIp = extractClientIp(request);
        String userAgent = extractUserAgent(request);

        // Save detailed error context in Database (in a dedicated new transaction)
        errorLogService.logError(errorId, ex, path, method, HttpStatus.INTERNAL_SERVER_ERROR.value(), username, clientIp, userAgent);

        // Server-side internal log
        log.error("❌ [{}] Internal Server Error on {} {} (User: '{}', IP: {})", 
                errorId, method, path, username, clientIp, ex);

        // Clean client response WITHOUT leaking stack trace or SQL schema
        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Une erreur interne inattendue s'est produite. Référence support : " + errorId)
                .path(path)
                .errorId(errorId)
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private String extractPath(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            HttpServletRequest req = ((ServletWebRequest) request).getRequest();
            return req.getRequestURI();
        }
        return "";
    }

    private String extractMethod(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            HttpServletRequest req = ((ServletWebRequest) request).getRequest();
            return req.getMethod();
        }
        return "UNKNOWN";
    }

    private String extractClientIp(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            HttpServletRequest req = ((ServletWebRequest) request).getRequest();
            String xForwardedFor = req.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return req.getRemoteAddr();
        }
        return "";
    }

    private String extractUserAgent(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            HttpServletRequest req = ((ServletWebRequest) request).getRequest();
            return req.getHeader("User-Agent");
        }
        return "";
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception e) {
            // ignore
        }
        return "Anonyme";
    }
}

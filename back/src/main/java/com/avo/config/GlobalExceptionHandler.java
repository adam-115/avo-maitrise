package com.avo.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            org.springframework.http.HttpHeaders headers, org.springframework.http.HttpStatusCode status,
            WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("⚠️ IllegalArgumentException: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("⚠️ DataIntegrityViolationException: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        String msg = ex.getMessage();
        if (msg != null && msg.contains("Duplicate entry")) {
            error.put("message", "Cette référence ou valeur unique existe déjà dans la base de données.");
        } else {
            error.put("message", "Erreur de contrainte d'intégrité des données.");
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(value = { Throwable.class })
    protected ResponseEntity<String> handleConflict(Throwable ex, WebRequest request) {
        log.error("❌ Exception caught by GlobalExceptionHandler!");
        if (request instanceof ServletWebRequest) {
            HttpServletRequest servletRequest = ((ServletWebRequest) request).getRequest();
            log.error("➡️ Request URL: {} {}", servletRequest.getMethod(), servletRequest.getRequestURL());
            log.error("➡️ Client IP: {}", servletRequest.getRemoteAddr());
        }
        log.error("➡️ Exception Message: {}", ex.getMessage());
        log.error("➡️ Stack Trace:", ex);

        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        ex.printStackTrace(pw);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(sw.toString());
    }

}

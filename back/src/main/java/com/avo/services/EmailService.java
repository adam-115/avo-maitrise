package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.from:adamlaftimi@gmail.com}")
    private String defaultFrom;

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendSimpleEmail(String to, String subject, String text) {
        log.info("[ENTER] Envoi d'un email à : {}, Sujet : {}", to, subject);
        if (to == null || to.isBlank()) {
            log.warn("Destinataire email vide, envoi ignoré.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(defaultFrom != null && !defaultFrom.isBlank() ? defaultFrom : "adamlaftimi@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            javaMailSender.send(message);
            log.info("Email envoyé avec succès à : {}", to);
        } catch (Exception e) {
            log.warn("L'envoi de l'email à {} via SMTP a échoué ({}). L'opération applicative continue sans interruption (Mode résilient).", to, e.getMessage());
            log.info("📧 [LOG SECOURS EMAIL] Pour : {}\nSujet : {}\nContenu :\n{}", to, subject, text);
        }
    }
}
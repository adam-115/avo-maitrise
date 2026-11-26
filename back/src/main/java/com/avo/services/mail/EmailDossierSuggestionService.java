package com.avo.services.mail;

import com.avo.dtos.mail.InboxEmailDTO;
import com.avo.entities.Dossier;
import com.avo.entities.DossierPartie;
import com.avo.repositories.DossierRepository;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Suggère automatiquement le dossier Avo-Maîtrise pertinent pour un e-mail entrant :
 * 1) Référence dossier présente dans l'objet ou l'extrait (ex. DOS-SOC-2026-MOREAU)
 * 2) Adresse e-mail correspondant au client principal du dossier
 * 3) Adresse e-mail correspondant à une autre partie (adversaire, intervenant) du dossier
 */
@Service
public class EmailDossierSuggestionService {

    private final DossierRepository dossierRepository;

    public EmailDossierSuggestionService(DossierRepository dossierRepository) {
        this.dossierRepository = dossierRepository;
    }

    public void enrichSuggestions(List<InboxEmailDTO> emails) {
        if (emails == null || emails.isEmpty()) return;

        List<Dossier> dossiers = dossierRepository.findAll();
        if (dossiers.isEmpty()) return;

        // Index par référence normalisée et par email client / partie
        Map<String, Dossier> byRef = new HashMap<>();
        Map<String, Dossier> byClientEmail = new HashMap<>();
        Map<String, Dossier> byPartieEmail = new HashMap<>();

        for (Dossier d : dossiers) {
            if (d.getReferenceInterne() != null && !d.getReferenceInterne().isBlank()) {
                byRef.put(d.getReferenceInterne().trim().toLowerCase(Locale.ROOT), d);
            }
            if (d.getClient() != null && d.getClient().getEmail() != null && !d.getClient().getEmail().isBlank()) {
                byClientEmail.putIfAbsent(d.getClient().getEmail().trim().toLowerCase(Locale.ROOT), d);
            }
            if (d.getAutresParties() != null) {
                for (DossierPartie dp : d.getAutresParties()) {
                    if (dp.getPartie() != null && dp.getPartie().getEmail() != null && !dp.getPartie().getEmail().isBlank()) {
                        byPartieEmail.putIfAbsent(dp.getPartie().getEmail().trim().toLowerCase(Locale.ROOT), d);
                    }
                }
            }
        }

        for (InboxEmailDTO email : emails) {
            matchSingle(email, byRef, byClientEmail, byPartieEmail);
        }
    }

    private void matchSingle(InboxEmailDTO email,
                             Map<String, Dossier> byRef,
                             Map<String, Dossier> byClientEmail,
                             Map<String, Dossier> byPartieEmail) {
        String haystack = ((email.getSubject() != null ? email.getSubject() : "") + " " +
                (email.getSnippet() != null ? email.getSnippet() : "")).toLowerCase(Locale.ROOT);

        // 1. Match par référence interne
        for (Map.Entry<String, Dossier> entry : byRef.entrySet()) {
            if (entry.getKey().length() >= 4 && haystack.contains(entry.getKey())) {
                applySuggestion(email, entry.getValue(), "Référence « " + entry.getValue().getReferenceInterne() + " » détectée");
                return;
            }
        }

        // 2. Match par email expéditeur ou destinataires
        Set<String> addresses = extractEmails(email.getFromEmail(), email.getToEmails(), email.getCcEmails());
        for (String addr : addresses) {
            Dossier clientMatch = byClientEmail.get(addr);
            if (clientMatch != null) {
                applySuggestion(email, clientMatch, "E-mail du client (" + addr + ")");
                return;
            }
        }
        for (String addr : addresses) {
            Dossier partieMatch = byPartieEmail.get(addr);
            if (partieMatch != null) {
                applySuggestion(email, partieMatch, "E-mail d'une partie au dossier (" + addr + ")");
                return;
            }
        }
    }

    private void applySuggestion(InboxEmailDTO email, Dossier dossier, String reason) {
        email.setSuggestedDossierId(dossier.getId());
        email.setSuggestedDossierReference(dossier.getReferenceInterne());
        email.setSuggestedDossierTitre(dossier.getTitre());
        email.setSuggestionReason(reason);
    }

    private Set<String> extractEmails(String... fields) {
        Set<String> result = new LinkedHashSet<>();
        for (String f : fields) {
            if (f == null || f.isBlank()) continue;
            for (String token : f.split("[,;\\s<>\"'()]+")) {
                if (token.contains("@") && token.indexOf('@') > 0 && token.indexOf('@') < token.length() - 1) {
                    result.add(token.trim().toLowerCase(Locale.ROOT));
                }
            }
        }
        return result;
    }
}

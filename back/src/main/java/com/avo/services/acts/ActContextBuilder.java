package com.avo.services.acts;

import com.avo.entities.*;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.DossierDeadlineRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Construit le dictionnaire complet des variables de fusion ({{client.*}}, {{adversaire.*}},
 * {{dossier.*}}, {{cabinet.*}}, {{pieces.*}}, {{delais.*}}, {{avocat.*}}) à partir des données
 * réelles d'un dossier en base.
 */
@Service
public class ActContextBuilder {

    private static final DateTimeFormatter FR_SHORT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FR_LONG = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);

    private final DossierRepository dossierRepository;
    private final CabinetProfileRepository cabinetProfileRepository;
    private final DossierDeadlineRepository deadlineRepository;
    private final UserRepository userRepository;

    public ActContextBuilder(DossierRepository dossierRepository,
                             CabinetProfileRepository cabinetProfileRepository,
                             DossierDeadlineRepository deadlineRepository,
                             UserRepository userRepository) {
        this.dossierRepository = dossierRepository;
        this.cabinetProfileRepository = cabinetProfileRepository;
        this.deadlineRepository = deadlineRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, String> buildVariables(Long dossierId) {
        Map<String, String> vars = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        vars.put("dateJour", today.format(FR_SHORT));
        vars.put("dateJourLongue", today.format(FR_LONG));

        // 1. Profil du Cabinet
        CabinetProfile cabinet = cabinetProfileRepository.findAll().stream().findFirst().orElse(null);
        vars.put("cabinet.nom", safe(cabinet != null ? cabinet.getName() : null, "Cabinet d'Avocats"));
        vars.put("cabinet.adresse", safe(cabinet != null ? cabinet.getAddress() : null, ""));
        vars.put("cabinet.codePostal", safe(cabinet != null ? cabinet.getPostalCode() : null, ""));
        vars.put("cabinet.ville", safe(cabinet != null ? cabinet.getCity() : null, "Paris"));
        vars.put("cabinet.pays", safe(cabinet != null ? cabinet.getCountry() : null, "France"));
        vars.put("cabinet.telephone", safe(cabinet != null ? cabinet.getPhone() : null, ""));
        vars.put("cabinet.email", safe(cabinet != null ? cabinet.getEmail() : null, ""));
        vars.put("cabinet.website", safe(cabinet != null ? cabinet.getWebsite() : null, ""));
        vars.put("cabinet.siret", safe(cabinet != null ? cabinet.getSiret() : null, ""));
        vars.put("cabinet.tva", safe(cabinet != null ? cabinet.getVatNumber() : null, ""));
        vars.put("cabinet.iban", safe(cabinet != null ? cabinet.getIban() : null, ""));
        vars.put("cabinet.bic", safe(cabinet != null ? cabinet.getBic() : null, ""));

        if (dossierId == null) {
            return vars;
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));

        // 2. Dossier
        vars.put("dossier.reference", safe(dossier.getReferenceInterne(), "#" + dossier.getId()));
        vars.put("dossier.titre", safe(dossier.getTitre(), ""));
        vars.put("dossier.description", safe(dossier.getDescription(), ""));
        vars.put("dossier.pays", safe(dossier.getPaysJuridiction(), "FRANCE"));
        vars.put("dossier.dateOuverture", dossier.getDateOuverture() != null
                ? dossier.getDateOuverture().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().format(FR_SHORT)
                : today.format(FR_SHORT));

        // 3. Avocat responsable
        String avocatNom = resolveLawyerName(dossier.getResponsableId());
        vars.put("avocat.nom", avocatNom);

        // 4. Client principal
        fillParty(vars, "client", dossier.getClient());

        // 5. Adversaire & Avocat adverse
        ClientEntity adversaire = findPartyByRole(dossier, RolePartie.ADVERSAIRE);
        fillParty(vars, "adversaire", adversaire);

        ClientEntity avocatAdverse = findPartyByRole(dossier, RolePartie.AVOCAT_ADVERSE);
        vars.put("avocatAdverse.nomComplet", avocatAdverse != null ? safe(avocatAdverse.getDisplayName(), "Non constitué") : "Non constitué");

        // 6. Pièces du dossier (bordereau automatique)
        List<Document> docs = dossier.getDocuments() != null ? dossier.getDocuments() : List.of();
        vars.put("pieces.nombre", String.valueOf(docs.size()));
        if (docs.isEmpty()) {
            vars.put("pieces.bordereau", "(Aucune pièce encore classée dans le dossier)");
        } else {
            StringBuilder bordereau = new StringBuilder();
            for (int i = 0; i < docs.size(); i++) {
                Document doc = docs.get(i);
                String label = (doc.getTitle() != null && !doc.getTitle().isBlank()) ? doc.getTitle() : doc.getNomFichier();
                bordereau.append("Pièce n°").append(i + 1).append(" : ").append(safe(label, "Document"));
                if (doc.getNomFichier() != null && !doc.getNomFichier().equals(label)) {
                    bordereau.append(" (").append(doc.getNomFichier()).append(")");
                }
                if (i < docs.size() - 1) bordereau.append("\n");
            }
            vars.put("pieces.bordereau", bordereau.toString());
        }

        // 7. Prochaine échéance procédurale active
        List<DossierDeadline> deadlines = deadlineRepository.findByDossierIdOrderByDateEcheanceFinaleAsc(dossierId);
        DossierDeadline nextDeadline = deadlines.stream()
                .filter(d -> "ACTIF".equals(d.getStatut()))
                .findFirst().orElse(null);
        vars.put("delais.prochaineEcheance", nextDeadline != null
                ? nextDeadline.getTitre() + " (" + nextDeadline.getDateEcheanceFinale().format(FR_SHORT) + ")"
                : "Aucune échéance active");

        return vars;
    }

    private void fillParty(Map<String, String> vars, String prefix, ClientEntity c) {
        if (c == null) {
            vars.put(prefix + ".qualite", "");
            vars.put(prefix + ".nomComplet", "");
            vars.put(prefix + ".adresse", "");
            vars.put(prefix + ".email", "");
            vars.put(prefix + ".telephone", "");
            vars.put(prefix + ".rcs", "");
            vars.put(prefix + ".representantLegal", "");
            return;
        }
        vars.put(prefix + ".nomComplet", safe(c.getDisplayName(), ""));
        vars.put(prefix + ".adresse", safe(c.getAdresse(), ""));
        vars.put(prefix + ".email", safe(c.getEmail(), ""));
        vars.put(prefix + ".telephone", safe(c.getTelephone(), ""));

        if (c instanceof ClientMoral cm) {
            String forme = safe(cm.getFormeJuridique(), "société");
            vars.put(prefix + ".qualite", "La société (" + forme + ")");
            vars.put(prefix + ".rcs", safe(cm.getNumeroRegistreCommerce(), ""));
            String rep = ((cm.getPrenomRepresentantLegal() != null ? cm.getPrenomRepresentantLegal() + " " : "")
                    + (cm.getNomRepresentantLegal() != null ? cm.getNomRepresentantLegal() : "")).trim();
            vars.put(prefix + ".representantLegal", rep);
        } else {
            vars.put(prefix + ".qualite", "Monsieur / Madame");
            vars.put(prefix + ".rcs", "");
            vars.put(prefix + ".representantLegal", "");
        }
    }

    private ClientEntity findPartyByRole(Dossier dossier, RolePartie role) {
        if (dossier.getAutresParties() == null) return null;
        return dossier.getAutresParties().stream()
                .filter(p -> p.getRole() == role && p.getPartie() != null)
                .map(DossierPartie::getPartie)
                .findFirst().orElse(null);
    }

    private String resolveLawyerName(String responsableId) {
        if (responsableId == null || responsableId.isBlank()) return "Maître (Avocat au Barreau)";
        try {
            Long id = Long.valueOf(responsableId.trim());
            return userRepository.findById(id)
                    .map(u -> "Maître " + ((u.getFirstName() != null ? u.getFirstName() + " " : "")
                            + (u.getLastName() != null ? u.getLastName() : u.getUsername())).trim())
                    .orElse("Maître (Avocat au Barreau)");
        } catch (NumberFormatException e) {
            return "Maître " + responsableId;
        }
    }

    private static String safe(String v, String fallback) {
        return (v != null && !v.isBlank()) ? v.trim() : fallback;
    }
}

package com.avo.service.ai;

import com.avo.entities.Dossier;
import com.avo.entities.MatterActivity;
import com.avo.entities.Task;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.MatterActivityRepository;
import com.avo.repositories.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AiDossierSummaryService {

    private final DossierRepository dossierRepository;
    private final TaskRepository taskRepository;
    private final MatterActivityRepository matterActivityRepository;
    private final com.avo.repositories.NoteRepository noteRepository;
    private final com.avo.repositories.AppointementRepository appointementRepository;
    private final com.avo.repositories.InvoiceDossierServiceRepository invoiceDossierServiceRepository;

    public AiDossierSummaryService(DossierRepository dossierRepository, 
                                   TaskRepository taskRepository,
                                   MatterActivityRepository matterActivityRepository,
                                   com.avo.repositories.NoteRepository noteRepository,
                                   com.avo.repositories.AppointementRepository appointementRepository,
                                   com.avo.repositories.InvoiceDossierServiceRepository invoiceDossierServiceRepository) {
        this.dossierRepository = dossierRepository;
        this.taskRepository = taskRepository;
        this.matterActivityRepository = matterActivityRepository;
        this.noteRepository = noteRepository;
        this.appointementRepository = appointementRepository;
        this.invoiceDossierServiceRepository = invoiceDossierServiceRepository;
    }

    public String generateDossierSummary(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        if (dossier == null) {
            return "Dossier introuvable avec l'ID: " + dossierId;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("=== DOSSIER COMPLET ===\n");
        sb.append("Titre : ").append(dossier.getTitre()).append("\n");
        sb.append("Référence : ").append(dossier.getReferenceInterne()).append("\n");
        sb.append("Description : ").append(dossier.getDescription() != null ? dossier.getDescription() : "N/A").append("\n");
        sb.append("Statut : ").append(dossier.getStatutID() != null ? dossier.getStatutID() : "N/A").append("\n");

        if (dossier.getClient() != null) {
            sb.append("\n--- Client ---\n");
            String nom = "";
            if (dossier.getClient() instanceof com.avo.entities.ClientPersonnePhysique) {
                nom = ((com.avo.entities.ClientPersonnePhysique) dossier.getClient()).getNom();
            } else if (dossier.getClient() instanceof com.avo.entities.ClientMoral) {
                nom = ((com.avo.entities.ClientMoral) dossier.getClient()).getNomCommercial();
            }
            sb.append("Nom : ").append(nom).append("\n");
        }

        sb.append("\n--- Réunions (Appointments) ---\n");
        List<com.avo.entities.Appointement> appointements = appointementRepository.findByDossier_Id(dossierId);
        if (appointements != null && !appointements.isEmpty()) {
            for (com.avo.entities.Appointement app : appointements) {
                sb.append("- ").append(app.getTitle()).append(" le ").append(app.getDate())
                  .append(" (").append(app.getTime()).append("-").append(app.getEndTime()).append(")")
                  .append(" - ").append(app.getStatus()).append("\n");
            }
        } else {
            sb.append("Aucune réunion.\n");
        }

        sb.append("\n--- Remarques / Notes ---\n");
        List<com.avo.entities.Note> notes = noteRepository.findByDossier_Id(dossierId);
        if (notes != null && !notes.isEmpty()) {
            for (com.avo.entities.Note note : notes) {
                sb.append("- ").append(note.getTitle()).append(" (").append(note.getCreatedAt()).append(") : ")
                  .append(note.getDescription()).append("\n");
            }
        } else {
            sb.append("Aucune remarque/note.\n");
        }

        sb.append("\n--- Prestations (Temps facturé) ---\n");
        List<com.avo.entities.InvoiceDossierService> prestations = invoiceDossierServiceRepository.findByDossier_Id(dossierId);
        if (prestations != null && !prestations.isEmpty()) {
            for (com.avo.entities.InvoiceDossierService p : prestations) {
                sb.append("- ").append(p.getNbrOfMinutes()).append(" minutes : ").append(p.getInfo()).append("\n");
            }
        } else {
            sb.append("Aucune prestation enregistrée.\n");
        }

        sb.append("\n--- Documents associés ---\n");
        if (dossier.getDocuments() != null && !dossier.getDocuments().isEmpty()) {
            dossier.getDocuments().forEach(doc -> {
                sb.append("- ").append(doc.getNomFichier()).append(" (Type: ").append(doc.getTypeDocument()).append(")\n");
            });
        } else {
            sb.append("Aucun document.\n");
        }

        sb.append("\n--- Tâches ---\n");
        List<Task> tasks = taskRepository.findByDossierId(dossierId);
        if (tasks != null && !tasks.isEmpty()) {
            tasks.forEach(t -> {
                sb.append("- ").append(t.getTitre()).append(" (Statut: ")
                  .append(t.getStatus() != null ? t.getStatus().getLibelle() : "N/A")
                  .append(", Terminée: ").append(t.isCompleted()).append(")\n");
            });
        } else {
            sb.append("Aucune tâche.\n");
        }

        sb.append("\n--- Historique des actions récentes ---\n");
        List<MatterActivity> activities = matterActivityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);
        if (activities != null && !activities.isEmpty()) {
            activities.stream().limit(15).forEach(act -> {
                sb.append("- [").append(act.getCreatedAt().toLocalDate()).append("] ")
                  .append(act.getAuthor()).append(" a fait '").append(act.getAction())
                  .append("' sur ").append(act.getTargetType()).append(" : ")
                  .append(act.getDescription()).append("\n");
            });
        } else {
            sb.append("Aucune action enregistrée.\n");
        }

        return sb.toString();
    }
}

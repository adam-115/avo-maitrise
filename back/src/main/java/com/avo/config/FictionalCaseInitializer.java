package com.avo.config;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.*;
import com.avo.repositories.*;
import com.avo.services.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Configuration
public class FictionalCaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(FictionalCaseInitializer.class);

    private final ClientRepository clientRepo;
    private final DossierRepository dossierRepo;
    private final DocumentService documentService;

    public FictionalCaseInitializer(ClientRepository clientRepo, DossierRepository dossierRepo, DocumentService documentService) {
        this.clientRepo = clientRepo;
        this.dossierRepo = dossierRepo;
        this.documentService = documentService;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Check if the client already exists to avoid duplicate entries on restart
        if (clientRepo.findByEmail("jean.dupont.fictif@example.com").isPresent()) {
            log.info("Fictional case already initialized.");
            return;
        }

        log.info("Initializing fictional case for AI Assistant testing...");

        // 1. Create a fictional Client
        ClientPersonnePhysique client = new ClientPersonnePhysique();
        client.setNom("Dupont");
        client.setPrenom("Jean");
        client.setEmail("jean.dupont.fictif@example.com");
        client.setTelephone("+33 6 12 34 56 78");
        client.setAdresse("15 Rue de la Paix");
        client.setPays("France");
        client.setClientStatus(ClientStatus.VALIDATED);
        client.setSecteurActivite("Immobilier");
        client = clientRepo.save(client);

        // 2. Create a fictional Dossier
        Dossier dossier = new Dossier();
        dossier.setTitre("Litige Vente Immobilière Dupont c/ SCI Les Mimosas");
        dossier.setReferenceInterne("DOS-2026-001");
        dossier.setClient(client);
        dossier.setDescription("Affaire concernant l'annulation d'une vente immobilière pour vice caché (présence de mérule) dans la maison située au 42 avenue des Lilas. L'acheteur (notre client) demande l'annulation de la vente et des dommages et intérêts.");
        dossier.setDateOuverture(new java.util.Date());
        dossier.setStatutID("EN_COURS");
        dossier = dossierRepo.save(dossier);

        // 3. Create Documents and ingest them
        // Document 1: Contrat de Vente
        String contratText = "CONTRAT DE VENTE IMMOBILIÈRE\n\nEntre les soussignés:\nSCI Les Mimosas, vendeur.\nEt M. Jean Dupont, acheteur.\n\nObjet: Vente de la maison sise 42 avenue des Lilas.\nPrix: 350 000 Euros.\nCondition particulière: La maison est vendue en l'état. Le vendeur déclare ne pas avoir connaissance de vices cachés.";
        DocumentDTO doc1 = new DocumentDTO();
        doc1.setClientId(client.getId());
        doc1.setDossierId(dossier.getId());
        doc1.setNomFichier("contrat_vente.txt");
        doc1.setFilename("contrat_vente.txt");
        doc1.setTitle("Contrat de Vente Immobilière");
        doc1.setDescription("Contrat signé entre Jean Dupont et SCI Les Mimosas");
        doc1.setTypeDocument(DocumentType.DOSSIER);
        doc1.setFileData(java.util.Base64.getEncoder().encodeToString(contratText.getBytes(StandardCharsets.UTF_8)));
        documentService.create(doc1);

        // Document 2: Rapport d'expertise
        String expertiseText = "RAPPORT D'EXPERTISE JUDICIAIRE\n\nExpert: M. Martin, architecte expert.\nDate: 12 Janvier 2026\nObjet: Inspection de la maison sise 42 avenue des Lilas.\n\nConclusions: Nous constatons la présence massive de mérule (Serpula lacrymans) dans la charpente de la maison. L'infection semble dater d'au moins 3 ans et a été masquée par des travaux de peinture récents dans les combles. La solidité de la toiture est gravement compromise.";
        DocumentDTO doc2 = new DocumentDTO();
        doc2.setClientId(client.getId());
        doc2.setDossierId(dossier.getId());
        doc2.setNomFichier("rapport_expertise.txt");
        doc2.setFilename("rapport_expertise.txt");
        doc2.setTitle("Rapport d'Expertise Mérule");
        doc2.setDescription("Rapport constatant la mérule");
        doc2.setTypeDocument(DocumentType.DOSSIER);
        doc2.setFileData(java.util.Base64.getEncoder().encodeToString(expertiseText.getBytes(StandardCharsets.UTF_8)));
        documentService.create(doc2);

        // Document 3: Mise en demeure
        String miseEnDemeureText = "MISE EN DEMEURE\n\nDate: 20 Février 2026\nDestinataire: SCI Les Mimosas\n\nMadame, Monsieur,\nSuite à la découverte d'un vice caché grave (mérule) constaté par l'expert M. Martin, mon client M. Jean Dupont vous met en demeure d'annuler la vente de la maison sise 42 avenue des Lilas et de procéder au remboursement intégral des sommes versées (350 000 Euros) sous 15 jours, faute de quoi nous engagerons des poursuites devant le Tribunal Judiciaire.";
        DocumentDTO doc3 = new DocumentDTO();
        doc3.setClientId(client.getId());
        doc3.setDossierId(dossier.getId());
        doc3.setNomFichier("mise_en_demeure.txt");
        doc3.setFilename("mise_en_demeure.txt");
        doc3.setTitle("Mise en Demeure SCI");
        doc3.setDescription("Lettre d'avocat de mise en demeure");
        doc3.setTypeDocument(DocumentType.DOSSIER);
        doc3.setFileData(java.util.Base64.getEncoder().encodeToString(miseEnDemeureText.getBytes(StandardCharsets.UTF_8)));
        documentService.create(doc3);

        log.info("Fictional case initialization complete! You can now test the AI Assistant on this dossier.");
    }
}

// package com.avo.controller;

// import com.avo.dtos.DocumentDTO;
// import com.avo.entities.ClientMoral;
// import com.avo.entities.DocumentType;
// import com.avo.entities.Dossier;
// import com.avo.services.DocumentService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RestController;
// import jakarta.persistence.EntityManager;
// import jakarta.transaction.Transactional;

// import java.nio.charset.StandardCharsets;
// import java.util.Base64;

// @RestController
// public class TestSeederController {

//     @Autowired
//     private EntityManager entityManager;

//     @Autowired
//     private DocumentService documentService;

//     @GetMapping("/api/test/seed")
//     @Transactional
//     public String seedData() {
//         StringBuilder result = new StringBuilder();

//         // 1. Create Client 1 & Dossier 1 (TechNova)
//         if (entityManager
//                 .createQuery("SELECT count(d) FROM Dossier d WHERE d.referenceInterne = 'DOS-TECH-2026-001-V2'",
//                         Long.class)
//                 .getSingleResult() == 0) {
//             ClientMoral client1 = new ClientMoral();
//             client1.setEmail("contact@technova.com");
//             client1.setTelephone("0123456789");
//             client1.setAdresse("123 Rue de la Tech, Paris");
//             client1.setPays("France");
//             client1.setNomCommercial("TechNova Solutions");
//             entityManager.persist(client1);

//             Dossier dossier1 = new Dossier();
//             dossier1.setClient(client1);
//             dossier1.setReferenceInterne("DOS-TECH-2026-001-V2");
//             dossier1.setTitre("Litige Commercial TechNova vs DevFactory");
//             dossier1.setDescription(
//                     "Le client (TechNova Solutions) a commandé un logiciel d'IA personnalisé à DevFactory Inc pour un montant de 150 000 €.\n...");
//             dossier1.setDomaineJuridique("Droit Commercial / IT");
//             entityManager.persist(dossier1);

//             // Add Document for TechNova
//             try {
//                 String contratText = "CONTRAT DE PRESTATION DE SERVICES IT\n\nEntre TechNova Solutions (Client) et DevFactory Inc (Prestataire).\nObjet: Développement d'un logiciel IA sur mesure.\nPrix total: 150 000 Euros.\nDate de livraison: 15 Juin 2025.\nClause pénale: 500 Euros par jour de retard de livraison.";
//                 DocumentDTO doc1 = new DocumentDTO();
//                 doc1.setClientId(client1.getId());
//                 doc1.setDossierId(dossier1.getId());
//                 doc1.setNomFichier("contrat_prestation_it.txt");
//                 doc1.setFilename("contrat_prestation_it.txt");
//                 doc1.setTitle("Contrat IT");
//                 doc1.setDescription("Contrat initial avec DevFactory");
//                 doc1.setTypeDocument(DocumentType.DOSSIER);
//                 doc1.setFileData(Base64.getEncoder().encodeToString(contratText.getBytes(StandardCharsets.UTF_8)));
//                 documentService.create(doc1);
//             } catch (Exception e) {
//                 result.append("Erreur création document TechNova: " + e.getMessage() + ". ");
//             }

//             result.append("Dossier TechNova créé avec document. ");
//         } else {
//             result.append("Dossier TechNova existant. ");
//         }

//         // 2. Create Client 2 & Dossier 2 (UN Sanctioned Entity for AML testing)
//         if (entityManager
//                 .createQuery("SELECT count(d) FROM Dossier d WHERE d.referenceInterne = 'DOS-SANCT-2026-002-V2'",
//                         Long.class)
//                 .getSingleResult() == 0) {
//             com.avo.entities.ClientPersonnePhysique client2 = new com.avo.entities.ClientPersonnePhysique();
//             client2.setNom("Putin");
//             client2.setPrenom("Vladimir");
//             client2.setEmail("vladimir@kremlin.ru");
//             client2.setTelephone("+7 495 697-03-49");
//             client2.setPays("Russie");
//             client2.setNationalite("Russe");
//             entityManager.persist(client2);

//             Dossier dossier2 = new Dossier();
//             dossier2.setClient(client2);
//             dossier2.setReferenceInterne("DOS-SANCT-2026-002-V2");
//             dossier2.setTitre("Consultation Sanctions Internationales");
//             dossier2.setDescription("Demande de conseil juridique concernant des avoirs gelés en Europe.");
//             dossier2.setDomaineJuridique("Droit International");
//             entityManager.persist(dossier2);

//             // Add Document for Putin
//             try {
//                 String sanctionText = "ARTICLE DE PRESSE\n\nDate: 25 Février 2022\nSujet: L'Union Européenne et les Nations Unies ont placé M. Vladimir Putin sur la liste des personnes sanctionnées. Tous les avoirs européens sont immédiatement gelés. Les institutions financières ont interdiction stricte de collaborer avec cette personne.";
//                 DocumentDTO doc2 = new DocumentDTO();
//                 doc2.setClientId(client2.getId());
//                 doc2.setDossierId(dossier2.getId());
//                 doc2.setNomFichier("article_sanction_onu.txt");
//                 doc2.setFilename("article_sanction_onu.txt");
//                 doc2.setTitle("Article Sanctions ONU");
//                 doc2.setDescription("Revue de presse sur le gel des avoirs");
//                 doc2.setTypeDocument(DocumentType.CLIENT);
//                 doc2.setFileData(Base64.getEncoder().encodeToString(sanctionText.getBytes(StandardCharsets.UTF_8)));
//                 documentService.create(doc2);
//             } catch (Exception e) {
//                 result.append("Erreur création document Putin: " + e.getMessage() + ". ");
//             }

//             result.append("Dossier Putin créé avec document. ");
//         } else {
//             result.append("Dossier Putin existant. ");
//         }

//         // 3. Create Client 3 & Dossier 3 (Normal Person)
//         if (entityManager
//                 .createQuery("SELECT count(d) FROM Dossier d WHERE d.referenceInterne = 'DOS-FAM-2026-003'", Long.class)
//                 .getSingleResult() == 0) {
//             com.avo.entities.ClientPersonnePhysique client3 = new com.avo.entities.ClientPersonnePhysique();
//             client3.setNom("Martin");
//             client3.setPrenom("Sophie");
//             client3.setEmail("sophie.martin@email.com");
//             client3.setPays("France");
//             entityManager.persist(client3);

//             Dossier dossier3 = new Dossier();
//             dossier3.setClient(client3);
//             dossier3.setReferenceInterne("DOS-FAM-2026-003");
//             dossier3.setTitre("Procédure de Divorce");
//             dossier3.setDescription("Procédure de divorce par consentement mutuel.");
//             dossier3.setDomaineJuridique("Droit de la Famille");
//             entityManager.persist(dossier3);
//             result.append("Dossier Divorce créé. ");
//         } else {
//             result.append("Dossier Divorce existant. ");
//         }

//         return result.toString();
//     }
// }

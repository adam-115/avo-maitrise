package com.avo.controller;

import com.avo.entities.ClientMoral;
import com.avo.entities.Dossier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@RestController
public class TestSeederController {

    @Autowired
    private EntityManager entityManager;

    @GetMapping("/api/test/seed")
    @Transactional
    public String seedData() {
        // Create Client
        ClientMoral client = new ClientMoral();
        client.setEmail("contact@technova.com");
        client.setTelephone("0123456789");
        client.setAdresse("123 Rue de la Tech, Paris");
        client.setPays("France");
        client.setNomCommercial("TechNova Solutions");
        // client.setRaisonSociale("TechNova SAS");
        // client.setSiren("123456789");

        entityManager.persist(client);

        // Create Dossier
        Dossier dossier = new Dossier();
        dossier.setClient(client);
        dossier.setReferenceInterne("DOS-TECH-2026-001");
        dossier.setTitre("Litige Commercial TechNova vs DevFactory");
        dossier.setDescription(
                "Le client (TechNova Solutions) a commandé un logiciel d'IA personnalisé à DevFactory Inc pour un montant de 150 000 €.\n"
                        +
                        "DevFactory a livré le logiciel avec 6 mois de retard. De plus, le logiciel présente de graves bugs et plante constamment en production.\n"
                        +
                        "À cause de ces retards et dysfonctionnements, TechNova a perdu 2 clients majeurs, causant un préjudice estimé à 300 000 €.\n"
                        +
                        "DevFactory refuse de rembourser et de corriger les bugs, arguant que le retard et les bugs sont dus à de multiples changements de périmètre (Scope Creep) demandés par TechNova en cours de développement.\n\n"
                        +
                        "FAITS IMPORTANTS :\n" +
                        "- Contrat de prestation de services signé le 15 Janvier 2025.\n" +
                        "- Date de livraison prévue initiale : 15 Juin 2025.\n" +
                        "- Livraison réelle : 10 Décembre 2025.\n" +
                        "- Paiement déjà effectué : 100 000 € d'acompte.\n" +
                        "- Clause pénale dans le contrat pour retard : 500 € par jour de retard.\n" +
                        "- Mails prouvant les demandes de changement de TechNova (potentielle faille pour nous).");
        dossier.setDomaineJuridique("Droit Commercial / IT");

        entityManager.persist(dossier);

        return "Dossier fictif très détaillé créé avec succès ! ID: " + dossier.getId() + " - Titre: "
                + dossier.getTitre();
    }
}

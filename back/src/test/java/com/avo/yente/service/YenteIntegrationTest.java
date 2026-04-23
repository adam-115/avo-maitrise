package com.avo.yente.service;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.avo.entities.Association;
import com.avo.entities.ClientMoral;
import com.avo.entities.PersonnePhysique;
import com.avo.yente.models.AmlAnalysisResult;

@SpringBootTest
@ActiveProfiles("test")
class YenteIntegrationTest {

    @Autowired
    private YenteAmlService yenteAmlService;

    @Test
    public void testCheckYenteHealth() {
        boolean health = yenteAmlService.checkYenteHealth();
    }

    @Autowired
    private com.avo.repositories.PersonnePhysiqueRepository personnePhysiqueRepository;

    @Test
    public void testMatchPersonnePhysique() {
        PersonnePhysique pp = new PersonnePhysique();
        pp.setPrenom("nicolas");
        pp.setNom("sarkozy");
        pp.setNationalite("fr");
        pp.setEmail("nicolas.sarkozy@test.com");
        
        pp = personnePhysiqueRepository.save(pp);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(pp);
        System.out.println("============================== Start MATCH Search for Person ==============================");
        System.out.println(pp.toString());
        System.out.println("============================== MATCH RESULT ==============================");
        if (!results.isEmpty()) {
            System.out.println("Yente ID: " + results.get(0).getYenteId());
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("PEP: " + results.get(0).isPep());
            System.out.println("Family Member: " + results.get(0).isFamilyMember());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Sanction Reason: " + results.get(0).getSanctionReason());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("==========================================================================");
    }

    @Autowired
    private com.avo.repositories.ClientMoralRepository clientMoralRepository;

    @Autowired
    private com.avo.repositories.AssociationRepository associationRepository;

    @Test
    public void testMatchClientMoral() {
        ClientMoral cm = new ClientMoral();
        cm.setNomCommercial("total");
        cm.setPays("fr");
        cm.setEmail("total@test.com");
        
        cm = clientMoralRepository.save(cm);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(cm);
        
        System.out.println("============================== MATCH RESULT ==============================");
        if (!results.isEmpty()) {
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("PEP: " + results.get(0).isPep());
            System.out.println("Family Member: " + results.get(0).isFamilyMember());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Sanction Reason: " + results.get(0).getSanctionReason());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("==========================================================================");
    }

    @Test
    public void testMatchAssociation() {
        Association a = new Association();
        a.setNom("total");
        a.setPays("fr");
        a.setEmail("total@test.com");
        
        a = associationRepository.save(a);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(a);
        
        System.out.println("============================== MATCH RESULT ==============================");
        if (!results.isEmpty()) {
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("PEP: " + results.get(0).isPep());
            System.out.println("Family Member: " + results.get(0).isFamilyMember());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Sanction Reason: " + results.get(0).getSanctionReason());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("==========================================================================");
    }

    @Test
    public void testMatchSanctionedPerson() {
        com.avo.entities.PersonnePhysique pp = new com.avo.entities.PersonnePhysique();
        pp.setPrenom("Vladimir");
        pp.setNom("Putin");
        pp.setNationalite("ru");
        pp.setEmail("v.putin@test.com");
        
        pp = personnePhysiqueRepository.save(pp);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(pp);
        
        System.out.println("============================== SANCTIONED PERSON MATCH ==============================");
        if (!results.isEmpty()) {
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("=====================================================================================");
    }

    @Test
    public void testMatchSanctionedCompany() {
        ClientMoral cm = new ClientMoral();
        cm.setNomCommercial("Gazprom");
        cm.setPays("ru");
        
        // cm = clientMoralRepository.save(cm);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(cm);
        
        System.out.println("============================== SANCTIONED COMPANY MATCH ==============================");
        if (!results.isEmpty()) {
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("======================================================================================");
    }

    @Test
    public void testMatchSanctionedAssociation() {
        Association a = new Association();
        a.setNom("Al-Qaeda");
        
        // a = associationRepository.save(a);

        List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(a);
        
        System.out.println("============================== SANCTIONED ASSOCIATION MATCH ==============================");
        if (!results.isEmpty()) {
            System.out.println("Status: " + results.get(0).getStatus());
            System.out.println("Sanctioned: " + results.get(0).isSanctioned());
            System.out.println("Match Name: " + results.get(0).getMatchName());
            System.out.println("Match Score: " + results.get(0).getMatchScore());
            System.out.println("Referents: " + results.get(0).getReferents().toString());
        } else {
            System.out.println("No matches found.");
        }
        System.out.println("==========================================================================================");
    }

}

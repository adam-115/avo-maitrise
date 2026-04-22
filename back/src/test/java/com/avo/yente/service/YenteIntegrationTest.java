package com.avo.yente.service;

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

        AmlAnalysisResult result = yenteAmlService.checkClientStatus(pp);
        System.out.println("============================== Start MATCH Search for Person ==============================");
        System.out.println(pp.toString());
        System.out.println("============================== MATCH RESULT ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("PEP: " + result.isPep());
        System.out.println("Family Member: " + result.isFamilyMember());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Sanction Reason: " + result.getSanctionReason());
        System.out.println("Referents: " + result.getReferents().toString());
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

        com.avo.yente.models.AmlAnalysisResult result = yenteAmlService.checkClientStatus(cm);
        
        System.out.println("============================== MATCH RESULT ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("PEP: " + result.isPep());
        System.out.println("Family Member: " + result.isFamilyMember());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Sanction Reason: " + result.getSanctionReason());
        System.out.println("Referents: " + result.getReferents().toString());
        System.out.println("==========================================================================");
    }

    @Test
    public void testMatchAssociation() {
        Association a = new Association();
        a.setNom("total");
        a.setPays("fr");
        a.setEmail("total@test.com");
        
        a = associationRepository.save(a);

        AmlAnalysisResult result = yenteAmlService.checkClientStatus(a);
        
        System.out.println("============================== MATCH RESULT ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("PEP: " + result.isPep());
        System.out.println("Family Member: " + result.isFamilyMember());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Sanction Reason: " + result.getSanctionReason());
        System.out.println("Referents: " + result.getReferents().toString());
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

        com.avo.yente.models.AmlAnalysisResult result = yenteAmlService.checkClientStatus(pp);
        
        System.out.println("============================== SANCTIONED PERSON MATCH ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Referents: " + result.getReferents().toString());
        System.out.println("=====================================================================================");
    }

    @Test
    public void testMatchSanctionedCompany() {
        com.avo.entities.ClientMoral cm = new com.avo.entities.ClientMoral();
        cm.setNomCommercial("Gazprom");
        cm.setPays("ru");
        
        // cm = clientMoralRepository.save(cm);

        com.avo.yente.models.AmlAnalysisResult result = yenteAmlService.checkClientStatus(cm);
        
        System.out.println("============================== SANCTIONED COMPANY MATCH ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Referents: " + result.getReferents().toString());
        System.out.println("======================================================================================");
    }

    @Test
    public void testMatchSanctionedAssociation() {
        com.avo.entities.Association a = new com.avo.entities.Association();
        a.setNom("Al-Qaeda");
        
        // a = associationRepository.save(a);

        com.avo.yente.models.AmlAnalysisResult result = yenteAmlService.checkClientStatus(a);
        
        System.out.println("============================== SANCTIONED ASSOCIATION MATCH ==============================");
        System.out.println("Status: " + result.getStatus());
        System.out.println("Sanctioned: " + result.isSanctioned());
        System.out.println("Match Name: " + result.getMatchName());
        System.out.println("Match Score: " + result.getMatchScore());
        System.out.println("Referents: " + result.getReferents().toString());
        System.out.println("==========================================================================================");
    }

}

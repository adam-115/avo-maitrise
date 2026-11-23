package com.avo.services.acts;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ActTemplateEngineTest {

    private final ActTemplateEngine engine = new ActTemplateEngine();

    @Test
    void extractsUniquePlaceholdersInOrder() {
        String tpl = "Bonjour {{client.nomComplet}}, dossier {{dossier.reference}}, montant {{montant}} et {{client.nomComplet}}.";
        assertEquals(List.of("client.nomComplet", "dossier.reference", "montant"), engine.extractPlaceholders(tpl));
    }

    @Test
    void rendersKnownVariablesAndMarksMissingOnes() {
        String tpl = "Client: {{client.nomComplet}} | Montant: {{montantReclame}}";
        String rendered = engine.renderText(tpl, Map.of("client.nomComplet", "Marc MOREAU"));
        assertEquals("Client: Marc MOREAU | Montant: [montantReclame]", rendered);
        assertEquals(List.of("montantReclame"),
                engine.findMissingVariables(engine.extractPlaceholders(tpl), Map.of("client.nomComplet", "Marc MOREAU")));
    }

    @Test
    void buildsAndMergesDocxPreservingContent() throws Exception {
        byte[] templateDocx = engine.buildDocxFromText("Test", "MISE EN DEMEURE\nDestinataire : {{adversaire.nomComplet}}\nMontant : {{montant}}");
        assertEquals(List.of("adversaire.nomComplet", "montant"), engine.extractPlaceholdersFromDocx(templateDocx));

        byte[] merged = engine.mergeDocxTemplate(templateDocx, Map.of(
                "adversaire.nomComplet", "NEXA CLOUD SYSTEMS SAS",
                "montant", "48 500 €"));

        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(merged))) {
            String full = doc.getParagraphs().stream().map(p -> p.getText()).reduce("", (a, b) -> a + "\n" + b);
            assertTrue(full.contains("NEXA CLOUD SYSTEMS SAS"));
            assertTrue(full.contains("48 500 €"));
            assertFalse(full.contains("{{"));
        }
    }
}

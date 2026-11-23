package com.avo.service.ai.sources;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réponse de l'IA accompagnée des sources consultées, du verdict de la vérification automatique et du droit
 * applicable dans lequel la base légale a été recherchée (ex. [FRANCE, INTERNATIONAL]).
 */
public record AiAnswer(String result, List<SourceRef> sources, VerificationReport verification,
        List<String> perimetre) {

    /** Corps JSON renvoyé au front : « result » reste présent pour la compatibilité avec l'existant. */
    public Map<String, Object> toBody() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("result", result);
        body.put("sources", sources);
        body.put("verification", verification);
        body.put("perimetre", perimetre);
        return body;
    }
}

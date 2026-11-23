package com.avo.service.ai.sources;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Registre des sources consultées pendant UNE réponse de l'IA.
 *
 * Il est ouvert par AiService avant l'appel au modèle et fermé après : les outils (recherche dans les pièces,
 * jurisprudence, fiches clients...) y inscrivent chaque passage et reçoivent un identifiant S1, S2... qu'ils
 * transmettent au modèle. Le registre vit dans le thread de la requête (les outils Spring AI y sont exécutés).
 * Un même passage lu deux fois garde le même identifiant.
 */
@Component
public class SourceRegistry {

    private static final int MAX_EXCERPT = 400;

    private final ThreadLocal<Session> current = new ThreadLocal<>();

    /** Ouvre un registre vide pour la réponse en cours. */
    public void open() {
        current.set(new Session());
    }

    /** Ferme le registre et renvoie les sources consultées, dans l'ordre de consultation. */
    public List<SourceRef> close() {
        Session session = current.get();
        current.remove();
        return session == null ? List.of() : List.copyOf(session.sources.values());
    }

    public boolean isOpen() {
        return current.get() != null;
    }

    /** Sources consultées jusqu'ici (sans fermer le registre). */
    public List<SourceRef> snapshot() {
        Session session = current.get();
        return session == null ? List.of() : List.copyOf(session.sources.values());
    }

    /**
     * Inscrit un passage et renvoie son identifiant (S1, S2...). Sans registre ouvert (outil appelé hors d'une
     * réponse IA), renvoie « S? » : le passage reste lisible mais n'est pas vérifiable.
     */
    public String register(String kind, String title, Long documentId, Integer page, String text,
            String link, String officialUrl, Map<String, String> details) {
        Session session = current.get();
        if (session == null) {
            return "S?";
        }
        String key = kind + "|" + documentId + "|" + page + "|" + (text == null ? "" : text.hashCode()) + "|" + title;
        SourceRef existing = session.byKey.get(key);
        if (existing != null) {
            return existing.id();
        }
        String id = "S" + (session.sources.size() + 1);
        String clean = text == null ? "" : text.strip();
        String excerpt = clean.length() > MAX_EXCERPT ? clean.substring(0, MAX_EXCERPT) + "…" : clean;
        SourceRef ref = new SourceRef(id, kind, title, documentId, page, excerpt, clean, link, officialUrl,
                details == null ? Map.of() : Map.copyOf(details));
        session.sources.put(id, ref);
        session.byKey.put(key, ref);
        return id;
    }

    private static final class Session {
        private final LinkedHashMap<String, SourceRef> sources = new LinkedHashMap<>();
        private final Map<String, SourceRef> byKey = new HashMap<>();
    }
}

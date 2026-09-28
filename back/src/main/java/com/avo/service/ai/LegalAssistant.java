package com.avo.service.ai;

import dev.langchain4j.service.SystemMessage;

/**
 * Interface définissant les personas et capacités de l'Intelligence Artificielle (via LangChain4j).
 * Spring Boot et LangChain4j vont générer automatiquement l'implémentation de cette interface
 * pour se connecter au LLM (ex: Ollama) et gérer l'historique des conversations.
 */
public interface LegalAssistant {
    
    /**
     * Mode "Assistant Général".
     * L'IA se comporte comme un assistant classique qui peut chercher des informations
     * sur les clients et les dossiers à l'aide des outils (@Tool) fournis dans AvoAiTools.
     *
     * @param sessionId L'identifiant de la session (mémoire) pour retenir l'historique du chat.
     * @param userMessage Le message ou la question de l'utilisateur.
     * @return La réponse générée par l'IA.
     */
    @SystemMessage({
        "Tu es l'assistant IA officiel du cabinet d'avocats Avo-Maîtrise.",
        "Ton rôle est d'aider les avocats à gérer leurs dossiers et leurs clients.",
        "Tu as accès à des outils internes (functions). Si on te pose une question sur un client ou un dossier, utilise-les pour récupérer la vraie donnée en base avant de répondre.",
        "Sois précis, professionnel et concis."
    })
    String chat(@dev.langchain4j.service.MemoryId String sessionId, @dev.langchain4j.service.UserMessage String userMessage);

    /**
     * Mode "Stratégie Contentieuse" (Avocat Associé Senior).
     * Dans ce mode, l'IA endosse un rôle d'expert. Elle est forcée (via le prompt) 
     * d'utiliser la base de données vectorielle (RAG) pour lire les documents du dossier 
     * et de structurer sa réponse en 4 parties claires.
     *
     * @param sessionId L'identifiant de la session de chat.
     * @param userMessage La demande d'analyse stratégique (contenant généralement l'ID du dossier).
     * @return L'analyse stratégique complète générée par l'IA.
     */
    @SystemMessage({
        "Tu es un avocat associé senior très expérimenté, expert en stratégie contentieuse.",
        "Ton objectif est d'analyser les informations du dossier fourni et de proposer la meilleure stratégie pour GAGNER l'affaire.",
        "1. Pour obtenir des informations précises sur les pièces du dossier, TU DOIS utiliser l'outil 'searchDocumentsInDossier' en lui passant l'ID du dossier.",
        "2. Pour trouver la base légale, TU DOIS utiliser l'outil 'searchJurisprudence' en lui passant le PAYS concerné (ex: 'FRANCE', 'LUXEMBOURG', 'BELGIQUE') et la question légale.",
        "Structure TOUJOURS ta réponse initiale en 4 parties claires avec des titres :",
        "1. Synthèse des enjeux (Quel est le statut et le cœur du problème ?)",
        "2. Les Failles et Risques (Quelles sont nos faiblesses ou celles de la partie adverse trouvées dans les pièces ?)",
        "3. La Stratégie GAGNANTE (Sur quoi doit-on jouer ? Quels arguments utiliser ?)",
        "4. Base Légale (Sur quels articles de loi ou principes s'appuyer ? Utilise 'searchJurisprudence' pour ça)",
        "Si l'utilisateur pose une question de suivi, réponds naturellement en gardant ton rôle d'avocat."
    })
    String analyzeStrategy(@dev.langchain4j.service.MemoryId String sessionId, @dev.langchain4j.service.UserMessage String userMessage);
}

package com.avo.ai;

import com.avo.entities.AiConfiguration;
import com.avo.entities.Document;
import com.avo.entities.DocumentType;
import com.avo.entities.Dossier;
import com.avo.repositories.AiConfigurationRepository;
import com.avo.repositories.DocumentRepository;
import com.avo.service.AiConfigurationService;
import com.avo.service.ai.Prompts;
import com.avo.service.ai.RAGDocumentService;
import com.avo.services.MinioService;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaEmbeddingOptions;
import org.springframework.ai.vectorstore.qdrant.QdrantVectorStore;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Test de bout en bout du code IA contre Ollama + Qdrant locaux (MySQL et MinIO simulés).
 * Désactivé par défaut. Pour le lancer (Ollama avec nomic-embed-text et qwen2.5:7b, Qdrant sur 6334) :
 * <pre>$env:AI_SMOKE_TEST="true"; mvn test -Dtest=SpringAiLocalSmokeTest</pre>
 * Utilise une collection Qdrant de test, supprimée à la fin.
 */
@org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named = "AI_SMOKE_TEST", matches = "true")
class SpringAiLocalSmokeTest {

    private static final String COLLECTION = "avo_springai_smoke_test";

    static class FakeTools {
        boolean appele;

        @org.springframework.ai.tool.annotation.Tool(description = "Recherche un client par nom. Retourne son ID et son statut AML.")
        public String searchClients(String searchTerm) {
            appele = true;
            return "- Client ID: 42, Nom: " + searchTerm + ", Statut AML: VALIDÉ";
        }
    }

    @Test
    void toolCallingEtMemoire() {
        AiConfiguration config = new AiConfiguration();
        config.setProvider("OLLAMA");
        config.setModelName("qwen2.5:7b");
        config.setBaseUrl("http://127.0.0.1:11434");
        config.setTemperature(0.1);
        config.setIsActive(true);
        AiConfigurationRepository configRepo = mock(AiConfigurationRepository.class);
        when(configRepo.findByIsActiveTrue()).thenReturn(Optional.of(config));
        var model = new AiConfigurationService(configRepo).buildChatModel();

        var memory = org.springframework.ai.chat.memory.MessageWindowChatMemory.builder().maxMessages(20).build();
        FakeTools tools = new FakeTools();
        String system = new Prompts().render("assistant-system");

        String r1 = ChatClient.create(model).prompt().system(system)
                .user("Quel est le statut AML du client Dupont ?").tools(tools)
                .advisors(org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor.builder(memory).build())
                .advisors(a -> a.param(org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID, "u:s1"))
                .call().content();
        System.out.println("SMOKE tool appelé = " + tools.appele + " | réponse 1 = " + r1);

        String r2 = ChatClient.create(model).prompt().system(system)
                .user("Rappelle-moi le nom du client dont on vient de parler, en un mot.")
                .advisors(org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor.builder(memory).build())
                .advisors(a -> a.param(org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID, "u:s1"))
                .call().content();
        System.out.println("SMOKE réponse 2 (mémoire) = " + r2);

        assertTrue(tools.appele, "Le modèle doit appeler l'outil searchClients");
        assertTrue(r2.toLowerCase().contains("dupont"), "La mémoire doit garder le nom du client");
    }

    @Test
    void ragEtChatContreOllamaEtQdrantLocaux() throws Exception {
        // --- Configuration active simulée (provider OLLAMA, qwen2.5:7b)
        AiConfiguration config = new AiConfiguration();
        config.setProvider("OLLAMA");
        config.setModelName("qwen2.5:7b");
        config.setBaseUrl("http://127.0.0.1:11434");
        config.setTemperature(0.1);
        config.setTimeoutMinutes(5);
        config.setIsActive(true);
        AiConfigurationRepository configRepo = mock(AiConfigurationRepository.class);
        when(configRepo.findByIsActiveTrue()).thenReturn(Optional.of(config));
        AiConfigurationService aiConfig = new AiConfigurationService(configRepo);

        // --- VectorStore réel : embeddings Ollama + Qdrant gRPC
        OllamaEmbeddingModel embeddingModel = OllamaEmbeddingModel.builder()
                .ollamaApi(OllamaApi.builder().baseUrl("http://127.0.0.1:11434").build())
                .defaultOptions(OllamaEmbeddingOptions.builder().model("nomic-embed-text").build())
                .build();
        QdrantClient qdrant = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
        QdrantVectorStore store = QdrantVectorStore.builder(qdrant, embeddingModel)
                .collectionName(COLLECTION).initializeSchema(true).build();
        store.afterPropertiesSet();

        try {
            // --- Document simulé (dossier 999001), contenu servi par un MinIO simulé
            Dossier dossier = new Dossier();
            dossier.setId(999001L);
            dossier.setTitre("Dossier test vente immobilière");
            Document doc = new Document();
            doc.setId(888001L);
            doc.setNomFichier("contrat_test.txt");
            doc.setTypeDocument(DocumentType.DOSSIER);
            doc.setMinioObjectId("test-object");
            doc.setDossier(dossier);
            String contenu = "CONTRAT DE VENTE. Le vendeur garantit l'absence de vices cachés. "
                    + "La toiture présente des infiltrations d'eau constatées par l'expert le 12 mars. "
                    + "Le prix de vente est fixé à 350 000 euros, payable à la signature de l'acte authentique.";

            DocumentRepository docRepo = mock(DocumentRepository.class);
            when(docRepo.findById(888001L)).thenReturn(Optional.of(doc));
            MinioService minio = mock(MinioService.class);
            when(minio.getFileStream("test-object"))
                    .thenAnswer(i -> new ByteArrayInputStream(contenu.getBytes(StandardCharsets.UTF_8)));

            RAGDocumentService rag = new RAGDocumentService(store, docRepo, minio, aiConfig);

            // 1. Indexation, deux fois de suite : la seconde doit remplacer la première (pas de doublons)
            rag.ingestDocumentIntoQdrantSync(888001L);
            rag.ingestDocumentIntoQdrantSync(888001L);
            long points = qdrant.countAsync(COLLECTION).get();
            System.out.println("SMOKE points après 2 indexations = " + points);

            // 2. Recherche filtrée par dossier
            var trouves = rag.searchInDossier(999001L, "problème de toiture et infiltrations");
            System.out.println("SMOKE passages trouvés = " + trouves.size());
            trouves.forEach(p -> System.out.println("SMOKE  - " + p.getMetadata().get("nom_fichier") + " | "
                    + p.getText().substring(0, Math.min(80, p.getText().length()))));
            assertFalse(trouves.isEmpty(), "La recherche dans le dossier doit trouver le passage");
            assertTrue(rag.searchInDossier(424242L, "toiture").isEmpty(), "Un autre dossier ne doit rien trouver");

            // 3. Suppression du document
            rag.removeDocumentFromQdrant(888001L);
            long apresSuppression = qdrant.countAsync(COLLECTION).get();
            System.out.println("SMOKE points après suppression = " + apresSuppression);
            assertEquals(0, apresSuppression);

            // 4. Prompt depuis fichier + streaming avec le modèle construit depuis la config
            String prompt = new Prompts().render("resume", "texte", contenu);
            assertFalse(prompt.contains("{{"), "Toutes les variables du prompt doivent être remplacées");
            StringBuilder streamed = new StringBuilder();
            ChatClient.create(aiConfig.buildChatModel()).prompt()
                    .user("Réponds en une seule phrase courte : " + prompt)
                    .stream().content().doOnNext(streamed::append).blockLast();
            System.out.println("SMOKE réponse streamée (" + streamed.length() + " car.) = " + streamed);
            assertTrue(streamed.length() > 10, "Le modèle doit répondre en streaming");
        } finally {
            qdrant.deleteCollectionAsync(COLLECTION).get();
            qdrant.close();
        }
    }
}

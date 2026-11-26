package com.avo.services.conflict;

import com.avo.dtos.conflict.ConflictCheckDTOs.*;
import com.avo.entities.*;
import com.avo.events.MatterActionEvent;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.ConflictCheckRepository;
import com.avo.repositories.DossierRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Moteur de vérification déontologique des conflits d'intérêts :
 * - Client <-> Adversaire direct (CRITICAL)
 * - Identifiants uniques partagés : email, CIN, RC, NIF (CRITICAL)
 * - Dirigeant / Représentant légal d'une société cliente (HIGH)
 * - UBO (Bénéficiaire effectif) partagé ou opposé (HIGH)
 * - Présence comme partie dans un autre dossier du cabinet (HIGH)
 * - Homonymie / nom proche normalisé + Levenshtein (MEDIUM)
 */
@Service
@Slf4j
public class ConflictCheckService {

    private static final Set<String> LEGAL_STOPWORDS = Set.of(
            "sarl", "sas", "sasu", "sa", "sci", "eurl", "snc", "selarl", "scp", "sca",
            "inc", "ltd", "llc", "gmbh", "ag", "bv", "nv", "asbl", "association", "societe", "ste", "et", "de", "du", "la", "le", "les"
    );

    private final ClientRepository clientRepository;
    private final DossierRepository dossierRepository;
    private final ConflictCheckRepository conflictCheckRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public ConflictCheckService(ClientRepository clientRepository,
                                DossierRepository dossierRepository,
                                ConflictCheckRepository conflictCheckRepository,
                                ApplicationEventPublisher eventPublisher,
                                ObjectMapper objectMapper) {
        this.clientRepository = clientRepository;
        this.dossierRepository = dossierRepository;
        this.conflictCheckRepository = conflictCheckRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public CheckResponse checkConflicts(CheckRequest req) {
        List<ClientEntity> allClients = clientRepository.findAll();
        List<Dossier> allDossiers = dossierRepository.findAll();

        Map<Long, ClientEntity> clientById = allClients.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(ClientEntity::getId, c -> c, (a, b) -> a));

        // Index dossiers par clientId (comme client principal et comme autre partie)
        Map<Long, List<Dossier>> dossiersAsClient = new HashMap<>();
        Map<Long, List<DossierPartie>> dossiersAsPartie = new HashMap<>();
        for (Dossier d : allDossiers) {
            if (req.getDossierId() != null && Objects.equals(d.getId(), req.getDossierId())) {
                continue;
            }
            if (d.getClient() != null && d.getClient().getId() != null) {
                dossiersAsClient.computeIfAbsent(d.getClient().getId(), k -> new ArrayList<>()).add(d);
            }
            if (d.getAutresParties() != null) {
                for (DossierPartie dp : d.getAutresParties()) {
                    if (dp.getPartie() != null && dp.getPartie().getId() != null) {
                        dossiersAsPartie.computeIfAbsent(dp.getPartie().getId(), k -> new ArrayList<>()).add(dp);
                    }
                }
            }
        }

        List<Match> matches = new ArrayList<>();
        List<String> summaryItems = new ArrayList<>();

        ClientEntity mainClient = req.getClientId() != null ? clientById.get(req.getClientId()) : null;
        if (mainClient != null) {
            String mainName = safeDisplayName(mainClient);
            summaryItems.add("Client : " + mainName);
            checkSubjectAgainstCabinet(mainClient, "CLIENT", mainName, allClients, dossiersAsClient, dossiersAsPartie, matches);
        }

        if (req.getParties() != null) {
            for (PartyInput p : req.getParties()) {
                String role = p.getRole() != null ? p.getRole().toUpperCase(Locale.ROOT) : "ADVERSAIRE";
                if (p.getClientId() != null && clientById.containsKey(p.getClientId())) {
                    ClientEntity partyEntity = clientById.get(p.getClientId());
                    String partyName = safeDisplayName(partyEntity);
                    summaryItems.add(role + " : " + partyName);

                    // Même entité comme client et partie dans le même dossier
                    if (mainClient != null && Objects.equals(mainClient.getId(), partyEntity.getId())) {
                        matches.add(new Match(
                                "CRITICAL", "CLIENT_DIRECT", partyName, partyName,
                                partyEntity.getId(), null, null, null, role,
                                "Le contact « " + partyName + " » est sélectionné à la fois comme Client principal et comme " + role + " dans ce même dossier."
                        ));
                    }

                    // Conflit direct Client <-> Partie (UBO partagé ou dirigeant commun dans le même dossier)
                    if (mainClient != null && !Objects.equals(mainClient.getId(), partyEntity.getId())) {
                        checkCrossBetweenTwoEntities(mainClient, partyEntity, role, matches);
                    }

                    checkSubjectAgainstCabinet(partyEntity, role, partyName, allClients, dossiersAsClient, dossiersAsPartie, matches);
                } else if (p.getName() != null && !p.getName().isBlank()) {
                    String q = p.getName().trim();
                    summaryItems.add(role + " : " + q);
                    checkFreeText(q, role, allClients, dossiersAsClient, dossiersAsPartie, matches);
                }
            }
        }

        if (req.getFreeTextQueries() != null) {
            for (String raw : req.getFreeTextQueries()) {
                if (raw == null || raw.isBlank()) continue;
                String q = raw.trim();
                summaryItems.add("Recherche : " + q);
                checkFreeText(q, "RECHERCHE_LIBRE", allClients, dossiersAsClient, dossiersAsPartie, matches);
            }
        }

        List<Match> deduped = deduplicateAndSort(matches);
        String riskLevel = computeHighestRisk(deduped);

        CheckResponse resp = new CheckResponse();
        resp.setHasConflict(!deduped.isEmpty());
        resp.setRiskLevel(riskLevel);
        resp.setRequiresJustification("CRITICAL".equals(riskLevel) || "HIGH".equals(riskLevel));
        resp.setSearchSummary(String.join(" | ", summaryItems));
        resp.setMatches(deduped);
        return resp;
    }

    @Transactional(readOnly = true)
    public CheckResponse checkExistingDossier(Long dossierId) {
        Dossier d = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));
        CheckRequest req = new CheckRequest();
        req.setDossierId(d.getId());
        if (d.getClient() != null) {
            req.setClientId(d.getClient().getId());
        }
        if (d.getAutresParties() != null) {
            for (DossierPartie dp : d.getAutresParties()) {
                if (dp.getPartie() != null) {
                    req.getParties().add(new PartyInput(
                            dp.getPartie().getId(),
                            dp.getRole() != null ? dp.getRole().name() : "ADVERSAIRE",
                            safeDisplayName(dp.getPartie())
                    ));
                }
            }
        }
        return checkConflicts(req);
    }

    @Transactional
    public HistoryItem recordCheck(RecordRequest req) {
        String risk = req.getRiskLevel() != null ? req.getRiskLevel().toUpperCase(Locale.ROOT) : "NONE";
        String decision = req.getDecision() != null ? req.getDecision().toUpperCase(Locale.ROOT) : "CLEARED";

        if (("CRITICAL".equals(risk) || "HIGH".equals(risk))
                && "PROCEEDED_WITH_WAIVER".equals(decision)
                && (req.getJustification() == null || req.getJustification().trim().length() < 5)) {
            throw new IllegalArgumentException(
                    "Une justification écrite (au moins 5 caractères) est obligatoire pour passer outre un conflit de niveau " + risk + ".");
        }

        ConflictCheck entity = new ConflictCheck();
        entity.setDossierId(req.getDossierId());
        entity.setCheckedBy(getCurrentUsername());
        entity.setCheckedAt(LocalDateTime.now());
        entity.setSearchSummary(truncate(req.getSearchSummary(), 990));
        entity.setRiskLevel(risk);
        entity.setMatchesCount(req.getMatches() != null ? req.getMatches().size() : 0);
        entity.setDecision(decision);
        entity.setJustification(req.getJustification() != null ? req.getJustification().trim() : null);
        try {
            entity.setMatchesJson(objectMapper.writeValueAsString(req.getMatches() != null ? req.getMatches() : List.of()));
        } catch (Exception e) {
            entity.setMatchesJson("[]");
        }

        ConflictCheck saved = conflictCheckRepository.save(entity);

        if (saved.getDossierId() != null) {
            String desc = "PROCEEDED_WITH_WAIVER".equals(decision)
                    ? "Dérogation conflit d'intérêts (" + risk + ") — Motif : " + saved.getJustification()
                    : "Contrôle conflits d'intérêts effectué (" + risk + ", " + saved.getMatchesCount() + " alerte(s))";
            eventPublisher.publishEvent(new MatterActionEvent(
                    this, saved.getDossierId(), saved.getCheckedBy(),
                    "Conformité", "Conflit d'intérêts", saved.getId(), desc));
        }

        return toHistoryItem(saved);
    }

    @Transactional(readOnly = true)
    public List<HistoryItem> getDossierHistory(Long dossierId) {
        return conflictCheckRepository.findByDossierIdOrderByCheckedAtDesc(dossierId).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    // ==================== RÈGLES DE DÉTECTION ====================

    private void checkSubjectAgainstCabinet(ClientEntity subject,
                                            String subjectRole,
                                            String subjectName,
                                            List<ClientEntity> allClients,
                                            Map<Long, List<Dossier>> dossiersAsClient,
                                            Map<Long, List<DossierPartie>> dossiersAsPartie,
                                            List<Match> matches) {
        boolean subjectIsAdverse = isAdverseRole(subjectRole);
        boolean subjectIsClient = "CLIENT".equalsIgnoreCase(subjectRole);

        // 1. Conflit direct : une partie adverse est déjà CLIENT dans un autre dossier du cabinet
        if (subjectIsAdverse) {
            for (Dossier d : dossiersAsClient.getOrDefault(subject.getId(), List.of())) {
                matches.add(new Match(
                        "CRITICAL", "CLIENT_DIRECT", subjectName, subjectName,
                        subject.getId(), d.getId(), d.getReferenceInterne(), d.getTitre(), "CLIENT",
                        "Conflit direct : « " + subjectName + " » est déjà CLIENT principal du cabinet dans le dossier " + d.getReferenceInterne() + " (" + d.getTitre() + ")."
                ));
            }
        }

        // 2. Présence dans dossier_parties d'un autre dossier
        for (DossierPartie dp : dossiersAsPartie.getOrDefault(subject.getId(), List.of())) {
            Dossier d = dp.getDossier();
            if (d == null) continue;
            String otherRole = dp.getRole() != null ? dp.getRole().name() : "PARTIE";
            boolean criticalReverse = subjectIsClient && isAdverseRole(otherRole);
            matches.add(new Match(
                    criticalReverse ? "CRITICAL" : "HIGH",
                    criticalReverse ? "CLIENT_DIRECT" : "PARTIE_DOSSIER",
                    subjectName, subjectName,
                    subject.getId(), d.getId(), d.getReferenceInterne(), d.getTitre(), otherRole,
                    criticalReverse
                            ? "Conflit direct : votre client « " + subjectName + " » est actuellement " + otherRole + " dans le dossier " + d.getReferenceInterne() + " (" + d.getTitre() + ")."
                            : "« " + subjectName + " » intervient déjà comme " + otherRole + " dans le dossier " + d.getReferenceInterne() + " (" + d.getTitre() + ")."
            ));
        }

        // 3. Comparaison avec toutes les autres fiches (identifiants uniques, dirigeants, UBOs, homonymes)
        Set<String> subjectIds = extractIdentifiers(subject);
        Set<String> subjectPersonNames = extractPersonNames(subject);
        String subjectNormName = normalizeName(subjectName);

        for (ClientEntity other : allClients) {
            if (Objects.equals(other.getId(), subject.getId())) continue;
            String otherName = safeDisplayName(other);
            Dossier linkedDossier = findFirstLinkedDossier(other.getId(), dossiersAsClient, dossiersAsPartie);

            // 3a. Identifiants uniques partagés (email, CIN, RC, NIF)
            Set<String> otherIds = extractIdentifiers(other);
            for (String idVal : subjectIds) {
                if (otherIds.contains(idVal)) {
                    matches.add(new Match(
                            "CRITICAL", "IDENTIFIANT_UNIQUE", subjectName, otherName,
                            other.getId(),
                            linkedDossier != null ? linkedDossier.getId() : null,
                            linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                            linkedDossier != null ? linkedDossier.getTitre() : null,
                            "DOUBLON_FICHE",
                            "Identifiant identique (" + idVal + ") détecté avec la fiche « " + otherName + " »."
                    ));
                    break;
                }
            }

            // 3b. Dirigeant / Représentant légal
            if (other instanceof ClientMoral cm) {
                String repName = buildRepName(cm);
                String repNorm = normalizeName(repName);
                if (!repNorm.isBlank() && subjectPersonNames.contains(repNorm)) {
                    matches.add(new Match(
                            "HIGH", "DIRIGEANT", subjectName, otherName,
                            other.getId(),
                            linkedDossier != null ? linkedDossier.getId() : null,
                            linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                            linkedDossier != null ? linkedDossier.getTitre() : null,
                            "DIRIGEANT",
                            "« " + subjectName + " » correspond au représentant légal (" + repName + ") de la société « " + otherName + " »."
                    ));
                }

                // 3c. UBO (bénéficiaire effectif)
                if (cm.getUbos() != null) {
                    for (UBO ubo : cm.getUbos()) {
                        String uboNorm = normalizeName(ubo.getFullName());
                        if (!uboNorm.isBlank() && subjectPersonNames.contains(uboNorm)) {
                            matches.add(new Match(
                                    "HIGH", "UBO", subjectName, otherName,
                                    other.getId(),
                                    linkedDossier != null ? linkedDossier.getId() : null,
                                    linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                                    linkedDossier != null ? linkedDossier.getTitre() : null,
                                    "UBO",
                                    "« " + subjectName + " » correspond au bénéficiaire effectif (UBO : " + ubo.getFullName() + ") de « " + otherName + " »."
                            ));
                        }
                    }
                }
            }

            // Inverse : si subject est une société, vérifier si son dirigeant ou un de ses UBO est une personne physique du cabinet
            if (subject instanceof ClientMoral subjectCm && other instanceof ClientPersonnePhysique) {
                String otherNorm = normalizeName(otherName);
                String repName = buildRepName(subjectCm);
                if (!otherNorm.isBlank() && otherNorm.equals(normalizeName(repName))) {
                    matches.add(new Match(
                            "HIGH", "DIRIGEANT", subjectName, otherName,
                            other.getId(),
                            linkedDossier != null ? linkedDossier.getId() : null,
                            linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                            linkedDossier != null ? linkedDossier.getTitre() : null,
                            "DIRIGEANT",
                            "Le représentant légal de « " + subjectName + " » (" + repName + ") est enregistré au cabinet comme « " + otherName + " »."
                    ));
                }
                if (subjectCm.getUbos() != null) {
                    for (UBO ubo : subjectCm.getUbos()) {
                        if (!otherNorm.isBlank() && otherNorm.equals(normalizeName(ubo.getFullName()))) {
                            matches.add(new Match(
                                    "HIGH", "UBO", subjectName, otherName,
                                    other.getId(),
                                    linkedDossier != null ? linkedDossier.getId() : null,
                                    linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                                    linkedDossier != null ? linkedDossier.getTitre() : null,
                                    "UBO",
                                    "L'UBO de « " + subjectName + " » (" + ubo.getFullName() + ") correspond au contact « " + otherName + " »."
                            ));
                        }
                    }
                }
            }

            // 3d. Homonymie / Nom proche (uniquement si pas déjà signalé comme identifiant unique)
            String otherNormName = normalizeName(otherName);
            if (isFuzzyNameMatch(subjectNormName, otherNormName)) {
                matches.add(new Match(
                        "MEDIUM", "HOMONYME", subjectName, otherName,
                        other.getId(),
                        linkedDossier != null ? linkedDossier.getId() : null,
                        linkedDossier != null ? linkedDossier.getReferenceInterne() : null,
                        linkedDossier != null ? linkedDossier.getTitre() : null,
                        "HOMONYME",
                        "Nom très proche détecté : « " + subjectName + " » ressemble à « " + otherName + " » (vérifier s'il s'agit de la même personne ou du même groupe)."
                ));
            }
        }
    }

    private void checkCrossBetweenTwoEntities(ClientEntity mainClient, ClientEntity party, String partyRole, List<Match> matches) {
        Set<String> mainPeople = extractPersonNames(mainClient);
        Set<String> partyPeople = extractPersonNames(party);
        for (String person : mainPeople) {
            if (partyPeople.contains(person)) {
                matches.add(new Match(
                        "HIGH", "UBO", safeDisplayName(party), safeDisplayName(mainClient),
                        mainClient.getId(), null, null, null, partyRole,
                        "Lien commun détecté entre votre client « " + safeDisplayName(mainClient) + " » et " + partyRole
                                + " « " + safeDisplayName(party) + " » (dirigeant ou UBO commun : " + person + ")."
                ));
            }
        }
    }

    private void checkFreeText(String query,
                               String contextRole,
                               List<ClientEntity> allClients,
                               Map<Long, List<Dossier>> dossiersAsClient,
                               Map<Long, List<DossierPartie>> dossiersAsPartie,
                               List<Match> matches) {
        String normQ = normalizeName(query);
        String rawLower = query.trim().toLowerCase(Locale.ROOT);
        if (normQ.length() < 2 && rawLower.length() < 3) return;

        for (ClientEntity c : allClients) {
            String cName = safeDisplayName(c);
            String cNorm = normalizeName(cName);
            List<Dossier> asClientList = dossiersAsClient.getOrDefault(c.getId(), List.of());
            List<DossierPartie> asPartieList = dossiersAsPartie.getOrDefault(c.getId(), List.of());
            Dossier firstDossier = findFirstLinkedDossier(c.getId(), dossiersAsClient, dossiersAsPartie);

            // 1. Match sur identifiants (email, RC, NIF, CIN)
            for (String idVal : extractIdentifiers(c)) {
                if (idVal.equalsIgnoreCase(rawLower) || idVal.contains(rawLower)) {
                    matches.add(new Match(
                            !asClientList.isEmpty() ? "CRITICAL" : "HIGH",
                            "IDENTIFIANT_UNIQUE", query, cName, c.getId(),
                            firstDossier != null ? firstDossier.getId() : null,
                            firstDossier != null ? firstDossier.getReferenceInterne() : null,
                            firstDossier != null ? firstDossier.getTitre() : null,
                            !asClientList.isEmpty() ? "CLIENT" : "CONTACT",
                            "La recherche « " + query + " » correspond à l'identifiant (" + idVal + ") de « " + cName + " »."
                    ));
                }
            }

            // 2. Match exact ou proche sur le nom / raison sociale
            boolean exactOrContains = !normQ.isBlank() && (cNorm.equals(normQ) || (normQ.length() >= 4 && cNorm.contains(normQ)));
            boolean fuzzy = !exactOrContains && isFuzzyNameMatch(normQ, cNorm);
            if (exactOrContains || fuzzy) {
                if (!asClientList.isEmpty()) {
                    for (Dossier d : asClientList) {
                        matches.add(new Match(
                                exactOrContains ? "CRITICAL" : "MEDIUM",
                                exactOrContains ? "CLIENT_DIRECT" : "HOMONYME",
                                query, cName, c.getId(), d.getId(), d.getReferenceInterne(), d.getTitre(), "CLIENT",
                                (exactOrContains ? "Correspondance directe : " : "Nom proche : ")
                                        + "« " + cName + " » est CLIENT du cabinet dans le dossier " + d.getReferenceInterne() + " (" + d.getTitre() + ")."
                        ));
                    }
                } else if (!asPartieList.isEmpty()) {
                    for (DossierPartie dp : asPartieList) {
                        Dossier d = dp.getDossier();
                        if (d == null) continue;
                        String r = dp.getRole() != null ? dp.getRole().name() : "PARTIE";
                        matches.add(new Match(
                                exactOrContains ? "HIGH" : "MEDIUM",
                                exactOrContains ? "PARTIE_DOSSIER" : "HOMONYME",
                                query, cName, c.getId(), d.getId(), d.getReferenceInterne(), d.getTitre(), r,
                                "« " + cName + " » apparaît comme " + r + " dans le dossier " + d.getReferenceInterne() + " (" + d.getTitre() + ")."
                        ));
                    }
                } else {
                    matches.add(new Match(
                            exactOrContains ? "HIGH" : "MEDIUM",
                            exactOrContains ? "CLIENT_DIRECT" : "HOMONYME",
                            query, cName, c.getId(), null, null, null, "CLIENT",
                            "« " + cName + " » existe déjà dans la base clients/contacts du cabinet."
                    ));
                }
            }

            // 3. Match sur Dirigeant & UBO d'une ClientMoral
            if (c instanceof ClientMoral cm) {
                String repName = buildRepName(cm);
                String repNorm = normalizeName(repName);
                if (!repNorm.isBlank() && (repNorm.contains(normQ) || isFuzzyNameMatch(normQ, repNorm))) {
                    matches.add(new Match(
                            "HIGH", "DIRIGEANT", query, cName, c.getId(),
                            firstDossier != null ? firstDossier.getId() : null,
                            firstDossier != null ? firstDossier.getReferenceInterne() : null,
                            firstDossier != null ? firstDossier.getTitre() : null,
                            "DIRIGEANT",
                            "« " + query + " » correspond au représentant légal (" + repName + ") de « " + cName + " »."
                    ));
                }
                if (cm.getUbos() != null) {
                    for (UBO ubo : cm.getUbos()) {
                        String uboNorm = normalizeName(ubo.getFullName());
                        if (!uboNorm.isBlank() && (uboNorm.contains(normQ) || isFuzzyNameMatch(normQ, uboNorm))) {
                            matches.add(new Match(
                                    "HIGH", "UBO", query, cName, c.getId(),
                                    firstDossier != null ? firstDossier.getId() : null,
                                    firstDossier != null ? firstDossier.getReferenceInterne() : null,
                                    firstDossier != null ? firstDossier.getTitre() : null,
                                    "UBO",
                                    "« " + query + " » correspond à un bénéficiaire effectif (UBO : " + ubo.getFullName() + ") de « " + cName + " »."
                            ));
                        }
                    }
                }
            }
        }
    }

    // ==================== HELPERS ====================

    private Dossier findFirstLinkedDossier(Long clientId, Map<Long, List<Dossier>> asClient, Map<Long, List<DossierPartie>> asPartie) {
        List<Dossier> cl = asClient.get(clientId);
        if (cl != null && !cl.isEmpty()) return cl.get(0);
        List<DossierPartie> pl = asPartie.get(clientId);
        if (pl != null && !pl.isEmpty()) return pl.get(0).getDossier();
        return null;
    }

    private Set<String> extractIdentifiers(ClientEntity c) {
        Set<String> ids = new HashSet<>();
        addNormId(ids, c.getEmail());
        if (c instanceof ClientPersonnePhysique pp) {
            addNormId(ids, pp.getCin());
        } else if (c instanceof ClientMoral cm) {
            addNormId(ids, cm.getNumeroRegistreCommerce());
            addNormId(ids, cm.getNumeroIdFiscal());
            addNormId(ids, cm.getCinRepresentantLegal());
        }
        return ids;
    }

    private void addNormId(Set<String> set, String val) {
        if (val != null && val.trim().length() >= 4) {
            set.add(val.trim().toLowerCase(Locale.ROOT));
        }
    }

    private Set<String> extractPersonNames(ClientEntity c) {
        Set<String> names = new HashSet<>();
        if (c instanceof ClientPersonnePhysique pp) {
            String full = normalizeName(safeDisplayName(pp));
            if (!full.isBlank()) names.add(full);
            String rev = normalizeName((pp.getPrenom() != null ? pp.getPrenom() : "") + " " + (pp.getNom() != null ? pp.getNom() : ""));
            if (!rev.isBlank()) names.add(rev);
        } else if (c instanceof ClientMoral cm) {
            String rep = normalizeName(buildRepName(cm));
            if (!rep.isBlank()) names.add(rep);
            String repRev = normalizeName((cm.getPrenomRepresentantLegal() != null ? cm.getPrenomRepresentantLegal() : "")
                    + " " + (cm.getNomRepresentantLegal() != null ? cm.getNomRepresentantLegal() : ""));
            if (!repRev.isBlank()) names.add(repRev);
            if (cm.getUbos() != null) {
                for (UBO u : cm.getUbos()) {
                    String uNorm = normalizeName(u.getFullName());
                    if (!uNorm.isBlank()) names.add(uNorm);
                }
            }
        }
        return names;
    }

    private String buildRepName(ClientMoral cm) {
        String nom = cm.getNomRepresentantLegal() != null ? cm.getNomRepresentantLegal().trim() : "";
        String prenom = cm.getPrenomRepresentantLegal() != null ? cm.getPrenomRepresentantLegal().trim() : "";
        return (nom + " " + prenom).trim();
    }

    private String safeDisplayName(ClientEntity c) {
        String name = c.getDisplayName();
        if (name != null && !name.isBlank()) return name.trim();
        return c.getEmail() != null ? c.getEmail() : "Contact #" + c.getId();
    }

    private boolean isAdverseRole(String role) {
        if (role == null) return false;
        String r = role.toUpperCase(Locale.ROOT);
        return r.contains("ADVERSAIRE") || r.contains("AVOCAT_ADVERSE");
    }

    static String normalizeName(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String decomposed = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ");
        String[] tokens = decomposed.trim().split("\\s+");
        List<String> filtered = new ArrayList<>();
        for (String t : tokens) {
            if (t.length() >= 2 && !LEGAL_STOPWORDS.contains(t)) {
                filtered.add(t);
            }
        }
        Collections.sort(filtered);
        return String.join(" ", filtered);
    }

    static boolean isFuzzyNameMatch(String a, String b) {
        if (a == null || b == null || a.length() < 4 || b.length() < 4) return false;
        if (a.equals(b)) return true;
        if (Math.abs(a.length() - b.length()) > 2) return false;
        int dist = levenshtein(a, b);
        int maxDist = a.length() >= 8 ? 2 : 1;
        return dist <= maxDist;
    }

    private static int levenshtein(String s1, String s2) {
        int[] prev = new int[s2.length() + 1];
        int[] curr = new int[s2.length() + 1];
        for (int j = 0; j <= s2.length(); j++) prev[j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[s2.length()];
    }

    private List<Match> deduplicateAndSort(List<Match> raw) {
        Map<String, Match> byKey = new LinkedHashMap<>();
        for (Match m : raw) {
            String key = m.getMatchType() + "|" + m.getMatchedClientId() + "|" + m.getMatchedDossierId() + "|" + m.getMatchedRole();
            Match existing = byKey.get(key);
            if (existing == null || severityRank(m.getSeverity()) < severityRank(existing.getSeverity())) {
                byKey.put(key, m);
            }
        }
        return byKey.values().stream()
                .sorted(Comparator.comparingInt(m -> severityRank(m.getSeverity())))
                .toList();
    }

    private String computeHighestRisk(List<Match> matches) {
        if (matches.isEmpty()) return "NONE";
        int best = matches.stream().mapToInt(m -> severityRank(m.getSeverity())).min().orElse(99);
        return switch (best) {
            case 0 -> "CRITICAL";
            case 1 -> "HIGH";
            case 2 -> "MEDIUM";
            default -> "NONE";
        };
    }

    private int severityRank(String sev) {
        if ("CRITICAL".equalsIgnoreCase(sev)) return 0;
        if ("HIGH".equalsIgnoreCase(sev)) return 1;
        if ("MEDIUM".equalsIgnoreCase(sev)) return 2;
        return 3;
    }

    private HistoryItem toHistoryItem(ConflictCheck e) {
        HistoryItem item = new HistoryItem();
        item.setId(e.getId());
        item.setDossierId(e.getDossierId());
        item.setCheckedBy(e.getCheckedBy());
        item.setCheckedAt(e.getCheckedAt());
        item.setSearchSummary(e.getSearchSummary());
        item.setRiskLevel(e.getRiskLevel());
        item.setMatchesCount(e.getMatchesCount());
        item.setDecision(e.getDecision());
        item.setJustification(e.getJustification());
        if (e.getMatchesJson() != null && !e.getMatchesJson().isBlank()) {
            try {
                item.setMatches(objectMapper.readValue(e.getMatchesJson(), new TypeReference<>() {}));
            } catch (Exception ignored) {}
        }
        return item;
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "dev-user";
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}

# -*- coding: utf-8 -*-
import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class AMLGuidePDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(15, 18, 15)
        
        # Charger les polices Unicode Windows
        self.add_font("ArialCustom", "", "C:/Windows/Fonts/arial.ttf")
        self.add_font("ArialCustom", "B", "C:/Windows/Fonts/arialbd.ttf")
        self.add_font("ArialCustom", "I", "C:/Windows/Fonts/ariali.ttf")
        self.add_font("ConsolasCustom", "", "C:/Windows/Fonts/consola.ttf")
        self.add_font("ConsolasCustom", "B", "C:/Windows/Fonts/consolab.ttf")

    def header(self):
        if self.page_no() == 1:
            return  # Première page (Couverture)
        
        # En-tête sur les pages suivantes
        self.set_font("ArialCustom", "B", 8)
        self.set_text_color(100, 116, 139) # Slate 500
        self.cell(115, 6, "AVO-MAÎTRISE | GUIDE TECHNIQUE : GESTION DES VRAIS & FAUX POSITIFS AML", align='L')
        self.cell(65, 6, "CONFORMITÉ LCB-FT & GAFI", align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(226, 232, 240) # Slate 200
        self.set_line_width(0.3)
        self.line(15, self.get_y() + 1, 195, self.get_y() + 1)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(2)
        self.set_font("ArialCustom", "", 8)
        self.set_text_color(148, 163, 184) # Slate 400
        self.cell(90, 6, "© 2026 - Avo-Maîtrise • Guide Méthodologique AML / KYC", align='L')
        self.cell(90, 6, f"Page {self.page_no()} / {{nb}}", align='R')

    def chapter_title(self, num_str, label):
        self.set_font("ArialCustom", "B", 11.5)
        self.set_text_color(15, 23, 42) # Slate 900
        self.set_fill_color(241, 245, 249) # Slate 100
        self.cell(180, 8, f"  {num_str}. {label}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(2, 132, 199) # Sky 600
        self.set_line_width(0.8)
        self.line(15, self.get_y(), 60, self.get_y())
        self.ln(3.5)

    def section_subtitle(self, label):
        self.set_font("ArialCustom", "B", 9.5)
        self.set_text_color(2, 132, 199) # Primary Sky Blue
        self.cell(0, 5, label, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def code_box(self, code_text):
        self.set_font("ConsolasCustom", "", 7.5)
        self.set_fill_color(15, 23, 42) # Dark Slate 900
        self.set_text_color(226, 232, 240) # Light text
        lines = code_text.strip().split('\n')
        
        box_h = len(lines) * 3.7 + 4
        
        if self.get_y() + box_h > self.page_break_trigger:
            self.add_page()
            
        x = self.get_x()
        y = self.get_y()
        self.rect(x, y, 180, box_h, 'F')
        self.set_xy(x + 3, y + 2)
        
        for line in lines:
            self.cell(174, 3.7, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_x(x + 3)
            
        self.set_y(y + box_h + 3)
        self.set_text_color(30, 41, 59)


def generate_guide_pdf():
    pdf = AMLGuidePDF()
    pdf.alias_nb_pages()
    
    # -------------------------------------------------------------
    # PAGE 1 : COUVERTURE DU GUIDE MÉTHODOLOGIQUE
    # -------------------------------------------------------------
    pdf.add_page()
    
    # Header Banner Dark Slate
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 85, 'F')
    
    # Accent Line Cyan / Electric Blue
    pdf.set_fill_color(6, 182, 212)
    pdf.rect(0, 85, 210, 3, 'F')
    
    pdf.set_xy(15, 18)
    pdf.set_font("ArialCustom", "B", 10)
    pdf.set_text_color(6, 182, 212)
    pdf.cell(0, 6, "GUIDE TECHNIQUE & RÉGLEMENTAIRE LCB-FT (AML / KYC)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(3)
    pdf.set_font("ArialCustom", "B", 17)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 8, "GESTION DES VRAIS & FAUX POSITIFS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 8, "DANS LE SCREENING DES SANCTIONS & PPE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(3)
    pdf.set_font("ArialCustom", "", 9.5)
    pdf.set_text_color(203, 213, 225)
    pdf.cell(0, 6, "Mécanismes de Triage, Qualification, Whitelist Conditionnelle & Rescreening Continu", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # Cartouche Métadonnées
    pdf.set_y(96)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(15, 95, 180, 48, 'DF')
    
    pdf.set_xy(20, 98)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "APPLICATION :")
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "AVO-MAÎTRISE (ERP Avocats & Moteur AML Yente / OpenSanctions)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "OBJECTIF MÉTIER :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "Zéro risque réglementaire (Sanctions) & Élimination de la fatigue d'alerte", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "NORMES DE RÉFÉRENCE :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "Recommandations GAFI (FATF), 5e/6e Directives UE, Déontologie Avocat", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "COMPOSANTS CLÉS :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "YenteClientVerificationJob, ScreeningMatchService, MatchAnalysisModal", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Box Synthèse Problématique
    pdf.set_y(150)
    pdf.set_fill_color(240, 249, 255) # Light sky blue
    pdf.set_draw_color(186, 230, 253)
    pdf.rect(15, 150, 180, 27, 'DF')
    
    pdf.set_xy(20, 153)
    pdf.set_font("ArialCustom", "B", 10.5)
    pdf.set_text_color(3, 105, 161)
    pdf.cell(0, 5, "LE DÉFI : LA GESTION DES 90% À 95% DE FAUX POSITIFS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(170, 3.8, "Dans les moteurs de screening sémantique (Fuzzy Matching), la majorité des alertes provient d'homonymies ou de translittérations proches. Ce guide définit comment qualifier rigoureusement les alertes, archiver les faux positifs avec justification légale, éviter la ré-alerte quotidienne inutile, et appliquer le blocage strict sur les vrais positifs.")

    # Synthèse des 3 Voies de Traitement
    pdf.set_y(183)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5.5, "LES 3 VOIES DE QUALIFICATION EN AML", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)

    categories = [
        ("1. FAUX POSITIF (False Positive)", "green", "Homonymie ou données discordantes (âge, nationalité, SIREN). Levée de doute motivée, déblocage du client (AML_VALIDATED) et mise en whitelist conditionnelle."),
        ("2. VRAI POSITIF - SANCTION (True Positive)", "red", "Match avéré sur liste de sanctions ou gel des avoirs (ONU, UE, OFAC). Blocage immédiat (BLOCKED), gel des fonds CARPA et préparation déclaration TRACFIN."),
        ("3. VRAI POSITIF - PPE / RISQUE ÉLEVÉ", "amber", "Personne Politiquement Exposée (PPE) ou risque sectoriel. Pas de blocage automatique, mais passage en Vigilance Renforcée (INDULGENCE_REQUIRED) avec accord de l'associé."),
    ]

    for cat_title, color, cat_desc in categories:
        pdf.set_fill_color(248, 250, 252)
        pdf.rect(15, pdf.get_y(), 180, 14, 'F')
        pdf.set_x(18)
        pdf.set_font("ArialCustom", "B", 8)
        
        if color == 'green':
            pdf.set_text_color(21, 128, 61)
        elif color == 'red':
            pdf.set_text_color(185, 28, 28)
        else:
            pdf.set_text_color(180, 83, 9)
            
        pdf.cell(174, 4.5, cat_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_x(18)
        pdf.set_font("ArialCustom", "", 7.5)
        pdf.set_text_color(71, 85, 105)
        pdf.multi_cell(174, 3.6, cat_desc)
        pdf.ln(2.5)

    # -------------------------------------------------------------
    # PAGE 2 : PROCÉDURE DE GESTION DES FAUX POSITIFS & RESCREENING
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("1", "PROCÉDURE DE TRAITEMENT DES FAUX POSITIFS (FALSE POSITIVES)")

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(180, 3.8, "Un Faux Positif survient lorsqu'un client légitime présente un nom similaire ou identique à une personne figurant sur une liste de sanctions ou de surveillance, mais que des éléments probants démontrent formellement qu'il ne s'agit pas du même individu.")
    pdf.ln(2)

    pdf.section_subtitle("A. Méthodologie de Levée de Doute (Comparaison Multi-Critères)")
    pdf.multi_cell(180, 3.8, "L'avocat ou le responsable de conformité doit effectuer une comparaison systématique selon la grille de critères suivante :")
    pdf.ln(1)

    # Table de comparaison multi-critères
    pdf.set_font("ArialCustom", "B", 7.5)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(38, 5, "CRITÈRE FACTUEL", 1, 0, 'L', True)
    pdf.cell(66, 5, "DONNÉES CLIENT DU CABINET", 1, 0, 'L', True)
    pdf.cell(76, 5, "DONNÉES CIBLE SANCTIONNÉE (YENTE)", 1, 0, 'L', True)
    pdf.ln(5)

    criteria_rows = [
        ("Date de Naissance (DOB)", "Passeport / CIN (ex: 15/04/1988)", "Date dans la fiche sanction (ex: 1952)"),
        ("Nationalité & Résidence", "Nationalité / Domicile vérifié", "Pays d'origine ou d'activité criminelle"),
        ("Numéro d'Identification", "Numéro CIN, Passeport, RC / SIREN", "Numéro de document ou d'immatriculation ONU"),
        ("Fonction & Profession", "Dirigeant d'entreprise locale, artisan...", "Général militaire, oligarque, cartel"),
    ]

    pdf.set_font("ArialCustom", "", 7.5)
    pdf.set_text_color(30, 41, 59)
    for c1, c2, c3 in criteria_rows:
        pdf.cell(38, 4.5, c1, 1, 0, 'L')
        pdf.cell(66, 4.5, " " + c2, 1, 0, 'L')
        pdf.cell(76, 4.5, " " + c3, 1, 0, 'L')
        pdf.ln(4.5)

    pdf.ln(3)
    pdf.section_subtitle("B. Motifs Légaux de Justification Standardisés")
    pdf.multi_cell(180, 3.8, "Pour garantir la conformité en cas d'audit TRACFIN ou du Bâtonnier, la décision de faux positif doit obligatoirement être enregistrée avec une catégorie de motif normalisée :")
    pdf.ln(1)

    motifs = [
        ("DOB_MISMATCH", "Discordance prouvée sur la date de naissance (Écart d'âge confirmant qu'il ne s'agit pas de la cible)."),
        ("NATIONALITY_MISMATCH", "Nationalité ou pays de résidence formellement distincts sans lien géographique avec la cible."),
        ("LEGAL_ENTITY_DISTINCT", "Pour une personne morale : Numéro de registre de commerce / juridiction distinct de l'entité sanctionnée."),
        ("HOMONYM_VERIFIED", "Homonymie simple avérée après contrôle de la pièce d'identité officielle et du justificatif de domicile."),
    ]

    for m_code, m_desc in motifs:
        pdf.set_font("ConsolasCustom", "B", 7.5)
        pdf.set_text_color(2, 132, 199)
        pdf.cell(48, 4.5, m_code, border=0)
        pdf.set_font("ArialCustom", "", 7.5)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(132, 3.8, m_desc)
        pdf.ln(1)

    pdf.ln(2)
    pdf.section_subtitle("C. Mécanisme de Whitelist Conditionnelle & Rescreening Intelligent")
    pdf.multi_cell(180, 3.8, "Pour éviter la fatigue d'alerte, un match qualifié Faux Positif ne doit plus ré-alerter lors des jobs de vérification périodiques, SAUF si la fiche source Yente / OpenSanctions subit une modification :")
    pdf.ln(1)

    code_rescreening = """// Logique de Whitelist Conditionnelle dans YenteClientVerificationJob :
if (lastMatchOpt.isPresent()) {
    ScreeningMatch lastMatch = lastMatchOpt.get();
    
    // Si la cible a été qualifiée FALSE_POSITIVE et que la fiche source n'a PAS changé :
    if (lastMatch.getStatus() == ScreeningMatchStatus.FALSE_POSITIVE &&
        yenteUpdate != null && yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
        // Match déjà écarté et valide -> Pas d'alerte, pas de blocage (Silent Pass)
        continue;
    }
    
    // Si la fiche Yente a été mise à jour à la source (nouvel alias, nouvelle charge...) :
    if (!yenteUpdate.equals(lastMatch.getYenteLastUpdate())) {
        // Ré-évaluation obligatoire requise !
        newStatus = ScreeningMatchStatus.PENDING;
        notificationRepository.save(new Notification("Alerte Mise à jour Sanction", ...));
    }
}"""
    pdf.code_box(code_rescreening)

    # -------------------------------------------------------------
    # PAGE 3 : PROCÉDURE DE GESTION DES VRAIS POSITIFS (SANCTIONS VS PEP)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("2", "PROCÉDURE DE TRAITEMENT DES VRAIS POSITIFS (TRUE POSITIVES)")

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(180, 3.8, "Un Vrai Positif correspond à une situation où le client, son représentant légal ou l'un de ses Bénéficiaires Effectifs (UBO) est formellement identifié sur une liste de surveillance. Le traitement dépend de la nature juridique du match :")
    pdf.ln(2)

    # Cas A : Sanctions
    pdf.set_fill_color(254, 242, 242)
    pdf.set_draw_color(248, 113, 113)
    pdf.rect(15, pdf.get_y(), 180, 48, 'DF')
    pdf.set_xy(18, pdf.get_y() + 2)
    
    pdf.set_font("ArialCustom", "B", 9)
    pdf.set_text_color(153, 27, 27)
    pdf.cell(0, 5, "CAS A : VRAI POSITIF - SANCTIONS INTERNATIONALES & GEL DES AVOIRS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 7.8)
    pdf.set_text_color(127, 29, 29)
    sanction_steps = ("• Conséquence Applicative Immédiate : Le statut du client bascule à BLOCKED.\n"
                      "• Blocage Opérationnel Total : Interdiction d'émettre des factures, de créer des dossiers, de recevoir des fonds sur le compte CARPA du cabinet ou de rédiger des actes juridiques.\n"
                      "• Notification Référent LCB-FT : Alerte haute priorité envoyée immédiatement à l'Associé Gérant et au Responsable Conformité.\n"
                      "• Déclaration de Soupçon (DS) : Préparation du dossier de déclaration auprès de la cellule nationale de renseignement financier (TRACFIN en France / CRF) et information du Bâtonnier de l'Ordre conformément aux règles déontologiques.")
    pdf.multi_cell(174, 3.8, sanction_steps)
    pdf.ln(6)

    # Cas B : PEP / PPE
    pdf.set_fill_color(254, 243, 199)
    pdf.set_draw_color(245, 158, 11)
    pdf.rect(15, pdf.get_y(), 180, 52, 'DF')
    pdf.set_xy(18, pdf.get_y() + 2)
    
    pdf.set_font("ArialCustom", "B", 9)
    pdf.set_text_color(146, 64, 14)
    pdf.cell(0, 5, "CAS B : VRAI POSITIF - PERSONNES POLITIQUEMENT EXPOSÉES (PPE / PEP)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 7.8)
    pdf.set_text_color(120, 53, 15)
    pep_steps = ("• Cadre Légal : Être une PPE (ministre, parlementaire, haut magistrat, ambassadeur, dirigeant d'entreprise publique ou membre de leur famille proche) n'interdit pas l'accès à un avocat, mais impose une Vigilance Renforcée (EDD - Enhanced Due Diligence).\n"
                 "• Conséquence Applicative : Le statut client passe à INDULGENCE_REQUIRED (ou DILIGENCE_REQUIRED).\n"
                 "• Questionnaire Origine des Fonds (SOW / SOF) : Obligation de documenter l'origine du patrimoine global (Source of Wealth) et la provenance des fonds alloués à l'opération juridique (Source of Funds).\n"
                 "• Principe des 4 Yeux (Four-Eyes Principle) : L'avocat traitant soumet le dossier KYC à l'approbation formelle de l'Associé Gérant qui valide l'entrée en relation d'affaires.")
    pdf.multi_cell(174, 3.8, pep_steps)
    pdf.ln(5)

    pdf.chapter_title("3", "CYCLE DE VIE DES STATUTS DE SCREENING")

    # Tableau Matrice Statuts
    pdf.set_font("ArialCustom", "B", 7)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(32, 5, "STATUT MATCH", 1, 0, 'C', True)
    pdf.cell(48, 5, "ACTION DE L'AVOCAT", 1, 0, 'L', True)
    pdf.cell(42, 5, "STATUT CLIENT RÉSULTANT", 1, 0, 'C', True)
    pdf.cell(58, 5, "IMPACT SUR LE CABINET", 1, 0, 'L', True)
    pdf.ln(5)

    status_matrix = [
        ("PENDING", "En attente d'analyse", "VERIFICATION_AML_REQUIRED", "Dossier en pause de conformité"),
        ("FALSE_POSITIVE", "Homonymie / Discordance validée", "AML_VALIDATED -> VALIDATED", "Déblocage & Whitelist conditionnelle"),
        ("DILIGENCE_REQUIRED", "PEP / Risque élevé nécessitant enquête", "INDULGENCE_REQUIRED", "Questionnaire SOW/SOF & Validation Gérant"),
        ("TRUE_POSITIVE", "Match avéré sur liste de sanctions", "BLOCKED", "Gel complet des actes, factures et CARPA"),
        ("NO_LONGER_SANCTIONED", "Radiation de la liste de sanctions", "VALIDATED", "Rétablissement des droits avec archive"),
    ]

    pdf.set_font("ArialCustom", "", 7)
    pdf.set_text_color(30, 41, 59)
    for m_st, act, cl_st, imp in status_matrix:
        pdf.cell(32, 4.5, m_st, 1, 0, 'C')
        pdf.cell(48, 4.5, " " + act, 1, 0, 'L')
        pdf.cell(42, 4.5, cl_st, 1, 0, 'C')
        pdf.cell(58, 4.5, " " + imp, 1, 0, 'L')
        pdf.ln(4.5)

    # -------------------------------------------------------------
    # PAGE 4 : PLAN D'AMÉLIORATION TECHNIQUE & CONFORMITÉ
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("4", "RECOMMANDATIONS D'ÉVOLUTION DANS LE CODE SOURCE")

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(180, 3.8, "Pour élever le module AML d'Avo-Maîtrise au niveau des meilleures solutions RegTech du marché (Lexis Diligence, World-Check, Dow Jones Risk), 4 améliorations ciblées sont préconisées :")
    pdf.ln(2)

    evolutions = [
        ("1. Modal d'Analyse Enrichie (match-analysis-modal.html)",
         "- Ajouter une liste déroulante obligatoire de sélection du motif de Faux Positif (DOB_MISMATCH, etc.).\n- Rendre le champ 'Commentaire justificatif' obligatoire avant de pouvoir cliquer sur Valider.\n- Scinder le bouton 'True Positive' en deux choix : 'Bloquer (Sanction)' et 'Vigilance Renforcée (PPE)'."),
        
        ("2. Table d'Audit Immuable (aml_decision_audit_logs)",
         "- Créer une table dédiée contenant : match_id, client_id, decision, reason_code, comment, reviewer_username, reviewer_ip, timestamp, yente_fingerprint.\n- Cette table fournit la preuve légale incontestable lors d'un contrôle de l'Ordre des Avocats."),
        
        ("3. Génération Automatisée de la Fiche de Vigilance KYC (PDF)",
         "- La fonction ReportingService.generateClientKycAuditReport(clientId) existe déjà dans le backend.\n- L'enrichir pour inclure l'historique complet des décisions de faux positifs et les signatures électroniques des validateurs."),
        
        ("4. Rescreening Delta Automatisé",
         "- Ne pas réinterroger Yente sur l'ensemble de la base si aucune donnée client n'a été modifiée et qu'aucune mise à jour de dataset n'est survenue dans Yente.\n- Optimiser les performances du batch nocturne en traitant en priorité les clients à risque élevé."),
    ]

    for evo_title, evo_details in evolutions:
        pdf.set_font("ArialCustom", "B", 8.5)
        pdf.set_text_color(2, 132, 199)
        pdf.cell(0, 4.5, evo_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("ArialCustom", "", 7.8)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(180, 3.8, evo_details)
        pdf.ln(2)

    pdf.chapter_title("5", "CHECKLIST DU RESPONSABLE CONFORMITÉ / AVOCAT")

    checklist = [
        ("[  ] Examen Pièce d'Identité", "Vérifier la concordance exacte de la date de naissance et du nom de naissance."),
        ("[  ] Contrôle des Bénéficiaires (UBO)", "Effectuer le screening sur toute personne physique détenant > 25% du capital."),
        ("[  ] Motiver chaque Faux Positif", "Consigner obligatoirement l'élément factuel ayant permis d'écarter l'alerte."),
        ("[  ] Validation PPE par l'Associé", "Recueillir l'accord écrit de l'associé gérant pour toute personne politiquement exposée."),
        ("[  ] Conservation Légale 5 Ans", "Conserver la fiche de vigilance KYC pendant 5 ans après la clôture du dossier."),
    ]

    pdf.set_font("ArialCustom", "B", 7.5)
    pdf.set_fill_color(248, 250, 252)
    for chk, dsc in checklist:
        pdf.cell(48, 5, chk, 1, 0, 'L', True)
        pdf.set_font("ArialCustom", "", 7.5)
        pdf.cell(132, 5, " " + dsc, 1, 0, 'L', False)
        pdf.ln(5)
        pdf.set_font("ArialCustom", "B", 7.5)

    pdf.ln(3)
    # Conclusion Box
    pdf.set_fill_color(240, 253, 244)
    pdf.set_draw_color(134, 239, 172)
    pdf.rect(15, pdf.get_y(), 180, 18, 'DF')
    pdf.set_xy(18, pdf.get_y() + 2)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(22, 101, 52)
    pdf.cell(0, 4.5, "SYNTHÈSE :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 7.5)
    pdf.set_text_color(21, 128, 61)
    pdf.multi_cell(174, 3.5, "La mise en place de cette architecture garantit une protection absolue du cabinet d'avocats contre le risque pénal de blanchiment, tout en assurant aux collaborateurs un outil fluide, rapide et libéré des alertes répétitives.")

    # Sortie PDF
    output_path = r"d:\avo-maitrise\Guide_Gestion_True_False_Positifs_AML.pdf"
    pdf.output(output_path)
    print(f"AML Guide PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    generate_guide_pdf()

# -*- coding: utf-8 -*-
import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class RbacMatrixPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=15)
        self.set_margins(14, 15, 14)
        
        # Load Windows fonts
        self.add_font("ArialCustom", "", "C:/Windows/Fonts/arial.ttf")
        self.add_font("ArialCustom", "B", "C:/Windows/Fonts/arialbd.ttf")
        self.add_font("ArialCustom", "I", "C:/Windows/Fonts/ariali.ttf")
        self.add_font("ConsolasCustom", "", "C:/Windows/Fonts/consola.ttf")

    def header(self):
        if self.page_no() == 1:
            return
        
        self.set_font("ArialCustom", "B", 8)
        self.set_text_color(100, 116, 139)
        self.cell(110, 5, "SI-LÉGAL (AVO-MAÎTRISE) • MATRICE DES RÔLES & PERMISSIONS (RBAC)", align='L')
        self.cell(72, 5, "STRICTEMENT CONFIDENTIEL", align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(14, self.get_y() + 1, 196, self.get_y() + 1)
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(14, self.get_y(), 196, self.get_y())
        self.ln(2)
        self.set_font("ArialCustom", "", 7.5)
        self.set_text_color(148, 163, 184)
        self.cell(91, 5, "© 2026 SI-LÉGAL / Avo-Maîtrise • Spécification Sécurité & RBAC", align='L')
        self.cell(91, 5, f"Page {self.page_no()} / {{nb}}", align='R')

def generate_pdf():
    pdf = RbacMatrixPDF()
    pdf.alias_nb_pages()
    
    # -------------------------------------------------------------
    # PAGE 1 : EN-TÊTE + RÔLES + MATRICE (MODULES 1 & 2 & 3 & 4)
    # -------------------------------------------------------------
    pdf.add_page()
    
    # Top banner card
    pdf.set_fill_color(15, 23, 42) # Slate 900
    pdf.rect(14, 12, 182, 32, 'F')
    pdf.set_fill_color(6, 182, 212) # Cyan 500
    pdf.rect(14, 44, 182, 2, 'F')
    
    pdf.set_xy(18, 16)
    pdf.set_font("ArialCustom", "B", 8)
    pdf.set_text_color(6, 182, 212)
    pdf.cell(0, 4, "RÉFÉRENTIEL DE SÉCURITÉ APPLICATIVE & CONFORMITÉ ORDRE DES AVOCATS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 7, "MATRICE DES RÔLES & CONTRÔLE D'ACCÈS (RBAC)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(203, 213, 225)
    pdf.cell(0, 5, "Modèle de Sécurité, Cloisonnement des Données & Prévention Anti-IDOR • SI-LÉGAL", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_y(49)
    
    # Objectif Box
    pdf.set_fill_color(240, 253, 250) # Light teal
    pdf.set_draw_color(153, 246, 228)
    pdf.rect(14, 48, 182, 13, 'DF')
    pdf.set_xy(17, 50)
    pdf.set_font("ArialCustom", "B", 7.8)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 4, "OBJECTIF DE LA MATRICE :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(17)
    pdf.set_font("ArialCustom", "", 7.5)
    pdf.set_text_color(51, 65, 85)
    pdf.cell(0, 4, "Garantir le respect du secret professionnel, interdire les élévations de privilèges (IDOR) et cloisonner les droits.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # 1. Typologie des rôles
    pdf.set_y(64)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5, "1. DÉFINITION DES 6 RÔLES DU SYSTÈME", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    
    roles = [
        ("ADMIN / SUPER_ADMIN", "Gestion des comptes, reset MDP, supervision technique et sécurité.", (220, 38, 38)),
        ("ASSOCIE (Partner)", "Direction : accès intégral à tous les dossiers, CA global et validation.", (124, 58, 237)),
        ("AVOCAT (Titulaire)", "Opérationnel : gestion exclusive de ses dossiers et dossiers assignés.", (2, 132, 199)),
        ("COLLABORATEUR", "Production : travail sur dossiers assignés, saisie des temps et actes.", (5, 150, 105)),
        ("COMPLIANCE_OFFICER", "Conformité : screening sanctions/PPE, scoring risque et fiches KYC.", (217, 119, 6)),
        ("SECRETARIAT", "Support : accueil, création préliminaire et facturation préparée.", (71, 85, 105))
    ]
    
    for idx, (title, desc, color) in enumerate(roles):
        row = idx // 3
        col = idx % 3
        bx = 14 + col * 61.5
        by = 70 + row * 16
        
        pdf.set_fill_color(255, 255, 255)
        pdf.set_draw_color(226, 232, 240)
        pdf.rect(bx, by, 59, 14, 'DF')
        
        pdf.set_fill_color(*color)
        pdf.rect(bx, by, 59, 1.2, 'F')
        
        pdf.set_xy(bx + 2, by + 2.2)
        pdf.set_font("ArialCustom", "B", 7.5)
        pdf.set_text_color(*color)
        pdf.cell(55, 3.5, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        pdf.set_x(bx + 2)
        pdf.set_font("ArialCustom", "", 6.5)
        pdf.set_text_color(100, 116, 139)
        pdf.multi_cell(55, 3, desc)
        
    # 2. Matrice des droits
    pdf.set_y(106)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5, "2. MATRICE COMPLÈTE DES DROITS D'ACCÈS PAR MODULE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    
    def draw_table_header():
        pdf.set_font("ArialCustom", "B", 7)
        pdf.set_fill_color(15, 23, 42)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(56, 5, "MODULE & ACTION MÉTIER", border=1, align='L', fill=True)
        pdf.cell(21, 5, "ADMIN", border=1, align='C', fill=True)
        pdf.cell(21, 5, "ASSOCIÉ", border=1, align='C', fill=True)
        pdf.cell(21, 5, "AVOCAT", border=1, align='C', fill=True)
        pdf.cell(21, 5, "COLLAB.", border=1, align='C', fill=True)
        pdf.cell(21, 5, "COMPLIANCE", border=1, align='C', fill=True)
        pdf.cell(21, 5, "SECRÉTARIAT", border=1, align='C', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def draw_section_header(title):
        pdf.set_font("ArialCustom", "B", 7)
        pdf.set_fill_color(241, 245, 249)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(182, 4.2, f"  {title}", border=1, align='L', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def draw_row(action, p1, p2, p3, p4, p5, p6, fill=False):
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.set_font("ArialCustom", "", 7)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(56, 4.4, " " + action, border=1, align='L', fill=fill)
        
        perms = [p1, p2, p3, p4, p5, p6]
        for i, p in enumerate(perms):
            if p == "OUI":
                pdf.set_font("ArialCustom", "B", 7)
                pdf.set_text_color(22, 163, 74) # Green
            elif p == "NON":
                pdf.set_font("ArialCustom", "B", 7)
                pdf.set_text_color(220, 38, 38) # Red
            elif "Assignés" in p or "Ses" in p or "Propres" in p:
                pdf.set_font("ArialCustom", "B", 6.5)
                pdf.set_text_color(217, 119, 6) # Amber
            else:
                pdf.set_font("ArialCustom", "B", 6.5)
                pdf.set_text_color(2, 132, 199) # Blue
            
            is_last = (i == len(perms) - 1)
            if is_last:
                pdf.cell(21, 4.4, p, border=1, align='C', fill=fill, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            else:
                pdf.cell(21, 4.4, p, border=1, align='C', fill=fill)

    draw_table_header()
    
    draw_section_header("[MODULE 1] ADMINISTRATION SYSTÈME & SÉCURITÉ")
    draw_row("Création / Modification d'utilisateurs", "OUI", "NON", "NON", "NON", "NON", "NON", False)
    draw_row("Réinitialisation mot de passe & 2FA", "OUI", "NON", "NON", "NON", "NON", "NON", True)
    draw_row("Désactivation / Suppression de compte", "OUI", "NON", "NON", "NON", "NON", "NON", False)
    draw_row("Consultation des logs d'erreurs BDD", "OUI", "Audit", "NON", "NON", "Audit AML", "NON", True)
    
    draw_section_header("[MODULE 2] PROFIL CABINET & PARAMÉTRAGES")
    draw_row("Modification IBAN, SIRET, Coordonnées", "OUI", "OUI", "NON", "NON", "NON", "NON", False)
    draw_row("Gestion modèles d'actes & domaines", "OUI", "OUI", "OUI", "Lecture", "Lecture", "Lecture", True)
    
    draw_section_header("[MODULE 3] CONFORMITÉ & VIGILANCE AML / LCB-FT")
    draw_row("Lancement Screening Sanctions / PPE", "OUI", "OUI", "OUI", "OUI", "OUI", "NON", False)
    draw_row("Validation score de risque & levée alerte", "OUI", "OUI", "NON", "NON", "OUI", "NON", True)
    draw_row("Génération rapport audit Bâtonnier (PDF)", "OUI", "OUI", "OUI", "NON", "OUI", "NON", False)
    
    draw_section_header("[MODULE 4] DOSSIERS, PIÈCES & AGENDA (ANTI-IDOR)")
    draw_row("Création d'un nouveau dossier", "OUI", "OUI", "OUI", "OUI", "NON", "OUI", False)
    draw_row("Consultation pièces & actes du dossier", "Tous", "Tous", "Assignés", "Assignés", "Pièces KYC", "Pièces adm.", True)
    draw_row("Suppression définitive de documents", "OUI", "OUI", "Ses pièces", "NON", "NON", "NON", False)
    draw_row("Planning d'audiences & gestion des tâches", "Tous", "Tous", "Ses dossiers", "Ses tâches", "NON", "OUI", True)

    draw_section_header("[MODULE 5] FACTURATION & HONORAIRES")
    draw_row("Saisie des temps & prestations", "OUI", "OUI", "Ses temps", "Ses temps", "NON", "Frais/Déb.", False)
    draw_row("Émission & validation des factures", "OUI", "OUI", "Ses dossiers", "NON", "NON", "Émission", True)
    draw_row("Dashboard financier & CA global cabinet", "OUI", "OUI", "CA perso", "NON", "NON", "NON", False)

    # -------------------------------------------------------------
    # PAGE 2 : RÈGLES ANTI-IDOR + IMPLÉMENTATION SPRING BOOT
    # -------------------------------------------------------------
    pdf.add_page()
    
    pdf.set_font("ArialCustom", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5, "3. RÈGLES FONDAMENTALES DE PRÉVENTION ANTI-IDOR", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    
    rules = [
        ("Règle 1 : Cloisonnement Horizontal des Dossiers & Pièces",
         "Un identifiant direct transmis dans l'URL (ex: GET /api/dossiers/1452 ou /api/documents/890) ne suffit JAMAIS pour autoriser l'accès. Le système valide automatiquement que l'utilisateur est ADMIN/ASSOCIÉ ou expressément désigné dans la liste des intervenants du dossier."),
        
        ("Règle 2 : Étanchéité Stricte des Données Financières",
         "L'accès au Dashboard financier (/api/billing/dashboard) filtre dynamiquement les résultats : les associés visualisent le chiffre d'affaires consolidé du cabinet, tandis que les avocats collaborateurs ne visualisent que la rentabilité de leurs propres dossiers."),
        
        ("Règle 3 : Verrouillage des Actions d'Élévation de Privilèges",
         "Toute tentative de réinitialisation de mot de passe tiers, de modification d'IBAN ou d'altération de rôles sans privilèges ADMIN/ASSOCIÉ lève immédiatement une exception AccessDeniedException (HTTP 403) et enregistre l'incident dans app_error_logs.")
    ]
    
    for r_title, r_desc in rules:
        pdf.set_fill_color(248, 250, 252)
        pdf.set_draw_color(226, 232, 240)
        pdf.rect(14, pdf.get_y(), 182, 17, 'DF')
        
        pdf.set_fill_color(2, 132, 199)
        pdf.rect(14, pdf.get_y(), 2.5, 17, 'F')
        
        pdf.set_xy(18, pdf.get_y() + 2)
        pdf.set_font("ArialCustom", "B", 8)
        pdf.set_text_color(2, 132, 199)
        pdf.cell(0, 4, r_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        pdf.set_x(18)
        pdf.set_font("ArialCustom", "", 7.2)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(174, 3.4, r_desc)
        pdf.ln(2.5)
        
    pdf.ln(2)
    pdf.set_font("ArialCustom", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5, "4. DIRECTIVES D'IMPLÉMENTATION SPRING SECURITY (@PreAuthorize)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    
    code_sample = """// 1. Protection RBAC sur UserController
@PostMapping("/{id}/reset-password")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public ResponseEntity<String> resetPassword(@PathVariable Long id) { ... }

// 2. Protection Profil Cabinet (IBAN / SIRET) sur CabinetProfileController
@PutMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE')")
public ResponseEntity<CabinetProfileDTO> updateProfile(@Valid @RequestBody CabinetProfileDTO dto) { ... }

// 3. Protection Anti-IDOR sur les Pièces de Dossiers (DocumentController)
@DeleteMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE') or @securityUtils.isDocumentOwner(#id)")
public ResponseEntity<Void> deleteDocument(@PathVariable Long id) { ... }"""

    pdf.set_font("ConsolasCustom", "", 7.5)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(226, 232, 240)
    
    lines = code_sample.strip().split('\n')
    box_h = len(lines) * 3.8 + 4
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.rect(x, y, 182, box_h, 'F')
    pdf.set_xy(x + 3, y + 2)
    for l in lines:
        pdf.cell(176, 3.8, l, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_x(x + 3)
    pdf.set_y(y + box_h + 4)
    
    # Validation block
    pdf.set_fill_color(240, 253, 244)
    pdf.set_draw_color(187, 247, 208)
    pdf.rect(14, pdf.get_y(), 182, 20, 'DF')
    pdf.set_xy(18, pdf.get_y() + 2)
    pdf.set_font("ArialCustom", "B", 8)
    pdf.set_text_color(22, 101, 52)
    pdf.cell(0, 4, "ATTESTATION DE CONFORMITÉ & VALIDATION TECHNIQUE :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 7.2)
    pdf.set_text_color(21, 128, 61)
    pdf.multi_cell(174, 3.5, "L'application stricte de cette matrice élimine les failles de sécurité critiques liées aux contrôles d'accès et protège les données sensibles des clients du cabinet d'avocats conformément aux règles ordinales et au RGPD.")
    
    target_paths = [
        r"d:\avo-maitrise\Matrice_Roles_Permissions_SI_LEGAL.pdf",
        r"d:\avo-maitrise\SI_LEGAL_Matrice_Roles_Permissions.pdf"
    ]
    
    for path in target_paths:
        try:
            pdf.output(path)
            print(f"RBAC Matrix PDF successfully generated at: {path}")
        except Exception as e:
            print(f"Could not write to {path}: {e}")

if __name__ == '__main__':
    generate_pdf()


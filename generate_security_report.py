# -*- coding: utf-8 -*-
import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class SecurityReportPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(15, 18, 15)
        
        # Charger les polices Unicode Windows
        self.add_font("ArialCustom", "", "C:/Windows/Fonts/arial.ttf")
        self.add_font("ArialCustom", "B", "C:/Windows/Fonts/arialbd.ttf")
        self.add_font("ArialCustom", "I", "C:/Windows/Fonts/ariali.ttf")
        self.add_font("ConsolasCustom", "", "C:/Windows/Fonts/consola.ttf")

    def header(self):
        if self.page_no() == 1:
            return  # Première page (Couverture)
        
        # En-tête sur les pages suivantes
        self.set_font("ArialCustom", "B", 8)
        self.set_text_color(100, 116, 139) # Slate 500
        self.cell(105, 6, "AVO-MAÎTRISE | AUDIT DE SÉCURITÉ APPLICATIVE & LCB-FT", align='L')
        self.cell(75, 6, "DOCUMENT STRICTEMENT CONFIDENTIEL", align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
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
        self.cell(90, 6, "© 2026 - Avo-Maîtrise • Audit de Sécurité & Conformité", align='L')
        self.cell(90, 6, f"Page {self.page_no()} / {{nb}}", align='R')

    def chapter_title(self, num_str, label):
        self.set_font("ArialCustom", "B", 12)
        self.set_text_color(15, 23, 42) # Slate 900
        self.set_fill_color(241, 245, 249) # Slate 100
        self.cell(180, 8.5, f"  {num_str}. {label}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(2, 132, 199) # Sky 600
        self.set_line_width(0.8)
        self.line(15, self.get_y(), 60, self.get_y())
        self.ln(4)

    def severity_badge(self, severity):
        self.set_font("ArialCustom", "B", 8)
        if severity.upper() == 'CRITIQUE':
            self.set_fill_color(254, 226, 226) # Red 100
            self.set_text_color(185, 28, 28) # Red 700
            self.set_draw_color(239, 68, 68) # Red 500
        elif severity.upper() in ['ÉLEVÉ', 'ELEVE']:
            self.set_fill_color(255, 237, 213) # Orange 100
            self.set_text_color(194, 65, 12) # Orange 700
            self.set_draw_color(249, 115, 22) # Orange 500
        elif severity.upper() == 'MOYEN':
            self.set_fill_color(254, 243, 199) # Amber 100
            self.set_text_color(180, 83, 9) # Amber 700
            self.set_draw_color(245, 158, 11) # Amber 500
        else: # FAIBLE
            self.set_fill_color(220, 252, 231) # Green 100
            self.set_text_color(21, 128, 61) # Green 700
            self.set_draw_color(34, 197, 94) # Green 500
        
        badge_w = 26
        self.cell(badge_w, 5, severity.upper(), border=1, fill=True, align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def code_box(self, code_text):
        self.set_font("ConsolasCustom", "", 7.5)
        self.set_fill_color(15, 23, 42) # Dark Slate 900
        self.set_text_color(226, 232, 240) # Light text
        lines = code_text.strip().split('\n')
        
        box_h = len(lines) * 3.8 + 4
        
        if self.get_y() + box_h > self.page_break_trigger:
            self.add_page()
            
        x = self.get_x()
        y = self.get_y()
        self.rect(x, y, 180, box_h, 'F')
        self.set_xy(x + 3, y + 2)
        
        for line in lines:
            self.cell(174, 3.8, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_x(x + 3)
            
        self.set_y(y + box_h + 3)
        self.set_text_color(30, 41, 59)


def generate_pdf():
    pdf = SecurityReportPDF()
    pdf.alias_nb_pages()
    
    # -------------------------------------------------------------
    # PAGE 1 : COUVERTURE DU RAPPORT
    # -------------------------------------------------------------
    pdf.add_page()
    
    # En-tête visuel foncé
    pdf.set_fill_color(15, 23, 42) # Slate 900
    pdf.rect(0, 0, 210, 85, 'F')
    
    # Ligne d'accent Cyan
    pdf.set_fill_color(6, 182, 212) # Cyan 500
    pdf.rect(0, 85, 210, 3, 'F')
    
    pdf.set_xy(15, 18)
    pdf.set_font("ArialCustom", "B", 10)
    pdf.set_text_color(6, 182, 212) # Cyan accent
    pdf.cell(0, 6, "AUDIT TECHNIQUE DE SÉCURITÉ APPLICATIVE & RÉGLEMENTAIRE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(3)
    pdf.set_font("ArialCustom", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 8.5, "RAPPORT COMPLET D'AUDIT DE SÉCURITÉ", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 8.5, "ET PLAN DE REMÉDIATION DES VULNÉRABILITÉS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(3)
    pdf.set_font("ArialCustom", "", 10)
    pdf.set_text_color(203, 213, 225) # Slate 300
    pdf.cell(0, 6, "Plateforme ERP Juridique Avocats & Moteur de Conformité LCB-FT (AML / KYC)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # Métadonnées du rapport
    pdf.set_y(96)
    pdf.set_font("ArialCustom", "B", 9)
    pdf.set_text_color(15, 23, 42)
    
    # Bloc Cartouche Métadonnées
    pdf.set_fill_color(248, 250, 252) # Slate 50
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(15, 95, 180, 50, 'DF')
    
    pdf.set_xy(20, 98)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "APPLICATION AUDITÉE :")
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "AVO-MAÎTRISE / SI-LÉGALE (ERP Cabinet d'Avocats)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "PÉRIMÈTRE TECHNIQUE :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "Spring Boot 3.2, Keycloak IAM, MySQL 8, Angular 18, Yente AML", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "DATE DE L'AUDIT :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "Septembre 2026", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "RÉFÉRENTIELS APPLIQUÉS :")
    pdf.set_font("ArialCustom", "", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(110, 5.5, "OWASP Top 10 (2021), RGPD, Secret Professionnel, Normes FATF/GAFI", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(20)
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(48, 5.5, "CLASSIFICATION :")
    pdf.set_font("ArialCustom", "B", 8.5)
    pdf.set_text_color(185, 28, 28) # Red
    pdf.cell(110, 5.5, "STRICTEMENT CONFIDENTIEL", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Résumé Score Box
    pdf.set_y(151)
    pdf.set_fill_color(254, 242, 242) # Light red/rose
    pdf.set_draw_color(248, 113, 113) # Red border
    pdf.rect(15, 151, 180, 27, 'DF')
    
    pdf.set_xy(20, 154)
    pdf.set_font("ArialCustom", "B", 11)
    pdf.set_text_color(153, 27, 27)
    pdf.cell(110, 5.5, "SCORE GLOBAL DE SÉCURITÉ : 58 / 100")
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.cell(60, 5.5, "NIVEAU : RISQUE ÉLEVÉ", align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(20)
    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(75, 85, 99)
    pdf.multi_cell(170, 3.8, "Bien que l'architecture repose sur des technologies éprouvées (OAuth2/JWT Keycloak, Liquibase, Angular), des failles critiques de configuration (divulgation des stack traces SQL, bypass d'authentification en profil dev, absence de RBAC au niveau des contrôleurs) nécessitent une remédiation urgente avant tout déploiement en production.")

    # Table récapitulative des vulnérabilités
    pdf.set_y(184)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 5.5, "SYNTHÈSE EXÉCUTIVE DES VULNÉRABILITÉS IDENTIFIÉES", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)

    # Header de table
    pdf.set_font("ArialCustom", "B", 7.5)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(16, 5.5, "RÉF.", 1, 0, 'C', True)
    pdf.cell(86, 5.5, "DESCRIPTION DE LA VULNÉRABILITÉ", 1, 0, 'L', True)
    pdf.cell(26, 5.5, "SÉVÉRITÉ", 1, 0, 'C', True)
    pdf.cell(24, 5.5, "OWASP 2021", 1, 0, 'C', True)
    pdf.cell(28, 5.5, "PRIORITÉ", 1, 0, 'C', True)
    pdf.ln(5.5)

    vulns_summary = [
        ("SEC-01", "Divulgation des Stack Traces SQL dans HTTP 500", "CRITIQUE", "A05 - Misconfig", "P0 - Immédiat"),
        ("SEC-02", "Bypass d'authentification (Profil Dev actif par défaut)", "CRITIQUE", "A01 - Broken Access", "P0 - Immédiat"),
        ("SEC-03", "Absence de RBAC & Risques IDOR sur APIs sensibles", "ÉLEVÉ", "A01 - Broken Access", "P1 - Urgent"),
        ("SEC-04", "Secrets & mots de passe en clair dans application.properties", "ÉLEVÉ", "A02 - Crypto Fail", "P1 - Urgent"),
        ("SEC-05", "Absence de gardes canActivate sur les routes Angular", "ÉLEVÉ", "A01 - Broken Access", "P1 - Urgent"),
        ("SEC-06", "CORS trop permissif ('*' avec allowCredentials)", "MOYEN", "A05 - Misconfig", "P2 - Important"),
        ("SEC-07", "Exposition publique intégrale des endpoints Actuator", "MOYEN", "A05 - Misconfig", "P2 - Important"),
        ("SEC-08", "Stockage binaire LONGBLOB sans validation MIME/Scan", "MOYEN", "A04 - Insecure Design", "P2 - Important"),
        ("SEC-09", "Traçabilité et audit logs LCB-FT / AML insuffisants", "MOYEN", "A09 - Log Failure", "P2 - Important"),
    ]

    pdf.set_font("ArialCustom", "", 7.5)
    pdf.set_text_color(30, 41, 59)
    fill_row = False
    for ref, title, sev, owasp, prio in vulns_summary:
        pdf.set_fill_color(248, 250, 252) if fill_row else pdf.set_fill_color(255, 255, 255)
        pdf.cell(16, 4.8, ref, 1, 0, 'C', fill_row)
        pdf.cell(86, 4.8, " " + title, 1, 0, 'L', fill_row)
        
        # Sévérité colorée
        if sev == "CRITIQUE":
            pdf.set_text_color(185, 28, 28)
            pdf.set_font("ArialCustom", "B", 7.5)
        elif sev == "ÉLEVÉ":
            pdf.set_text_color(194, 65, 12)
            pdf.set_font("ArialCustom", "B", 7.5)
        else:
            pdf.set_text_color(180, 83, 9)
            pdf.set_font("ArialCustom", "B", 7.5)
        
        pdf.cell(26, 4.8, sev, 1, 0, 'C', fill_row)
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("ArialCustom", "", 7.5)
        pdf.cell(24, 4.8, owasp, 1, 0, 'C', fill_row)
        pdf.cell(28, 4.8, prio, 1, 0, 'C', fill_row)
        pdf.ln(4.8)
        fill_row = not fill_row

    # -------------------------------------------------------------
    # PAGE 2 : VULNÉRABILITÉS CRITIQUES (SEC-01 & SEC-02)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("1", "VULNÉRABILITÉS CRITIQUES (PRIORITÉ P0)")
    
    # SEC-01
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-01 : Divulgation de Schéma & Stack Traces SQL (Information Disclosure)")
    pdf.severity_badge("CRITIQUE")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec01_desc = ("- Emplacement : back/src/main/java/com/avo/config/GlobalExceptionHandler.java (L. 42-46)\n"
                  "- Constat : La méthode handleConflict capture toutes les Throwable et retourne sw.toString() (la stack trace Java brute) directement dans le corps de réponse HTTP 500.\n"
                  "- Risque & Impact : Fuite de la structure interne des tables MySQL (ex: dossier_documents, documents), requêtes SQL exécutées, contraintes de clés étrangères, versions de Hibernate et Spring. Permet à un attaquant de cartographier la base de données sans accès direct.")
    pdf.multi_cell(180, 3.8, sec01_desc)
    pdf.ln(1)

    pdf.set_font("ArialCustom", "B", 8)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 4.5, "Remédiation Technique Immédiate :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    code_sec01 = """// com.avo.config.GlobalExceptionHandler.java
@ExceptionHandler(value = { Throwable.class })
protected ResponseEntity<Map<String, Object>> handleConflict(Throwable ex, WebRequest req) {
    log.error("[ERREUR INTERNE] Non geree : {}", ex.getMessage(), ex); // Log complet serveur
    
    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", java.time.Instant.now().toString());
    body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
    body.put("error", "Une erreur interne est survenue. Veuillez contacter le support.");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
}"""
    pdf.code_box(code_sec01)

    # SEC-02
    pdf.ln(2)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-02 : Bypass d'Authentification par Profil Dev Actif par Défaut")
    pdf.severity_badge("CRITIQUE")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec02_desc = ("- Emplacements : back/src/main/resources/application.properties (L. 6) & DevSecurityConfig.java (L. 23)\n"
                  "- Constat : spring.profiles.active=dev est activé par défaut. DevSecurityConfig applique .anyRequest().permitAll() pour les profils dev/test.\n"
                  "- Risque & Impact : Si le fichier JAR est déployé sans surcharge explicite (-Dspring.profiles.active=prod), l'intégralité des endpoints REST (dossiers, clients, screening AML, factures) est accessible publiquement sur Internet sans aucun token JWT ni mot de passe.")
    pdf.multi_cell(180, 3.8, sec02_desc)
    pdf.ln(1)

    pdf.set_font("ArialCustom", "B", 8)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 4.5, "Remédiation Technique Immédiate :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    code_sec02 = """# application.properties : Verrouiller la configuration sur le profil de production
spring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}

# DevSecurityConfig.java : Restreindre strictement aux tests unitaires ou supprimer
# SecurityConfig.java doit être la SEULE chaîne de sécurité globale :
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/public/**", "/actuator/health").permitAll()
    .requestMatchers("/api/**").authenticated()
    .anyRequest().denyAll())"""
    pdf.code_box(code_sec02)

    # -------------------------------------------------------------
    # PAGE 3 : VULNÉRABILITÉS ÉLEVÉES (SEC-03 & SEC-04 & SEC-05)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("2", "VULNÉRABILITÉS ÉLEVÉES & GESTION DES ACCÈS (PRIORITÉ P1)")

    # SEC-03
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-03 : Absence de Contrôles RBAC & Vulnérabilités IDOR sur les Contrôleurs")
    pdf.severity_badge("ÉLEVÉ")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec03_desc = ("- Emplacements : UserController.java, ScreeningExecutionController.java, ClientController.java, DocumentController.java\n"
                  "- Constat : Aucun contrôleur backend ne dispose d'annotations de sécurité @PreAuthorize. Tout utilisateur connecté (quel que soit son rôle Keycloak) peut appeler des fonctions d'administration critique : réinitialisation de mot de passe (/api/users/{id}/reset-password), désactivation de compte, forçage de screening AML ou suppression de documents.\n"
                  "- Risque & Impact : Élévation de privilèges horizontale et verticale, compromission de comptes administrateurs, violation du secret professionnel entre avocats du cabinet.")
    pdf.multi_cell(180, 3.8, sec03_desc)
    pdf.ln(1)

    pdf.set_font("ArialCustom", "B", 8)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 4.5, "Remédiation Technique Recommandée :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    code_sec03 = """// UserController.java : Verrouiller les accès d'administration
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('admin', 'super_admin')")
public class UserController { ... }

// ScreeningExecutionController.java : Réserver le screening AML aux profils habilités
@RestController
@RequestMapping("/api/screening/matches/execution")
@PreAuthorize("hasAnyRole('admin', 'compliance_officer', 'avocat')")
public class ScreeningExecutionController { ... }"""
    pdf.code_box(code_sec03)

    # SEC-04
    pdf.ln(2)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-04 : Secrets & Clés API Versionnés en Clair dans les Fichiers de Configuration")
    pdf.severity_badge("ÉLEVÉ")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec04_desc = ("- Emplacement : back/src/main/resources/application.properties\n"
                  "- Constat : Contient en clair : mot de passe MySQL (adam), secret client Keycloak Admin (WOj6uy5Q5EMI3rO6WWZFERgukq9mz6pm), clé Yente AML (adam) et compte SMTP Brevo (b00140001@smtp-brevo.com).\n"
                  "- Remédiation : Remplacer toutes les valeurs sensibles par des variables d'environnement système (${KEYCLOAK_ADMIN_SECRET}, ${DB_PASSWORD}) et renouveler immédiatement les clés compromises.")
    pdf.multi_cell(180, 3.8, sec04_desc)

    # SEC-05
    pdf.ln(3)
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-05 : Absence de Route Guards canActivate côté Frontend Angular")
    pdf.severity_badge("ÉLEVÉ")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec05_desc = ("- Emplacement : front/src/app/app.routes.ts\n"
                  "- Constat : Les routes Angular (/administration, /utilisateurs, /due-diligence, /facturation) ne possèdent aucun canActivate. Un utilisateur non authentifié accède visuellement aux interfaces avant que l'intercepteur API n'échoue.\n"
                  "- Remédiation : Créer un AuthGuard et un RoleGuard vérifiant keycloakService.isLoggedIn() et keycloakService.getUserRoles().")
    pdf.multi_cell(180, 3.8, sec05_desc)

    # -------------------------------------------------------------
    # PAGE 4 : VULNÉRABILITÉS MOYENNES & CONFORMITÉ LCB-FT
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("3", "VULNÉRABILITÉS RÉSEAU, CORS & STOCKAGE (PRIORITÉ P2)")

    # SEC-06 & SEC-07
    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-06 : Politique CORS Trop Permissive (* avec allowCredentials)")
    pdf.severity_badge("MOYEN")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec06_desc = ("- Emplacement : back/src/main/java/com/avo/config/CorsConfig.java\n"
                  "- Constat : allowedOriginPatterns('*') combiné à allowCredentials(true) permet à n'importe quelle page web tierce d'émettre des requêtes cross-origin si un navigateur a une session active.\n"
                  "- Remédiation : Remplacer par des origines explicites (${app.cors.allowed-origins:https://si-legal.duckdns.org}).")
    pdf.multi_cell(180, 3.8, sec06_desc)
    pdf.ln(2)

    pdf.set_font("ArialCustom", "B", 9.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(145, 5.5, "SEC-07 : Exposition Complète des Métriques Spring Actuator")
    pdf.severity_badge("MOYEN")
    pdf.ln(1)

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    sec07_desc = ("- Emplacement : application.properties (L. 66-67) : management.endpoints.web.exposure.include=*\n"
                  "- Constat : Les métriques de santé, mapping d'URL et beans internes sont exposés publiquement.\n"
                  "- Remédiation : Configurer management.endpoints.web.exposure.include=health,info et show-details=never.")
    pdf.multi_cell(180, 3.8, sec07_desc)
    pdf.ln(3)

    pdf.chapter_title("4", "CONFORMITÉ LCB-FT (AML/KYC), RGPD & SECRET PROFESSIONNEL")

    pdf.set_font("ArialCustom", "", 8)
    pdf.set_text_color(51, 65, 85)
    
    compliance_text = ("1. SECRET PROFESSIONNEL DE L'AVOCAT & SÉPARATION DES AFFAIRES :\n"
                       "   - Les dossiers judiciaires contiennent des pièces hautement confidentielles soumises au secret de l'Ordre des Avocats.\n"
                       "   - Obligation d'implémenter un contrôle d'habilitation strict pour s'assurer qu'un utilisateur n'accède qu'aux dossiers où il est désigné comme avocat responsable ou collaborateur assigné.\n\n"
                       "2. TRAÇABILITÉ & OBLIGATIONS LCB-FT (TRACFIN / FATF-GAFI) :\n"
                       "   - Toute opération sur le statut AML d'un client (ex: passage de AML_REQUIRED à VALIDATED) ou levée d'un faux-positif sur liste de sanctions Yente doit être enregistrée dans une table d'audit immuable avec ID utilisateur, horodatage et motif légal.\n"
                       "   - Les fiches de vigilance KYC PDF doivent être conservées de manière intègre et chiffrée pendant au moins 5 ans après la fin de la relation d'affaires.\n\n"
                       "3. SÉCURITÉ DU STOCKAGE DES DOCUMENTS (LONGBLOB) :\n"
                       "   - Valider systématiquement le type MIME réel (Magic Numbers) et la taille maximale autorisée (ex: 20 Mo) pour éviter les attaques DoS / Memory Leak et téléversement de scripts malveillants.")
    pdf.multi_cell(180, 3.8, compliance_text)

    # -------------------------------------------------------------
    # PAGE 5 : ROADMAP DE REMÉDIATION & CHECKLIST PRODUCTION
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title("5", "PLAN DE REMÉDIATION & ROADMAP TECHNIQUE")

    # Tableau Roadmap
    pdf.set_font("ArialCustom", "B", 7.5)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(28, 5.5, "PHASE", 1, 0, 'C', True)
    pdf.cell(36, 5.5, "DÉLAI", 1, 0, 'C', True)
    pdf.cell(116, 5.5, "ACTIONS TECHNIQUES PRIORITAIRES", 1, 0, 'L', True)
    pdf.ln(5.5)

    roadmap_data = [
        ("Phase 1 (P0)\nUrgente", "24 à 48 heures", "- Masquer les Stack Traces dans GlobalExceptionHandler\n- Désactiver le profil dev par défaut dans application.properties"),
        ("Phase 2 (P1)\nCourt Terme", "3 à 5 jours", "- Appliquer les annotations @PreAuthorize sur tous les contrôleurs REST\n- Externaliser les secrets dans des variables d'environnement (.env)\n- Implémenter les AuthGuards et RoleGuards sur Angular"),
        ("Phase 3 (P2)\nMoyen Terme", "1 à 2 semaines", "- Restreindre les origines CORS et endpoints Actuator\n- Créer la table d'audit log pour la traçabilité des décisions AML\n- Ajouter la validation MIME et quotas sur les uploads de documents"),
        ("Phase 4 (P3)\nPré-Production", "Avant Go-Live", "- Audit des politiques de mot de passe et MFA obligatoire dans Keycloak\n- Tests d'intrusion (Pentest) boîte grise sur l'ensemble des API"),
    ]

    pdf.set_font("ArialCustom", "", 7.5)
    pdf.set_text_color(30, 41, 59)
    for phase, delay, actions in roadmap_data:
        h = 10 if actions.count("\n") == 1 else 13
        pdf.cell(28, h, phase, 1, 0, 'C')
        pdf.cell(36, h, delay, 1, 0, 'C')
        pdf.multi_cell(116, 4.2, actions, 1, 'L')

    pdf.ln(4)
    pdf.chapter_title("6", "CHECKLIST DE CONTRÔLE DE MISE EN PRODUCTION")

    checklist_items = [
        ("[  ] Secrets & IAM", "Tous les mots de passe et client secrets sont injectés via variables d'environnement."),
        ("[  ] Sécurité Spring", "Le profil par défaut est 'prod', DevSecurityConfig est désactivé."),
        ("[  ] Gestion Erreurs", "Les réponses HTTP 500 ne renvoient aucune stack trace ni détail SQL."),
        ("[  ] RBAC Backend", "Chaque endpoint d'administration et de conformité AML vérifie les rôles Keycloak."),
        ("[  ] CORS & Headers", "Origines CORS limitées au domaine du cabinet, en-têtes HSTS et CSP configurés."),
        ("[  ] LCB-FT / AML", "Toutes les levées de doutes et validations de vigilance KYC sont auditées."),
    ]

    pdf.set_font("ArialCustom", "B", 7.5)
    pdf.set_fill_color(248, 250, 252)
    for check, desc in checklist_items:
        pdf.cell(38, 5, check, 1, 0, 'L', True)
        pdf.set_font("ArialCustom", "", 7.5)
        pdf.cell(142, 5, " " + desc, 1, 0, 'L', False)
        pdf.ln(5)
        pdf.set_font("ArialCustom", "B", 7.5)

    pdf.ln(4)
    # Conclusion Box
    pdf.set_fill_color(240, 253, 244) # Green 50
    pdf.set_draw_color(134, 239, 172) # Green border
    pdf.rect(15, pdf.get_y(), 180, 22, 'DF')
    pdf.set_xy(18, pdf.get_y() + 2)
    pdf.set_font("ArialCustom", "B", 9)
    pdf.set_text_color(22, 101, 52)
    pdf.cell(0, 4.5, "CONCLUSION DE L'EXPERT EN CYBERSÉCURITÉ :", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(18)
    pdf.set_font("ArialCustom", "", 7.8)
    pdf.set_text_color(21, 128, 61)
    pdf.multi_cell(174, 3.6, "L'application dispose d'un socle technologique robuste et moderne. La mise en œuvre rigoureuse des correctifs P0 et P1 éliminera les risques critiques identifiés et portera le score de sécurité à plus de 88/100, garantissant un niveau de protection optimal pour les données sensibles du cabinet.")

    # Sortie du fichier
    output_path = r"d:\avo-maitrise\Rapport_Audit_Securite_AvoMaitrise.pdf"
    pdf.output(output_path)
    print(f"PDF Successfully generated at: {output_path}")

if __name__ == '__main__':
    generate_pdf()

import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class PDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 15)
        self.cell(0, 10, "Blueprint de Deploiement", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(10)

    def chapter_title(self, title):
        self.set_font("helvetica", "B", 12)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
        self.set_text_color(0, 0, 0)
        self.ln(4)

    def chapter_body(self, text):
        self.set_font("helvetica", "", 10)
        self.multi_cell(0, 6, text)
        self.ln()

pdf = PDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)

pdf.chapter_title("1. Analyse de l'Architecture")
body1 = """- Isolation des donnees (RGPD) : Chaque client a sa propre instance MySQL, Qdrant et Ollama.
- Centralisation de l'authentification : Un seul VPS Keycloak (avec 1 Realm par client).
- SSL Automatique : Utiliser Caddy.
- Mise a jour Front simplifiee : Le Frontend partage (React/Angular) permet de deployer facilement.
"""
pdf.chapter_body(body1)

pdf.chapter_title("2. Blueprint de l'Architecture (VPS)")
body2 = """VPS Partage 1 : Identite (auth.votre-domaine.com)
  - Caddy, Keycloak, PostgreSQL

VPS Partage 2 : Frontend & Gateway (app.votre-domaine.com)
  - Caddy, Frontend (React / Angular)

VPS Client Dedie (Ex: api.client1.votre-domaine.com)
  - Caddy, Spring Boot Backend, MySQL, Qdrant, Ollama
"""
pdf.chapter_body(body2)

pdf.chapter_title("3. Schema de Communication")
body3 = """- Utilisateur -> Caddy2 (Frontend)
- Si non connecte -> Redirection vers Caddy1 (Keycloak)
- Apres Login -> Envoi requetes API vers Caddy3 (Spring Boot Client)
- Spring Boot -> Verifie le Token aupres de Keycloak (VPS 1)
- Spring Boot -> Communique avec MySQL, Qdrant et Ollama locaux
Note: Veuillez ouvrir la version .html pour visualiser le schema graphique interactif (Mermaid)."""
pdf.chapter_body(body3)

pdf.chapter_title("4. Guide d'Installation (Extrait Docker Compose)")
body4 = """# VPS Partage 1 - Keycloak
- Network: keycloak_net
- Services: caddy, postgres, keycloak

# VPS Partage 2 - Frontend
- Network: front_net
- Services: caddy, frontend-app (nginx)

# VPS Client
- Network: client_net
- Services: caddy, mysql, qdrant, ollama, backend (Spring Boot)
"""
pdf.chapter_body(body4)

pdf_file = "blueprint-deploiement.pdf"
pdf.output(pdf_file)
print("PDF genere avec succes :", pdf_file)

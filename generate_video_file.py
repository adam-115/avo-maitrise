import asyncio
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont
import edge_tts
import imageio_ffmpeg

# Paths
BASE_DIR = r"d:\avo-maitrise"
ARTIFACTS_DIR = r"C:\Users\lenovo\.gemini\antigravity-ide\brain\16d1cb7a-171b-4ff1-92bd-899628a05374"
OUTPUT_VIDEO = os.path.join(BASE_DIR, "SI_LEGAL_Presentation_Commerciale.mp4")
TEMP_DIR = os.path.join(BASE_DIR, "temp_video_render")

os.makedirs(TEMP_DIR, exist_ok=True)

VOICE = "fr-FR-HenriNeural"

# 11 Ultra-Complete Commercial Demonstration Scenes
SCENES = [
    {
        "id": 1,
        "title": "ACCUEIL & TABLEAU DE BORD DU CABINET",
        "subtitle": "Pilotage global, indicateurs clés et vision 360° en temps réel",
        "image_path": os.path.join(ARTIFACTS_DIR, "dashboard_home_1788994429975.png"),
        "narration": "Bienvenue dans SI-LÉGAL Avo-Maîtrise, la solution complète pour les cabinets d'avocats. Dès votre tableau de bord, visualisez en temps réel vos indicateurs clés, l'ensemble de vos dossiers actifs et vos alertes réglementaires prioritaires."
    },
    {
        "id": 2,
        "title": "CONFORMITÉ & VIGILANCE AML / LCB-FT",
        "subtitle": "Screening Sanctions internationales, PPE et score de risque automatique",
        "image_path": os.path.join(ARTIFACTS_DIR, "aml_compliance_loaded_1788994449395.png"),
        "narration": "Sécurisez votre cabinet face aux obligations de lutte contre le blanchiment et le financement du terrorisme. Notre moteur AML interroge instantanément les listes de sanctions internationales, détecte les personnes politiquement exposées et évalue le risque de chaque client."
    },
    {
        "id": 3,
        "title": "RAPPORT DE CONFORMITÉ & AUDIT BÂTONNIER",
        "subtitle": "Fiche de vigilance client, score GAFI et piste d'audit certifiée",
        "image_path": os.path.join(ARTIFACTS_DIR, "client_conformity_dashboard_1788995945842.png"),
        "narration": "Accédez à la fiche de conformité individuelle de chaque client : score de risque, historique des contrôles et piste d'audit certifiée. En cas de contrôle de votre Bâtonnier, exportez un rapport d'audit officiel horodaté en un seul clic."
    },
    {
        "id": 4,
        "title": "RÉPERTOIRE CLIENTS & STATUTS DE CONFORMITÉ",
        "subtitle": "Visibilité immédiate sur les statuts de vigilance de chaque contact",
        "image_path": os.path.join(ARTIFACTS_DIR, "crm_clients_list_1788995916705.png"),
        "narration": "Dans votre répertoire clients, identifiez immédiatement le statut de conformité de chaque contact grâce à des badges clairs : validé, vigilance requise ou bloqué. Vos collaborateurs savent instantanément quelles vérifications sont nécessaires."
    },
    {
        "id": 5,
        "title": "GESTION COMPLÈTE DES DOSSIERS JURIDIQUES",
        "subtitle": "Centralisation des affaires, actes, chronologie et parties prenantes",
        "image_path": os.path.join(ARTIFACTS_DIR, "dossiers_management_loaded_1788994524148.png"),
        "narration": "Centralisez l'ensemble de vos affaires contentieuses et de conseil. Retrouvez sur une interface intuitive l'historique complet, les actes de procédure, les statuts d'avancement et toutes les parties prenantes du dossier."
    },
    {
        "id": 6,
        "title": "AGENDA JUDICIAIRE & CALENDRIER D'AUDIENCES",
        "subtitle": "Planning partagé du cabinet et alertes sur les délais de procédure",
        "image_path": os.path.join(ARTIFACTS_DIR, "calendar_view_1788995876030.png"),
        "narration": "Maîtrisez votre planning grâce au calendrier judiciaire intégré. Planifiez vos audiences, vos rendez-vous clients et recevez des alertes automatiques pour sécuriser vos délais légaux de procédure et éviter toute forclusion."
    },
    {
        "id": 7,
        "title": "GESTION DES TÂCHES & ÉCHÉANCES PAR DOSSIER",
        "subtitle": "Attribution des tâches, priorités et suivi d'avancement des collaborateurs",
        "image_path": os.path.join(ARTIFACTS_DIR, "task_manager_view_1788995893611.png"),
        "narration": "Coordonnez le travail de votre équipe avec le gestionnaire de tâches par dossier. Définissez les priorités, attribuez les diligences aux collaborateurs et suivez l'avancement des échéances en toute fluidité."
    },
    {
        "id": 8,
        "title": "GESTION DES PRESTATIONS & SAISIE DES TEMPS",
        "subtitle": "Valorisation des diligences au temps passé, forfait ou honoraire de résultat",
        "image_path": os.path.join(ARTIFACTS_DIR, "dossier_prestations_1153_1788995383355.png"),
        "narration": "Enregistrez chaque diligence avec précision : temps passé, forfaits ou honoraires de résultat. Appliquez les taux horaires personnalisés de chaque avocat et convertissez l'ensemble de vos prestations en factures sans aucune perte d'heures."
    },
    {
        "id": 9,
        "title": "ÉMISSION & VISUALISATION DE FACTURES CONFORMES",
        "subtitle": "Factures professionnelles détaillées, mentions légales et TVA automatique",
        "image_path": os.path.join(ARTIFACTS_DIR, "invoice_preview_1788995859805.png"),
        "narration": "Générez des factures professionnelles, élégantes et conformes aux exigences ordinales et fiscales. Détail des prestations, mentions légales, TVA et totaux sont automatiquement calculés et prêts à être transmis au client."
    },
    {
        "id": 10,
        "title": "GED & MODÈLES D'ACTES JURIDIQUES",
        "subtitle": "Génération automatique d'actes et coffre-fort documentaire",
        "image_path": os.path.join(ARTIFACTS_DIR, "modeles_documents_ged_1788995398739.png"),
        "narration": "Gagnez un temps précieux dans la rédaction de vos actes. Utilisez votre bibliothèque de modèles juridiques pour générer vos conclusions et conventions, tout en classant vos pièces de procédure dans un coffre-fort documentaire sécurisé."
    },
    {
        "id": 11,
        "title": "TABLEAU DE BORD FINANCIER & DÉCISIONNEL",
        "subtitle": "Chiffre d'affaires, prévisions d'encaissements et rentabilité du cabinet",
        "image_path": os.path.join(ARTIFACTS_DIR, "billing_dashboard_1788994560340.png"),
        "narration": "Pilotez la croissance de votre structure avec le tableau de bord financier. Suivez votre chiffre d'affaires, vos encaissements et vos heures valorisées. Avec SI-LÉGAL, offrez à votre cabinet la modernité, la sécurité et la rentabilité qu'il mérite."
    }
]

async def generate_audio(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE, rate="+3%", pitch="+0Hz")
    await communicate.save(output_path)

def get_audio_duration(audio_path, ffmpeg_exe):
    cmd = [ffmpeg_exe, "-i", audio_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            dur_str = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = dur_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 14.0

def process_slide_image(raw_img_path, title, subtitle, out_img_path):
    target_w, target_h = 1920, 1080
    
    canvas = Image.new("RGB", (target_w, target_h), (10, 15, 30))
    draw = ImageDraw.Draw(canvas)
    
    if os.path.exists(raw_img_path):
        screen = Image.open(raw_img_path).convert("RGB")
        screen_w = 1800
        screen_h = 880
        screen_resized = screen.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
        
        x_pos = (target_w - screen_w) // 2
        y_pos = 110
        canvas.paste(screen_resized, (x_pos, y_pos))
        draw.rectangle([x_pos - 2, y_pos - 2, x_pos + screen_w + 2, y_pos + screen_h + 2], outline=(6, 182, 212), width=2)
    
    # Top banner bar
    draw.rectangle([0, 0, target_w, 90], fill=(15, 23, 42))
    draw.line([0, 90, target_w, 90], fill=(6, 182, 212), width=3)
    
    # Fonts
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 30)
        font_sub = ImageFont.truetype("arial.ttf", 19)
        font_badge = ImageFont.truetype("arialbd.ttf", 18)
    except:
        font_title = font_sub = font_badge = ImageFont.load_default()
        
    # Badge
    draw.rectangle([40, 20, 220, 70], fill=(6, 182, 212))
    draw.text((60, 32), "SI-LÉGAL", fill=(10, 15, 30), font=font_badge)
    
    # Title & Subtitle
    draw.text((250, 18), title, fill=(255, 255, 255), font=font_title)
    draw.text((250, 56), subtitle, fill=(148, 163, 184), font=font_sub)
    
    canvas.save(out_img_path, quality=95)

async def main():
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using FFmpeg at: {ffmpeg_exe}", flush=True)
    
    segment_files = []
    
    for i, scene in enumerate(SCENES):
        print(f"\n--- Generating Scene {scene['id']}/{len(SCENES)}: {scene['title']} ---", flush=True)
        
        audio_file = os.path.join(TEMP_DIR, f"audio_{i+1}.mp3")
        slide_img = os.path.join(TEMP_DIR, f"slide_{i+1}.png")
        segment_video = os.path.join(TEMP_DIR, f"segment_{i+1}.mp4")
        
        print("  Generating voiceover audio...", flush=True)
        await generate_audio(scene["narration"], audio_file)
        
        duration = get_audio_duration(audio_file, ffmpeg_exe) + 0.8
        print(f"  Audio duration: {duration:.2f}s", flush=True)
        
        print("  Processing screenshot slide...", flush=True)
        process_slide_image(scene["image_path"], scene["title"], scene["subtitle"], slide_img)
        
        print("  Rendering scene video segment...", flush=True)
        cmd = [
            ffmpeg_exe, "-y",
            "-loop", "1",
            "-i", slide_img,
            "-i", audio_file,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-t", str(duration),
            "-shortest",
            segment_video
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print(f"FFmpeg error on scene {i+1}:", res.stderr, flush=True)
        else:
            segment_files.append(segment_video)
            print(f"  Segment {i+1} rendered successfully!", flush=True)

    print("\n--- Concatenating all 11 scenes into final video ---", flush=True)
    concat_list_file = os.path.join(TEMP_DIR, "concat_list.txt")
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for seg in segment_files:
            clean_path = seg.replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
            
    concat_cmd = [
        ffmpeg_exe, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c", "copy",
        OUTPUT_VIDEO
    ]
    res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0:
        file_size = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print(f"\n=======================================================", flush=True)
        print(f"SUCCESS! Video created at: {OUTPUT_VIDEO}", flush=True)
        print(f"File Size: {file_size:.2f} MB", flush=True)
        print(f"=======================================================", flush=True)
    else:
        print("Concat error:", res.stderr, flush=True)

if __name__ == "__main__":
    asyncio.run(main())

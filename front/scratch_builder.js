const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "FORM_BUILDER": {
      "TITLE": "Configuration du Formulaire",
      "SUBTITLE": "Créez et prévisualisez vos champs en temps réel.",
      "SAVE": "Enregistrer",
      "ADD_FIELD": "Ajouter un champ",
      "GENERAL_SETTINGS": "Paramètres Généraux",
      "TECH_NAME": "Nom Technique",
      "TECH_NAME_REQ": "Le nom technique est requis (min 3 chars).",
      "FORM_TITLE": "Titre du Formulaire",
      "FORM_TITLE_REQ": "Le titre est requis.",
      "TARGET_CLIENT_TYPE": "Type de Client Cible",
      "ALL_TYPES": "Tous les types",
      "TYPE_INDIVIDUAL": "Personne Physique",
      "TYPE_COMPANY": "Société / Personne Morale",
      "TYPE_INSTITUTION": "Institution",
      "TYPE_ASSOCIATION": "Association",
      "DESC": "Description",
      "DESC_REQ": "La description est requise.",
      "SAVE_SETTINGS": "Enregistrer les paramètres",
      "EMPTY_FORM": "Formulaire vide",
      "START_ADD_FIELD": "Commencez par ajouter votre premier champ.",
      "SELECT_OPTION": "Sélectionnez une option",
      "CLICK_UPLOAD": "Cliquez pour télécharger un fichier",
      "FIELD_REQUIRED": "Ce champ est requis",
      "SAVE_FORM": "Enregistrer le Formulaire"
    }
  },
  en: {
    "FORM_BUILDER": {
      "TITLE": "Form Configuration",
      "SUBTITLE": "Create and preview your fields in real time.",
      "SAVE": "Save",
      "ADD_FIELD": "Add a field",
      "GENERAL_SETTINGS": "General Settings",
      "TECH_NAME": "Technical Name",
      "TECH_NAME_REQ": "Technical name is required (min 3 chars).",
      "FORM_TITLE": "Form Title",
      "FORM_TITLE_REQ": "Title is required.",
      "TARGET_CLIENT_TYPE": "Target Client Type",
      "ALL_TYPES": "All types",
      "TYPE_INDIVIDUAL": "Individual",
      "TYPE_COMPANY": "Company / Legal Entity",
      "TYPE_INSTITUTION": "Institution",
      "TYPE_ASSOCIATION": "Association",
      "DESC": "Description",
      "DESC_REQ": "Description is required.",
      "SAVE_SETTINGS": "Save settings",
      "EMPTY_FORM": "Empty form",
      "START_ADD_FIELD": "Start by adding your first field.",
      "SELECT_OPTION": "Select an option",
      "CLICK_UPLOAD": "Click to upload a file",
      "FIELD_REQUIRED": "This field is required",
      "SAVE_FORM": "Save Form"
    }
  },
  ar: {
    "FORM_BUILDER": {
      "TITLE": "تكوين النموذج",
      "SUBTITLE": "قم بإنشاء ومعاينة الحقول الخاصة بك في الوقت الفعلي.",
      "SAVE": "حفظ",
      "ADD_FIELD": "إضافة حقل",
      "GENERAL_SETTINGS": "الإعدادات العامة",
      "TECH_NAME": "الاسم الفني",
      "TECH_NAME_REQ": "الاسم الفني مطلوب (3 أحرف على الأقل).",
      "FORM_TITLE": "عنوان النموذج",
      "FORM_TITLE_REQ": "العنوان مطلوب.",
      "TARGET_CLIENT_TYPE": "نوع العميل المستهدف",
      "ALL_TYPES": "جميع الأنواع",
      "TYPE_INDIVIDUAL": "فرد",
      "TYPE_COMPANY": "شركة / كيان قانوني",
      "TYPE_INSTITUTION": "مؤسسة",
      "TYPE_ASSOCIATION": "جمعية",
      "DESC": "الوصف",
      "DESC_REQ": "الوصف مطلوب.",
      "SAVE_SETTINGS": "حفظ الإعدادات",
      "EMPTY_FORM": "نموذج فارغ",
      "START_ADD_FIELD": "ابدأ بإضافة حقلك الأول.",
      "SELECT_OPTION": "حدد اختيارا",
      "CLICK_UPLOAD": "انقر لتحميل ملف",
      "FIELD_REQUIRED": "هذا الحقل مطلوب",
      "SAVE_FORM": "حفظ النموذج"
    }
  }
};

TRANSLATIONS.es = TRANSLATIONS.en;
TRANSLATIONS.de = TRANSLATIONS.en;
TRANSLATIONS.it = TRANSLATIONS.en;

const basePath = 'd:/avo-maitrise/front/public/assets/i18n';
for (const [lang, translations] of Object.entries(TRANSLATIONS)) {
  const filePath = `${basePath}/${lang}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(data, translations);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

// Translate HTML
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-builder-component/diligence-form-builder-component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Configuration du Formulaire', "{{ 'FORM_BUILDER.TITLE' | translate }}");
html = html.replace('Créez et prévisualisez vos champs en temps réel.', "{{ 'FORM_BUILDER.SUBTITLE' | translate }}");
html = html.replace(/>\s*Enregistrer\s*</g, ">{{ 'FORM_BUILDER.SAVE' | translate }}<");
html = html.replace('Ajouter un champ', "{{ 'FORM_BUILDER.ADD_FIELD' | translate }}");
html = html.replace('Paramètres Généraux', "{{ 'FORM_BUILDER.GENERAL_SETTINGS' | translate }}");
html = html.replace('Nom Technique', "{{ 'FORM_BUILDER.TECH_NAME' | translate }}");
html = html.replace('Le nom technique est requis (min 3 chars).', "{{ 'FORM_BUILDER.TECH_NAME_REQ' | translate }}");
html = html.replace('Titre du Formulaire', "{{ 'FORM_BUILDER.FORM_TITLE' | translate }}");
html = html.replace('Le titre est requis.', "{{ 'FORM_BUILDER.FORM_TITLE_REQ' | translate }}");
html = html.replace('Type de Client Cible', "{{ 'FORM_BUILDER.TARGET_CLIENT_TYPE' | translate }}");
html = html.replace('>Tous les types<', ">{{ 'FORM_BUILDER.ALL_TYPES' | translate }}<");
html = html.replace('>Personne Physique<', ">{{ 'FORM_BUILDER.TYPE_INDIVIDUAL' | translate }}<");
html = html.replace('>Société / Personne Morale<', ">{{ 'FORM_BUILDER.TYPE_COMPANY' | translate }}<");
html = html.replace('>Institution<', ">{{ 'FORM_BUILDER.TYPE_INSTITUTION' | translate }}<");
html = html.replace('>Association<', ">{{ 'FORM_BUILDER.TYPE_ASSOCIATION' | translate }}<");
html = html.replace('>Description <', ">{{ 'FORM_BUILDER.DESC' | translate }} <");
html = html.replace('La description est requise.', "{{ 'FORM_BUILDER.DESC_REQ' | translate }}");
html = html.replace('Enregistrer les paramètres', "{{ 'FORM_BUILDER.SAVE_SETTINGS' | translate }}");
html = html.replace('Formulaire vide', "{{ 'FORM_BUILDER.EMPTY_FORM' | translate }}");
html = html.replace('Commencez par ajouter votre premier champ.', "{{ 'FORM_BUILDER.START_ADD_FIELD' | translate }}");
html = html.replace('Sélectionnez une option', "{{ 'FORM_BUILDER.SELECT_OPTION' | translate }}");
html = html.replace('Cliquez pour télécharger un fichier', "{{ 'FORM_BUILDER.CLICK_UPLOAD' | translate }}");
html = html.replace("{{ field.errorMessage || 'Ce champ est requis' }}", "{{ field.errorMessage || ('FORM_BUILDER.FIELD_REQUIRED' | translate) }}");
html = html.replace('Enregistrer le Formulaire', "{{ 'FORM_BUILDER.SAVE_FORM' | translate }}");

fs.writeFileSync(htmlPath, html);
console.log('Translated form-builder HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-builder-component/diligence-form-builder-component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule, FormsModule, ReactiveFormsModule],", "imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
}

const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "FORM_VIEWER": {
      "TARGET": "Cible du Formulaire",
      "TARGET_INFO": "Informations sur le client concerné",
      "CLIENT": "Client",
      "CONTACT": "Contact",
      "NOT_PROVIDED": "Non renseigné",
      "ACTIVITY": "Activité",
      "COUNTRY": "Pays de Résidence",
      "SELECT_OPTION": "Sélectionnez une option",
      "CLICK_DRAG_FILE": "Cliquez ou glissez un fichier ici",
      "FIELD_REQUIRED": "Ce champ est requis",
      "SUBMIT": "Soumettre",
      "LOADING_FORM": "Chargement du formulaire..."
    }
  },
  en: {
    "FORM_VIEWER": {
      "TARGET": "Form Target",
      "TARGET_INFO": "Information about the relevant client",
      "CLIENT": "Client",
      "CONTACT": "Contact",
      "NOT_PROVIDED": "Not provided",
      "ACTIVITY": "Activity",
      "COUNTRY": "Country of Residence",
      "SELECT_OPTION": "Select an option",
      "CLICK_DRAG_FILE": "Click or drag a file here",
      "FIELD_REQUIRED": "This field is required",
      "SUBMIT": "Submit",
      "LOADING_FORM": "Loading form..."
    }
  },
  ar: {
    "FORM_VIEWER": {
      "TARGET": "هدف النموذج",
      "TARGET_INFO": "معلومات حول العميل المعني",
      "CLIENT": "العميل",
      "CONTACT": "جهة الاتصال",
      "NOT_PROVIDED": "غير متوفر",
      "ACTIVITY": "النشاط",
      "COUNTRY": "بلد الإقامة",
      "SELECT_OPTION": "حدد اختيارا",
      "CLICK_DRAG_FILE": "انقر أو اسحب ملفًا هنا",
      "FIELD_REQUIRED": "هذا الحقل مطلوب",
      "SUBMIT": "إرسال",
      "LOADING_FORM": "جاري تحميل النموذج..."
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
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-viewer/diligence-form-viewer.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Cible du Formulaire', "{{ 'FORM_VIEWER.TARGET' | translate }}");
html = html.replace('Informations sur le client concerné', "{{ 'FORM_VIEWER.TARGET_INFO' | translate }}");
html = html.replace('>Client<', ">{{ 'FORM_VIEWER.CLIENT' | translate }}<");
html = html.replace('>Contact<', ">{{ 'FORM_VIEWER.CONTACT' | translate }}<");
html = html.replace(/'Non renseigné'/g, "('FORM_VIEWER.NOT_PROVIDED' | translate)");
html = html.replace('>Activité<', ">{{ 'FORM_VIEWER.ACTIVITY' | translate }}<");
html = html.replace('>Pays de Résidence<', ">{{ 'FORM_VIEWER.COUNTRY' | translate }}<");
html = html.replace('Sélectionnez une option', "{{ 'FORM_VIEWER.SELECT_OPTION' | translate }}");
html = html.replace('Cliquez ou glissez un fichier ici', "{{ 'FORM_VIEWER.CLICK_DRAG_FILE' | translate }}");
html = html.replace("{{ field.errorMessage || 'Ce champ est requis' }}", "{{ field.errorMessage || ('FORM_VIEWER.FIELD_REQUIRED' | translate) }}");
html = html.replace(/>\s*Soumettre\s*</g, ">{{ 'FORM_VIEWER.SUBMIT' | translate }}<");
html = html.replace('Chargement du formulaire...', "{{ 'FORM_VIEWER.LOADING_FORM' | translate }}");

fs.writeFileSync(htmlPath, html);
console.log('Translated form-viewer HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-viewer/diligence-form-viewer.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule, ReactiveFormsModule],", "imports: [CommonModule, ReactiveFormsModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
}

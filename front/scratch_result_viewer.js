const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "FORM_RESULT_VIEWER": {
      "LOADING": "Chargement des résultats...",
      "BACK": "Retour",
      "PRINT": "Imprimer",
      "SUBMITTED_ON": "Soumis le :",
      "CLIENT": "Client :",
      "EMAIL": "Email",
      "PHONE": "Téléphone",
      "NOT_FOUND": "Résultat introuvable"
    }
  },
  en: {
    "FORM_RESULT_VIEWER": {
      "LOADING": "Loading results...",
      "BACK": "Back",
      "PRINT": "Print",
      "SUBMITTED_ON": "Submitted on:",
      "CLIENT": "Client:",
      "EMAIL": "Email",
      "PHONE": "Phone",
      "NOT_FOUND": "Result not found"
    }
  },
  ar: {
    "FORM_RESULT_VIEWER": {
      "LOADING": "جاري تحميل النتائج...",
      "BACK": "رجوع",
      "PRINT": "طباعة",
      "SUBMITTED_ON": "تم التقديم في:",
      "CLIENT": "العميل:",
      "EMAIL": "البريد الإلكتروني",
      "PHONE": "الهاتف",
      "NOT_FOUND": "النتيجة غير موجودة"
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
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-result-viewer/diligence-form-result-viewer.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Chargement des résultats...', "{{ 'FORM_RESULT_VIEWER.LOADING' | translate }}");
html = html.replace(/>\s*Retour\s*</g, ">{{ 'FORM_RESULT_VIEWER.BACK' | translate }}<");
html = html.replace('Retour</button>', "{{ 'FORM_RESULT_VIEWER.BACK' | translate }}</button>");
html = html.replace('Imprimer', "{{ 'FORM_RESULT_VIEWER.PRINT' | translate }}");
html = html.replace('Soumis le :', "{{ 'FORM_RESULT_VIEWER.SUBMITTED_ON' | translate }}");
html = html.replace('Client :', "{{ 'FORM_RESULT_VIEWER.CLIENT' | translate }}");
html = html.replace('>Email<', ">{{ 'FORM_RESULT_VIEWER.EMAIL' | translate }}<");
html = html.replace('>Téléphone<', ">{{ 'FORM_RESULT_VIEWER.PHONE' | translate }}<");
html = html.replace('Résultat introuvable', "{{ 'FORM_RESULT_VIEWER.NOT_FOUND' | translate }}");

fs.writeFileSync(htmlPath, html);
console.log('Translated result-viewer HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-result-viewer/diligence-form-result-viewer.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule],", "imports: [CommonModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
}

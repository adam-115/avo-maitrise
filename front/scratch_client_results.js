const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "CLIENT_DILIGENCE_RESULTS": {
      "TITLE": "Résultats Due Diligence",
      "HISTORY_FOR": "Historique pour",
      "LOADING_CLIENT": "Chargement du client...",
      "PDF_REPORT": "Fiche de Vigilance (PDF)",
      "BACK_TO_CLIENT": "Retour au client",
      "REQUIRED_ACTIONS": "Actions Requises",
      "ASSIGN_FORM": "Assigner un formulaire",
      "NO_ACTION_REQUIRED": "Aucune action requise pour ce client.",
      "TO_DO": "À FAIRE",
      "TARGET": "Cible:",
      "ASSIGNED_ON": "Assigné le:",
      "FILL_NOW": "Remplir maintenant",
      "SUBMISSION_HISTORY": "Historique des Soumissions",
      "NO_RESULT_FOUND": "Aucun résultat trouvé",
      "NO_SUBMISSION_YET": "Aucun formulaire de vigilance n'a été soumis pour ce client.",
      "TH_FORM": "Formulaire",
      "TH_CREATION_DATE": "Date de Création",
      "TH_LAST_UPDATE": "Dernière Mise à Jour"
    }
  },
  en: {
    "CLIENT_DILIGENCE_RESULTS": {
      "TITLE": "Due Diligence Results",
      "HISTORY_FOR": "History for",
      "LOADING_CLIENT": "Loading client...",
      "PDF_REPORT": "Vigilance Sheet (PDF)",
      "BACK_TO_CLIENT": "Back to client",
      "REQUIRED_ACTIONS": "Required Actions",
      "ASSIGN_FORM": "Assign a form",
      "NO_ACTION_REQUIRED": "No action required for this client.",
      "TO_DO": "TO DO",
      "TARGET": "Target:",
      "ASSIGNED_ON": "Assigned on:",
      "FILL_NOW": "Fill now",
      "SUBMISSION_HISTORY": "Submission History",
      "NO_RESULT_FOUND": "No result found",
      "NO_SUBMISSION_YET": "No vigilance form has been submitted for this client.",
      "TH_FORM": "Form",
      "TH_CREATION_DATE": "Creation Date",
      "TH_LAST_UPDATE": "Last Update"
    }
  },
  ar: {
    "CLIENT_DILIGENCE_RESULTS": {
      "TITLE": "نتائج العناية الواجبة",
      "HISTORY_FOR": "سجل",
      "LOADING_CLIENT": "جاري تحميل العميل...",
      "PDF_REPORT": "ورقة اليقظة (PDF)",
      "BACK_TO_CLIENT": "العودة إلى العميل",
      "REQUIRED_ACTIONS": "الإجراءات المطلوبة",
      "ASSIGN_FORM": "تعيين نموذج",
      "NO_ACTION_REQUIRED": "لا توجد إجراءات مطلوبة لهذا العميل.",
      "TO_DO": "للقيام به",
      "TARGET": "الهدف:",
      "ASSIGNED_ON": "تاريخ التعيين:",
      "FILL_NOW": "املأ الآن",
      "SUBMISSION_HISTORY": "سجل التقديمات",
      "NO_RESULT_FOUND": "لم يتم العثور على نتائج",
      "NO_SUBMISSION_YET": "لم يتم تقديم أي نموذج يقظة لهذا العميل.",
      "TH_FORM": "النموذج",
      "TH_CREATION_DATE": "تاريخ الإنشاء",
      "TH_LAST_UPDATE": "آخر تحديث"
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
    console.log(`Updated ${lang}.json with CLIENT_DILIGENCE_RESULTS`);
  }
}

// Translate HTML
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/client-diligence-results/client-diligence-results.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Résultats Due Diligence', "{{ 'CLIENT_DILIGENCE_RESULTS.TITLE' | translate }}");
html = html.replace('Historique pour', "{{ 'CLIENT_DILIGENCE_RESULTS.HISTORY_FOR' | translate }}");
html = html.replace('Chargement du client...', "{{ 'CLIENT_DILIGENCE_RESULTS.LOADING_CLIENT' | translate }}");
html = html.replace('Fiche de Vigilance (PDF)', "{{ 'CLIENT_DILIGENCE_RESULTS.PDF_REPORT' | translate }}");
html = html.replace('Retour au client', "{{ 'CLIENT_DILIGENCE_RESULTS.BACK_TO_CLIENT' | translate }}");
html = html.replace('Actions Requises', "{{ 'CLIENT_DILIGENCE_RESULTS.REQUIRED_ACTIONS' | translate }}");
html = html.replace('Assigner un formulaire', "{{ 'CLIENT_DILIGENCE_RESULTS.ASSIGN_FORM' | translate }}");
html = html.replace('Aucune action requise pour ce client.', "{{ 'CLIENT_DILIGENCE_RESULTS.NO_ACTION_REQUIRED' | translate }}");
html = html.replace('À FAIRE', "{{ 'CLIENT_DILIGENCE_RESULTS.TO_DO' | translate }}");
html = html.replace('Cible:', "{{ 'CLIENT_DILIGENCE_RESULTS.TARGET' | translate }}");
html = html.replace('Assigné le:', "{{ 'CLIENT_DILIGENCE_RESULTS.ASSIGNED_ON' | translate }}");
html = html.replace('Remplir maintenant', "{{ 'CLIENT_DILIGENCE_RESULTS.FILL_NOW' | translate }}");
html = html.replace('Historique des Soumissions', "{{ 'CLIENT_DILIGENCE_RESULTS.SUBMISSION_HISTORY' | translate }}");
html = html.replace('Aucun résultat trouvé', "{{ 'CLIENT_DILIGENCE_RESULTS.NO_RESULT_FOUND' | translate }}");
html = html.replace("Aucun formulaire de vigilance n'a été soumis pour ce client.", "{{ 'CLIENT_DILIGENCE_RESULTS.NO_SUBMISSION_YET' | translate }}");
html = html.replace('>Formulaire<', ">{{ 'CLIENT_DILIGENCE_RESULTS.TH_FORM' | translate }}<");
html = html.replace('>Date de Création<', ">{{ 'CLIENT_DILIGENCE_RESULTS.TH_CREATION_DATE' | translate }}<");
html = html.replace('>Dernière Mise à Jour<', ">{{ 'CLIENT_DILIGENCE_RESULTS.TH_LAST_UPDATE' | translate }}<");

fs.writeFileSync(htmlPath, html);
console.log('Translated client-diligence-results HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/client-diligence-results/client-diligence-results.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule, RouterModule],", "imports: [CommonModule, RouterModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
  console.log('Added TranslatePipe to client-diligence-results TS.');
}

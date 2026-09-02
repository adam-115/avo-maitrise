const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "DILIGENCE_FORM_LIST": {
      "TITLE": "Configuration des Formulaires",
      "SUBTITLE": "Gérez vos modèles de questionnaires de diligence et d'indulgence.",
      "SEARCH_PLACEHOLDER": "Rechercher un formulaire...",
      "NEW": "Nouveau",
      "TH_NAME": "Nom",
      "TH_TITLE": "Titre",
      "TH_TYPE": "Type",
      "TH_CREATION_DATE": "Date de Création",
      "TH_ACTIONS": "Actions",
      "NO_FORM_FOUND": "Aucun formulaire trouvé.",
      "PREV": "Précédent",
      "NEXT": "Suivant",
      "SHOWING": "Affichage de",
      "TO": "à",
      "OUT_OF": "sur",
      "RESULTS": "résultats"
    }
  },
  en: {
    "DILIGENCE_FORM_LIST": {
      "TITLE": "Forms Configuration",
      "SUBTITLE": "Manage your diligence and indulgence questionnaire templates.",
      "SEARCH_PLACEHOLDER": "Search for a form...",
      "NEW": "New",
      "TH_NAME": "Name",
      "TH_TITLE": "Title",
      "TH_TYPE": "Type",
      "TH_CREATION_DATE": "Creation Date",
      "TH_ACTIONS": "Actions",
      "NO_FORM_FOUND": "No forms found.",
      "PREV": "Previous",
      "NEXT": "Next",
      "SHOWING": "Showing",
      "TO": "to",
      "OUT_OF": "out of",
      "RESULTS": "results"
    }
  },
  ar: {
    "DILIGENCE_FORM_LIST": {
      "TITLE": "تكوين النماذج",
      "SUBTITLE": "قم بإدارة قوالب استبيانات العناية الواجبة الخاصة بك.",
      "SEARCH_PLACEHOLDER": "ابحث عن نموذج...",
      "NEW": "جديد",
      "TH_NAME": "الاسم",
      "TH_TITLE": "العنوان",
      "TH_TYPE": "النوع",
      "TH_CREATION_DATE": "تاريخ الإنشاء",
      "TH_ACTIONS": "الإجراءات",
      "NO_FORM_FOUND": "لم يتم العثور على نماذج.",
      "PREV": "السابق",
      "NEXT": "التالي",
      "SHOWING": "عرض من",
      "TO": "إلى",
      "OUT_OF": "من أصل",
      "RESULTS": "نتائج"
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
    console.log(`Updated ${lang}.json with DILIGENCE_FORM_LIST`);
  }
}

// Translate HTML
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-list/diligence-form-list.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Configuration des Formulaires', "{{ 'DILIGENCE_FORM_LIST.TITLE' | translate }}");
html = html.replace("Gérez vos modèles de questionnaires de diligence et d'indulgence.", "{{ 'DILIGENCE_FORM_LIST.SUBTITLE' | translate }}");
html = html.replace('placeholder="Rechercher un formulaire..."', "[placeholder]=\"'DILIGENCE_FORM_LIST.SEARCH_PLACEHOLDER' | translate\"");
html = html.replace('Nouveau', "{{ 'DILIGENCE_FORM_LIST.NEW' | translate }}");
html = html.replace('Nom', "{{ 'DILIGENCE_FORM_LIST.TH_NAME' | translate }}");
html = html.replace('Titre', "{{ 'DILIGENCE_FORM_LIST.TH_TITLE' | translate }}");
html = html.replace('Type', "{{ 'DILIGENCE_FORM_LIST.TH_TYPE' | translate }}");
html = html.replace('Date de Création', "{{ 'DILIGENCE_FORM_LIST.TH_CREATION_DATE' | translate }}");
html = html.replace('Actions', "{{ 'DILIGENCE_FORM_LIST.TH_ACTIONS' | translate }}");
html = html.replace('Aucun formulaire trouvé.', "{{ 'DILIGENCE_FORM_LIST.NO_FORM_FOUND' | translate }}");
html = html.replace(/>\s*Précédent\s*</g, ">{{ 'DILIGENCE_FORM_LIST.PREV' | translate }}<");
html = html.replace(/>\s*Suivant\s*</g, ">{{ 'DILIGENCE_FORM_LIST.NEXT' | translate }}<");
html = html.replace(/<span class="sr-only">Précédent<\/span>/g, "<span class=\"sr-only\">{{ 'DILIGENCE_FORM_LIST.PREV' | translate }}</span>");
html = html.replace(/<span class="sr-only">Suivant<\/span>/g, "<span class=\"sr-only\">{{ 'DILIGENCE_FORM_LIST.NEXT' | translate }}</span>");

html = html.replace(
  'Affichage de <span class="font-bold">{{ startIndex }}</span> à <span class="font-bold">{{ endIndex }}</span> sur <span class="font-bold">{{ totalElements }}</span> résultats',
  "{{ 'DILIGENCE_FORM_LIST.SHOWING' | translate }} <span class=\"font-bold\">{{ startIndex }}</span> {{ 'DILIGENCE_FORM_LIST.TO' | translate }} <span class=\"font-bold\">{{ endIndex }}</span> {{ 'DILIGENCE_FORM_LIST.OUT_OF' | translate }} <span class=\"font-bold\">{{ totalElements }}</span> {{ 'DILIGENCE_FORM_LIST.RESULTS' | translate }}"
);

fs.writeFileSync(htmlPath, html);
console.log('Translated diligence-form-list HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-form-list/diligence-form-list.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule, FormsModule, RouterModule],", "imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
  console.log('Added TranslatePipe to diligence-form-list TS.');
}

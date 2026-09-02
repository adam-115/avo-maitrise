const fs = require('fs');

const TRANSLATIONS = {
  fr: {
    "DILIGENCE_STATUS_LIST": {
      "BREADCRUMB_DASHBOARD": "Tableau de Bord",
      "BREADCRUMB_TRACKING": "Suivi des Diligences",
      "TITLE_PREFIX": "Suivi des ",
      "TITLE_HIGHLIGHT": "Diligences KYC",
      "SUBTITLE": "Consultez l'état d'avancement des questionnaires de diligence réglementaires assignés aux clients, complétez les réponses en attente ou visualisez les soumissions validées.",
      "LOADING": "Chargement du suivi de diligence...",
      "FILTER_BOARD_TITLE": "Filtres de Recherche",
      "FILTER_BOARD_DESC": "Filtrez les statuts de diligence par mot-clé, type de client ou état",
      "SEARCH_PLACEHOLDER": "Rechercher client ou formulaire...",
      "ALL_CLIENT_TYPES": "Tous les Types de Client",
      "TYPE_INDIVIDUAL": "Personne Physique",
      "TYPE_COMPANY": "Société / Entité",
      "TYPE_ASSOCIATION": "Association",
      "TYPE_INSTITUTION": "Institution",
      "ALL_STATUSES": "Tous les Statuts",
      "STATUS_PENDING": "En attente (Pending)",
      "STATUS_SUBMITTED": "Soumis (Submitted)",
      "STATUS_VALIDATED": "Validé (Validated)",
      "TH_CLIENT": "Client",
      "TH_FORM": "Formulaire de Diligence",
      "TH_STATUS": "Statut",
      "TH_LAST_UPDATE": "Dernière mise à jour",
      "TH_ACTIONS": "Actions",
      "BTN_FILL": "Remplir",
      "BTN_VIEW": "Voir réponse",
      "NO_DILIGENCE": "Aucune diligence ne correspond à votre recherche",
      "SHOWING": "Affichage de",
      "TO": "à",
      "OUT_OF": "sur",
      "DILIGENCES": "diligences"
    }
  },
  en: {
    "DILIGENCE_STATUS_LIST": {
      "BREADCRUMB_DASHBOARD": "Dashboard",
      "BREADCRUMB_TRACKING": "Diligence Tracking",
      "TITLE_PREFIX": "Tracking ",
      "TITLE_HIGHLIGHT": "KYC Diligences",
      "SUBTITLE": "View the progress of regulatory diligence questionnaires assigned to clients, complete pending responses, or view validated submissions.",
      "LOADING": "Loading diligence tracking...",
      "FILTER_BOARD_TITLE": "Search Filters",
      "FILTER_BOARD_DESC": "Filter diligence statuses by keyword, client type, or state",
      "SEARCH_PLACEHOLDER": "Search client or form...",
      "ALL_CLIENT_TYPES": "All Client Types",
      "TYPE_INDIVIDUAL": "Individual",
      "TYPE_COMPANY": "Company / Entity",
      "TYPE_ASSOCIATION": "Association",
      "TYPE_INSTITUTION": "Institution",
      "ALL_STATUSES": "All Statuses",
      "STATUS_PENDING": "Pending",
      "STATUS_SUBMITTED": "Submitted",
      "STATUS_VALIDATED": "Validated",
      "TH_CLIENT": "Client",
      "TH_FORM": "Diligence Form",
      "TH_STATUS": "Status",
      "TH_LAST_UPDATE": "Last update",
      "TH_ACTIONS": "Actions",
      "BTN_FILL": "Fill",
      "BTN_VIEW": "View response",
      "NO_DILIGENCE": "No diligence matches your search",
      "SHOWING": "Showing",
      "TO": "to",
      "OUT_OF": "out of",
      "DILIGENCES": "diligences"
    }
  },
  ar: {
    "DILIGENCE_STATUS_LIST": {
      "BREADCRUMB_DASHBOARD": "لوحة القيادة",
      "BREADCRUMB_TRACKING": "تتبع العناية الواجبة",
      "TITLE_PREFIX": "تتبع ",
      "TITLE_HIGHLIGHT": "العناية الواجبة (KYC)",
      "SUBTITLE": "اعرض تقدم استبيانات العناية الواجبة التنظيمية المعينة للعملاء، وأكمل الردود المعلقة، أو اعرض التقديمات المعتمدة.",
      "LOADING": "جاري تحميل تتبع العناية الواجبة...",
      "FILTER_BOARD_TITLE": "فلاتر البحث",
      "FILTER_BOARD_DESC": "قم بتصفية حالات العناية الواجبة حسب الكلمة الرئيسية أو نوع العميل أو الحالة",
      "SEARCH_PLACEHOLDER": "ابحث عن عميل أو نموذج...",
      "ALL_CLIENT_TYPES": "جميع أنواع العملاء",
      "TYPE_INDIVIDUAL": "فرد",
      "TYPE_COMPANY": "شركة / كيان",
      "TYPE_ASSOCIATION": "جمعية",
      "TYPE_INSTITUTION": "مؤسسة",
      "ALL_STATUSES": "جميع الحالات",
      "STATUS_PENDING": "قيد الانتظار (Pending)",
      "STATUS_SUBMITTED": "مُقدم (Submitted)",
      "STATUS_VALIDATED": "مُعتمد (Validated)",
      "TH_CLIENT": "العميل",
      "TH_FORM": "نموذج العناية الواجبة",
      "TH_STATUS": "الحالة",
      "TH_LAST_UPDATE": "آخر تحديث",
      "TH_ACTIONS": "الإجراءات",
      "BTN_FILL": "ملء",
      "BTN_VIEW": "عرض الرد",
      "NO_DILIGENCE": "لا يوجد عناية واجبة تطابق بحثك",
      "SHOWING": "عرض من",
      "TO": "إلى",
      "OUT_OF": "من أصل",
      "DILIGENCES": "عناية واجبة"
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
    console.log(`Updated ${lang}.json with DILIGENCE_STATUS_LIST`);
  }
}

// Translate HTML
const htmlPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-status-list/diligence-status-list.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('Tableau de Bord', "{{ 'DILIGENCE_STATUS_LIST.BREADCRUMB_DASHBOARD' | translate }}");
html = html.replace('Suivi des Diligences', "{{ 'DILIGENCE_STATUS_LIST.BREADCRUMB_TRACKING' | translate }}");
html = html.replace('Suivi des ', "{{ 'DILIGENCE_STATUS_LIST.TITLE_PREFIX' | translate }}");
html = html.replace('Diligences KYC', "{{ 'DILIGENCE_STATUS_LIST.TITLE_HIGHLIGHT' | translate }}");
html = html.replace("Consultez l'état d'avancement des questionnaires de diligence réglementaires assignés aux clients, complétez les réponses en attente ou visualisez les soumissions validées.", "{{ 'DILIGENCE_STATUS_LIST.SUBTITLE' | translate }}");
html = html.replace('Chargement du suivi de diligence...', "{{ 'DILIGENCE_STATUS_LIST.LOADING' | translate }}");
html = html.replace('Filtres de Recherche', "{{ 'DILIGENCE_STATUS_LIST.FILTER_BOARD_TITLE' | translate }}");
html = html.replace('Filtrez les statuts de diligence par mot-clé, type de client ou état', "{{ 'DILIGENCE_STATUS_LIST.FILTER_BOARD_DESC' | translate }}");
html = html.replace('placeholder="Rechercher client ou formulaire..."', "[placeholder]=\"'DILIGENCE_STATUS_LIST.SEARCH_PLACEHOLDER' | translate\"");
html = html.replace('Tous les Types de Client', "{{ 'DILIGENCE_STATUS_LIST.ALL_CLIENT_TYPES' | translate }}");
html = html.replace('>Personne Physique<', ">{{ 'DILIGENCE_STATUS_LIST.TYPE_INDIVIDUAL' | translate }}<");
html = html.replace('>Société / Entité<', ">{{ 'DILIGENCE_STATUS_LIST.TYPE_COMPANY' | translate }}<");
html = html.replace('>Association<', ">{{ 'DILIGENCE_STATUS_LIST.TYPE_ASSOCIATION' | translate }}<");
html = html.replace('>Institution<', ">{{ 'DILIGENCE_STATUS_LIST.TYPE_INSTITUTION' | translate }}<");
html = html.replace('Tous les Statuts', "{{ 'DILIGENCE_STATUS_LIST.ALL_STATUSES' | translate }}");
html = html.replace('>En attente (Pending)<', ">{{ 'DILIGENCE_STATUS_LIST.STATUS_PENDING' | translate }}<");
html = html.replace('>Soumis (Submitted)<', ">{{ 'DILIGENCE_STATUS_LIST.STATUS_SUBMITTED' | translate }}<");
html = html.replace('>Validé (Validated)<', ">{{ 'DILIGENCE_STATUS_LIST.STATUS_VALIDATED' | translate }}<");
html = html.replace('>Client<', ">{{ 'DILIGENCE_STATUS_LIST.TH_CLIENT' | translate }}<");
html = html.replace('>Formulaire de Diligence<', ">{{ 'DILIGENCE_STATUS_LIST.TH_FORM' | translate }}<");
html = html.replace('>Statut<', ">{{ 'DILIGENCE_STATUS_LIST.TH_STATUS' | translate }}<");
html = html.replace('>Dernière mise à jour<', ">{{ 'DILIGENCE_STATUS_LIST.TH_LAST_UPDATE' | translate }}<");
html = html.replace('>Actions<', ">{{ 'DILIGENCE_STATUS_LIST.TH_ACTIONS' | translate }}<");
html = html.replace("item.status === 'PENDING' ? 'Remplir' : 'Voir réponse'", "item.status === 'PENDING' ? ('DILIGENCE_STATUS_LIST.BTN_FILL' | translate) : ('DILIGENCE_STATUS_LIST.BTN_VIEW' | translate)");
html = html.replace('Aucune diligence ne correspond à votre recherche', "{{ 'DILIGENCE_STATUS_LIST.NO_DILIGENCE' | translate }}");
html = html.replace('Affichage de {{ startIndex }} à {{ endIndex }} sur {{ filteredStatuses.length }} diligences', 
  "{{ 'DILIGENCE_STATUS_LIST.SHOWING' | translate }} {{ startIndex }} {{ 'DILIGENCE_STATUS_LIST.TO' | translate }} {{ endIndex }} {{ 'DILIGENCE_STATUS_LIST.OUT_OF' | translate }} {{ filteredStatuses.length }} {{ 'DILIGENCE_STATUS_LIST.DILIGENCES' | translate }}");

fs.writeFileSync(htmlPath, html);
console.log('Translated diligence-status-list HTML.');

// Add TranslatePipe to TS
const tsPath = 'd:/avo-maitrise/front/src/app/due-diligence/diligence-status-list/diligence-status-list.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');
if (!ts.includes('TranslatePipe')) {
  ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { TranslatePipe, TranslateDirective } from '@ngx-translate/core';");
  ts = ts.replace("imports: [CommonModule, FormsModule, RouterModule],", "imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, TranslateDirective],");
  fs.writeFileSync(tsPath, ts);
  console.log('Added TranslatePipe to diligence-status-list TS.');
}

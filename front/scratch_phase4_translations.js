const fs = require('fs');

const TRANSLATIONS = {
  en: {
    "AML_STATUS": {
      "AML_REQUIRED": "AML Required",
      "VERIFICATION_AML_REQUIRED": "AML Verification",
      "AML_VALIDATED": "AML Validated",
      "INDULGENCE_REQUIRED": "Diligence Request",
      "VALIDATED": "Validated",
      "BLOCKED": "Blocked"
    },
    "AML_COMPLIANCE": {
      "BREADCRUMB_DASHBOARD": "Dashboard",
      "BREADCRUMB_AML": "AML Compliance",
      "TITLE_PREFIX": "Tracking ",
      "TITLE_HIGHLIGHT": "Compliance (AML / KYC)",
      "SUBTITLE": "Analyze your firm's overall AML situation, view risk levels by sector, and oversee sanctions screening.",
      "BTN_TRIGGER_CLIENTS": "Launch Client Verification",
      "BTN_REPORT_CLIENTS": "Clients Report (PDF)",
      "BTN_REPORT_UBOS": "UBOs Report (PDF)",
      "LOADING_TEXT": "Loading compliance indicators...",
      "KPI_COMPLIANCE_RATE": "Compliance Rate",
      "KPI_COMPLIANCE_DESC": "of validated clients",
      "KPI_ALERTS": "Sanction Alerts",
      "KPI_ALERTS_PENDING": "pending matches",
      "KPI_ALERTS_REQ": "Immediate sanction reviews required.",
      "KPI_ALERTS_NO_HIT": "No unresolved critical hits.",
      "KPI_PENDING_REVIEW": "Matters under Review",
      "KPI_PENDING_DESC": "awaiting approval",
      "KPI_PENDING_FORMS": "forms to fill",
      "KPI_AVG_RISK": "Avg Risk Score",
      "KPI_AVG_RISK_DESC": "average screening score",
      "CHART_SECTOR_TITLE": "Top Exposed Business Sectors",
      "CHART_SECTOR_DESC": "Average sanctions screening score by sector",
      "VOL": "Vol: ",
      "AVG_SCORE": " - Avg score: ",
      "NO_SECTORS": "No business sectors listed.",
      "CHART_TYPE_TITLE": "Distribution by Categories",
      "CHART_TYPE_DESC": "Proportion of registered clients by entity type",
      "NO_TYPES": "No client types registered.",
      "TABLE_TITLE": "Client Dashboard",
      "TABLE_DESC": "Examine the individual status of each client and apply compliance decisions",
      "SEARCH_PLACEHOLDER": "Search client...",
      "FILTER_ALL_TYPES": "All Types",
      "FILTER_TYPE_PERSON": "Individual",
      "FILTER_TYPE_COMPANY": "Company / Entity",
      "FILTER_TYPE_ASSOCIATION": "Association",
      "FILTER_TYPE_INSTITUTION": "Institution",
      "FILTER_ALL_STATUS": "All Statuses",
      "FILTER_ALL_RISKS": "All Risks",
      "FILTER_RISK_HIGH": "High Risk (>=70%)",
      "FILTER_RISK_MEDIUM": "Medium Risk (40-69%)",
      "FILTER_RISK_LOW": "Low Risk (<40%)",
      "TH_CLIENT": "Client",
      "TH_TYPE_SECTOR": "Type & Sector",
      "TH_MATCHES": "Sanction Matches",
      "TH_STATUS": "AML Status (Decision)",
      "TH_ACTIONS": "Actions",
      "UNKNOWN_COUNTRY": "Unknown country",
      "NO_SECTOR": "No sector",
      "HITS": "hit(s)",
      "MAX_SCORE": "Max score: ",
      "TOOLTIP_CLIENT_SHEET": "Client Profile",
      "TOOLTIP_KYC_DOSSIER": "KYC Diligence File",
      "TOOLTIP_DOWNLOAD_PDF": "Download AML-CFT Sheet (PDF)",
      "NO_CLIENTS_FOUND": "No clients match the filtering criteria.",
      "PAGINATION_SHOWING": "Showing",
      "PAGINATION_FROM": "(from ",
      "PAGINATION_TO": " to ",
      "PAGINATION_OUT_OF": " out of ",
      "PAGINATION_CLIENTS": " clients)",
      "MODAL_TITLE_UBO": "AML-CFT Audit Report (UBOs)",
      "MODAL_TITLE_CLIENT": "AML-CFT Audit Report (Clients)",
      "MODAL_SUBTITLE": "Generated via JasperReports",
      "MODAL_DESC_UBO": "Select the analysis period for the AML status of your Ultimate Beneficial Owners (UBOs). If dates are empty, the report defaults to the last 2 years.",
      "MODAL_DESC_CLIENT": "Select the analysis period for the AML status of your clients. If dates are empty, the report defaults to the last 2 years.",
      "MODAL_START_DATE": "Start Date",
      "MODAL_END_DATE": "End Date",
      "MODAL_CANCEL": "Cancel",
      "MODAL_GENERATING": "Generating...",
      "MODAL_DOWNLOAD": "Download PDF",
      "ALERTS": {
        "CONFIRM_TITLE": "Update status?",
        "CONFIRM_MSG": "Are you sure you want to change the compliance status of this client to '{{status}}'?",
        "UPDATE_SUCCESS": "Compliance status successfully updated.",
        "UPDATE_ERROR": "Failed to update status",
        "ERROR": "Error",
        "GENERATING_PDF": "Generating",
        "GENERATING_PDF_MSG": "Preparing AML-CFT sheet for {{name}}...",
        "PDF_SUCCESS": "AML-CFT sheet downloaded.",
        "PDF_ERROR": "Error downloading the report",
        "LAUNCH": "Launch",
        "CLIENT_SCREENING_MSG": "Client screening in progress...",
        "CLIENT_SCREENING_SUCCESS": "Manual client screening successfully completed.",
        "CLIENT_SCREENING_ERROR": "Failed to launch client screening",
        "UBO_SCREENING_MSG": "UBO screening in progress...",
        "UBO_SCREENING_SUCCESS": "Manual UBO screening successfully completed.",
        "UBO_SCREENING_ERROR": "Failed to launch UBO screening",
        "UBO_REPORT_MSG": "Creating AML UBO audit report (JasperReports)...",
        "CLIENT_REPORT_MSG": "Creating AML Clients audit report (JasperReports)...",
        "UBO_REPORT_SUCCESS": "AML UBO report successfully generated and downloaded.",
        "CLIENT_REPORT_SUCCESS": "AML Clients report successfully generated and downloaded.",
        "UBO_REPORT_ERROR": "Failed to generate UBO report",
        "CLIENT_REPORT_ERROR": "Failed to generate Clients report"
      }
    }
  }
};

['es', 'de', 'it', 'ar'].forEach(lang => {
  TRANSLATIONS[lang] = JSON.parse(JSON.stringify(TRANSLATIONS.en));
});

const basePath = 'd:/avo-maitrise/front/public/assets/i18n';

for (const [lang, translations] of Object.entries(TRANSLATIONS)) {
  const filePath = `${basePath}/${lang}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(data, translations);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json with Phase 4 keys`);
  }
}

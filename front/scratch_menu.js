const fs = require('fs');

const MENU_TRANSLATIONS = {
  en: {
    "HOME": "Home",
    "AML": "Compliance (AML)",
    "DILIGENCE_TRACKING": "Diligence Tracking",
    "CALENDAR": "Judicial Calendar",
    "DOSSIER": "Case Management",
    "CLIENTS": "Client Management",
    "MODEL": "Document Management (DMS)",
    "BILLING": "Billing",
    "BILLING_DASHBOARD": "Billing Dashboard",
    "ADMINISTRATION": "Administration",
    "LOGOUT": "Log Out"
  },
  es: {
    "HOME": "Inicio",
    "AML": "Cumplimiento (AML)",
    "DILIGENCE_TRACKING": "Seguimiento de Diligencia",
    "CALENDAR": "Calendario Judicial",
    "DOSSIER": "Gestión de Expedientes",
    "CLIENTS": "Gestión de Clientes",
    "MODEL": "Gestión Documental (DMS)",
    "BILLING": "Facturación",
    "BILLING_DASHBOARD": "Panel de Facturación",
    "ADMINISTRATION": "Administración",
    "LOGOUT": "Cerrar Sesión"
  },
  de: {
    "HOME": "Startseite",
    "AML": "Compliance (AML)",
    "DILIGENCE_TRACKING": "Sorgfaltspflicht-Tracking",
    "CALENDAR": "Justizkalender",
    "DOSSIER": "Fallmanagement",
    "CLIENTS": "Kundenmanagement",
    "MODEL": "Dokumentenmanagement (DMS)",
    "BILLING": "Abrechnung",
    "BILLING_DASHBOARD": "Abrechnungs-Dashboard",
    "ADMINISTRATION": "Verwaltung",
    "LOGOUT": "Abmelden"
  },
  it: {
    "HOME": "Home",
    "AML": "Conformità (AML)",
    "DILIGENCE_TRACKING": "Tracciamento Diligenza",
    "CALENDAR": "Calendario Giudiziario",
    "DOSSIER": "Gestione Fascicoli",
    "CLIENTS": "Gestione Clienti",
    "MODEL": "Gestione Documentale (DMS)",
    "BILLING": "Fatturazione",
    "BILLING_DASHBOARD": "Dashboard Fatturazione",
    "ADMINISTRATION": "Amministrazione",
    "LOGOUT": "Disconnettersi"
  }
};

const basePath = 'd:/avo-maitrise/front/public/assets/i18n';

for (const [lang, translations] of Object.entries(MENU_TRANSLATIONS)) {
  const filePath = `${basePath}/${lang}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data['MENU'] = translations;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json for MENU`);
  }
}

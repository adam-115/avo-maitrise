const fs = require('fs');

const CALENDAR_TRANSLATIONS = {
  fr: {
    "TITLE": "Calendrier Judiciaire",
    "DAY_VIEW": "Vue Jour",
    "WEEK_VIEW": "Vue Semaine",
    "AGENDA_DAY": "Agenda du Jour",
    "AGENDA_WEEK": "Réunion de la Semaine",
    "ADD_MEETING": "Ajouter une réunion",
    "TODAY": "Aujourd'hui",
    "CURRENT_WEEK": "Semaine en Cours",
    "HOURS": "Heures",
    "TIME": "Heure :",
    "DELETE": "Supprimer",
    "NO_HEARINGS_TODAY": "Aucune audience prévue pour ce jour.",
    "NO_HEARINGS": "Aucune audience.",
    "STATUS_LEGEND": "Légende Statut :",
    "URGENT": "Urgent",
    "STANDARD": "Standard",
    "POSTPONED": "Reporté"
  },
  en: {
    "TITLE": "Judicial Calendar",
    "DAY_VIEW": "Day View",
    "WEEK_VIEW": "Week View",
    "AGENDA_DAY": "Agenda of the Day",
    "AGENDA_WEEK": "Meetings of the Week",
    "ADD_MEETING": "Add a meeting",
    "TODAY": "Today",
    "CURRENT_WEEK": "Current Week",
    "HOURS": "Hours",
    "TIME": "Time :",
    "DELETE": "Delete",
    "NO_HEARINGS_TODAY": "No hearings scheduled for this day.",
    "NO_HEARINGS": "No hearings.",
    "STATUS_LEGEND": "Status Legend:",
    "URGENT": "Urgent",
    "STANDARD": "Standard",
    "POSTPONED": "Postponed"
  },
  es: {
    "TITLE": "Calendario Judicial",
    "DAY_VIEW": "Vista Diaria",
    "WEEK_VIEW": "Vista Semanal",
    "AGENDA_DAY": "Agenda del Día",
    "AGENDA_WEEK": "Reuniones de la Semana",
    "ADD_MEETING": "Agregar una reunión",
    "TODAY": "Hoy",
    "CURRENT_WEEK": "Semana Actual",
    "HOURS": "Horas",
    "TIME": "Hora :",
    "DELETE": "Eliminar",
    "NO_HEARINGS_TODAY": "No hay audiencias programadas para este día.",
    "NO_HEARINGS": "Sin audiencias.",
    "STATUS_LEGEND": "Leyenda de Estado:",
    "URGENT": "Urgente",
    "STANDARD": "Estándar",
    "POSTPONED": "Pospuesto"
  },
  de: {
    "TITLE": "Justizkalender",
    "DAY_VIEW": "Tagesansicht",
    "WEEK_VIEW": "Wochenansicht",
    "AGENDA_DAY": "Tagesordnung",
    "AGENDA_WEEK": "Wöchentliche Treffen",
    "ADD_MEETING": "Treffen hinzufügen",
    "TODAY": "Heute",
    "CURRENT_WEEK": "Aktuelle Woche",
    "HOURS": "Stunden",
    "TIME": "Uhrzeit :",
    "DELETE": "Löschen",
    "NO_HEARINGS_TODAY": "Für diesen Tag sind keine Anhörungen geplant.",
    "NO_HEARINGS": "Keine Anhörungen.",
    "STATUS_LEGEND": "Statuslegende:",
    "URGENT": "Dringend",
    "STANDARD": "Standard",
    "POSTPONED": "Verschoben"
  },
  it: {
    "TITLE": "Calendario Giudiziario",
    "DAY_VIEW": "Vista Giorno",
    "WEEK_VIEW": "Vista Settimana",
    "AGENDA_DAY": "Agenda del Giorno",
    "AGENDA_WEEK": "Riunioni della Settimana",
    "ADD_MEETING": "Aggiungi una riunione",
    "TODAY": "Oggi",
    "CURRENT_WEEK": "Settimana Corrente",
    "HOURS": "Ore",
    "TIME": "Ora :",
    "DELETE": "Elimina",
    "NO_HEARINGS_TODAY": "Nessuna udienza prevista per questo giorno.",
    "NO_HEARINGS": "Nessuna udienza.",
    "STATUS_LEGEND": "Legenda Stato:",
    "URGENT": "Urgente",
    "STANDARD": "Standard",
    "POSTPONED": "Rinviato"
  }
};

const basePath = 'd:/avo-maitrise/front/public/assets/i18n';

for (const [lang, translations] of Object.entries(CALENDAR_TRANSLATIONS)) {
  const filePath = `${basePath}/${lang}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data['CALENDAR'] = translations;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json for CALENDAR`);
  }
}

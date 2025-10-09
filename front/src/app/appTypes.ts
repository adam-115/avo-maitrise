// tab dossier type for dossier details component
export enum DossierTabType {
  VUE_ENSEMBLE = 'VUE_ENSEMBLE',
  Document = 'DOCUMENT',
  TEMP_FACTURATION = 'TEMP_FACTURATION',
  EVENEMENT = 'EVENEMENT',
  TACHE = 'TACHE',
  NOTE = 'NOTE',
  CONTACT = 'CONTACT',
  FACTURE = 'FACTURE'
}
// contact type for contact Dialog component
export enum ContactTypeCreation {
  NOUVEAU = 'NOUVEAU',
  EXISTANT = 'EXISITANT'
}


export enum ClientType {
  PESONNE = 'PERSONNE',
  SOCIETE = 'SOCIETE',
  INSTITUTION = 'INSTITUTION'
}

// contact interface for crm component
export interface Contact {
  id: number;
  type: 'PERSONNE' | 'SOCIETE' | 'INSTITUTION';
  name: string;
  role: string; // Ex: Client, Avocat Tiers, Juge
  amlRisk: 'FAIBLE' | 'MOYEN' | 'ELEVEE' | 'NUL';
  complianceStatus: 'OK' | 'PENDING' | 'ALERT';
  country: string;
  lastUpdated: string; // Date
}

// detailed client interface for client details component

export interface ClientDetail {
  // NOUVEAUX INDICATEURS
  totalFiles: number; // Nombre total de fichiers dans le dossier
  activeCases: number; // Nombre de dossiers ouverts / actifs
  internalContactsCount: number; // Nombre de personnes du cabinet en relation avec ce client
  clientContactsCount: number; // Nombre de points de contact côté client
  documentsToReview: number; // Documents en attente de validation (ex: Kbis mis à
  id: number;
  type: 'PERSONNE' | 'SOCIETE' | 'INSTITUTION';
  name: string;
  firstName: string; // Ajout
  legalForm?: string; // Ajout pour SOCIETE
  siren?: string;     // Ajout pour SOCIETE
  role: string;
  email: string;
  phone: string;
  address: string;
  country: string;

  // Section AML/KYC Détaillée
  amlRisk: 'FAIBLE' | 'MOYEN' | 'ELEVEE' | 'NUL';
  complianceStatus: 'OK' | 'PENDING' | 'ALERT';
  isPEP: boolean; // Ajout
  fundsOrigin: string; // Ajout
  beneficialOwners: string; // Ajout pour SOCIETE
  complianceNotes: string; // Ajout
  validationDate: string; // Ajout
  archivingStatus: 'COMPLETED' | 'PENDING'; // Ajout
  createdAt: Date; // Date de création du client
  updatedAt: Date; // Date de dernière mise à jour du client
  contacts: [],
  notes: string,
  history: [],
  isActive: true,
  sector: string,
  registrationNumber: string,
}
// Interface pour définir la structure d'une Audience Judiciaire
export  interface Hearing {
  id: number;
  title: string;
  clientCase: string;
  time: string; // Heure de début "HH:mm"
  endTime: string; // Heure de fin "HH:mm"
  location: string;
  status: 'Urgent' | 'Standard' | 'Reporté';
  date: Date;
  style?: any; // Contient les styles calculés: { top: '...', height: '...', width: '...', left: '...' }
}

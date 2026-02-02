// for test abstract crud service
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}


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


// export enum ClientType {
//   PESONNE = 'PERSONNE',
//   SOCIETE = 'SOCIETE',
//   INSTITUTION = 'INSTITUTION'
// }

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

export interface BaseClientDetail {
  id?: number;
  email: string;
  phone: string;
  address: string;
  country: string;

  // Role & Compliance
  role: string;
  amlRisk: 'FAIBLE' | 'MOYEN' | 'ELEVEE' | 'NUL';
  complianceStatus: 'OK' | 'PENDING' | 'ALERT';
  complianceNotes: string;
  isPEP: boolean;
  fundsOrigin: string;
  validationDate: string;
  archivingStatus: 'COMPLETED' | 'PENDING';

  // Metadata
  totalFiles: number;
  activeCases: number;
  internalContactsCount: number;
  clientContactsCount: number;
  documentsToReview: number;

  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  notes: string;
  history: any[];
  contacts: any[];
}

export interface ClientPhysique extends BaseClientDetail {
  type: 'PERSONNE';
  name: string; // Full name or display name
  firstName: string;
  lastName: string;
  birthDate?: string;
  identityNumber?: string;
  sector?: string;
}

export interface ClientSociete extends BaseClientDetail {
  type: 'SOCIETE';
  name: string; // Denomination
  siren: string;
  legalForm?: string;
  sector?: string;
  beneficialOwners?: string;
}

export interface ClientInstitution extends BaseClientDetail {
  type: 'INSTITUTION';
  name: string; // Name of institution
  typeOrganisme?: string; // e.g. 'Mairie', 'Tribunal'
}

export type ClientDetail = ClientPhysique | ClientSociete | ClientInstitution;

// Interface pour définir la structure d'une Audience Judiciaire
export interface Hearing {
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



// configuration des formulaires AML

export type InputType = 'select' | 'checkbox' | 'radio' | 'uploadFile';
// icon type for alert service
export type IconType = "success" | "error" | "warning" | "info" | "question";

// configuration des formulaires AML
export interface AmlFormConfig {
  id?: number,
  formName: string,
  formTitle: string,
  formDescription: string,
  order: number,
  inputConfigs: AmlInputConfig[],
  typeClient?: string;
  secteurActivite?: string;
}

export interface AmlInputConfig {
  id?: string;
  type: InputType;
  name: string; // Added property for the form control name it must be unique
  score?: number;// used for upload
  facteur: number,
  required: boolean;
  labelMessage: string;
  placeholder?: string;
  options?: AMLInputOption[]; // for select , radio , checkbox
  errorMessage?: string;
  customStyle?: string;
  defaultValue?: any;
  displayOrer?: number;
  optionsLayout?: 'block' | 'inline';
}

// used for the check box
export interface AMLInputOption {
  id?: string;
  name?: string;
  AmlInputConfigId?: number;
  value: string;
  score: number;
  order?: number;
}

export interface AmlFormResult {
  id?: number;
  amlFormConfigID?: number;
  totalScore?: number;
  riskLevel?: 'Faible' | 'Modéré' | 'Élevé';
  AmlPageConfigValues?: AmlInputValue[];
}

export interface AmlInputValue {
  id?: number,
  amlFormConfig?: number;
  InputConfigID: string;
  value: string;
}


// Interface pour le suivi du score par champ (simplifiée pour l'affichage)
export interface FieldScore {
  name: string;
  label: string;
  facteur: number;
  scoreObtenu: number;
}


//### partie configuration
// configuration du type client

export interface TypeClient {
  id?: number,
  libelle: string,
  code?: string,
  ordre_affichage: number,
  actif: boolean,
  created_at: Date,
}

export interface SecteurActivite {
  id?: number;
  code: string;           // ex: 'IMMOBILIER', 'FINTECH'
  libelle: string;        // ex: 'Promotion Immobilière'
  ordre_affichage: number;
  actif: boolean;
  created_at?: Date;
}

export interface TypeOrganisme {
  id?: number;
  code: string;
  libelle: string;
  ordre_affichage: number;
  actif: boolean;
  created_at?: Date;
}


export interface Document {
  id?: number,
  title: string,
  name: string,
  description?: string,
  tags?: string,
  file: File,
}



export interface MappingForm {
  id?: number;
  typeClient: 'PERSONNE' | 'SOCIETE' | 'INSTITUTION';
  secteurActivite: string;
  amlFormConfigID: number;
}



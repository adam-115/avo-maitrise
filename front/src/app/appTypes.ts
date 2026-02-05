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
  typeOrganisme?: string;
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
  clientId?: string;
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

export enum ClientTypeEnum {
  PERSONNE = 'PERSONNE',
  SOCIETE = 'SOCIETE',
  INSTITUTION = 'INSTITUTION',
  ASSOCIATION = 'ASSOCIATION'
}

export interface SecteurActivite {
  id?: number;
  code: string;           // ex: 'IMMOBILIER', 'FINTECH'
  libelle: string;        // ex: 'Promotion Immobilière'
  ordre_affichage: number;
  actif: boolean;
  riskNaturel: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  created_at?: Date;
}

export interface UBO {
  nom: string;
  partDetention: number; // Percentage
  isPPE: boolean; // Personne Politiquement Exposée
}

export interface ContactPoint {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  occupation: string;
}

export interface Client {
  id: string | number;
  type: ClientTypeEnum;
  secteurActivite: string; // Could be ID or Code
  paysResidance: string;
  riskScore: number;
  ubos?: UBO[]; // Optional, mostly for legal entities
  contacts?: ContactPoint[];
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
  typeClient: ClientTypeEnum | 'PERSONNE' | 'SOCIETE' | 'INSTITUTION' | 'ASSOCIATION'; // Keeping string literal union for backward compatibility if needed, or switch to Enum
  secteurActivite: string;
  amlFormConfigID: number;
}



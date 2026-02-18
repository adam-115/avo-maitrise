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
  typeClient?: ClientTypeEnum;
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
  creationDate?: Date;
  lastUpdateDate?: Date;
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
  prenom?: string;
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
  id: string;
  type: ClientTypeEnum;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  secteurActivite: string; // Could be ID or Code
  paysResidance: string;
  riskScore: number;
  ubos?: UBO[]; // Optional, mostly for legal entities
  contacts?: ContactPoint[];
  clientStatus?: ClientStatus;
  documents?: Document[];
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
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  tags?: string;
  file?: File;
  label?: string;
  filename?: string;
  date?: Date;
}



export interface MappingForm {
  id?: number;
  typeClient: ClientTypeEnum | 'PERSONNE' | 'SOCIETE' | 'INSTITUTION' | 'ASSOCIATION'; // Keeping string literal union for backward compatibility if needed, or switch to Enum
  secteurActivite: string;
  amlFormConfigID: number;
}

export enum ClientStatus {
  // Phase de Création
  AML_REQUIRED = 'AML_REQUIRED', // Client créé, mais questionnaire AML non rempli.

  // Phase de Traitement AML
  VERIFICATION_AML_REQUIRED = 'VERIFICATION_AML_REQUIRED', // Formulaire rempli, score calculé, en attente de revue.
  AML_VALIDATED = 'AML_VALIDATED',               // Conformité validée (standard).

  // Phase d'Indulgence (Dérogation)
  INDULGENCE_REQUIRED = 'INDULGENCE_REQUIRED',   // Le client nécessite une validation spéciale (ex: risque élevé).
  INDULGENCE_VALIDATED = 'INDULGENCE_VALIDATED', // L'associé a accepté de prendre le client malgré le risque.

  // Phase Finale
  VALIDATED = 'VALIDATED',                       // Dossier complet et accepté. Le client est opérationnel.
  BLOCKED = 'BLOCKED'                            // Client rejeté ou gelé pour non-conformité majeure.
}


//****** Indilgence part  ******/
// export interface FormElement {
//   id: string;
//   type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'label';
//   label: string;
//   placeholder?: string;
//   options?: string[]; // Pour select/radio
//   value?: any;
//   required?: boolean;
// }


export enum FormType {
  AML = 'AML',
  INDULGENCE = 'INDULGENCE',
}


export interface FormConfig {
  id?: string;
  type: FormType;
  name: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  creationDate: Date;
  lastUpdateDate: Date;
}



// field-config.model.ts
export interface FieldConfig {
  id?: string;
  name?: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  required: boolean;
  errorMessage: string;
  placeholder?: string;
  options?: FieldOption[]; // Pour select et radio
}


export interface FieldOption {
  id?: string;
  name?: string;
  fieldConfigId?: number;
  value: any;
}

export interface FieldResult {
  id?: number;
  fieldConfigId: string;
  fieldOptionId?: string;
  value: any;
}



export interface DiligenceFormResult {
  id?: string;
  formConfigId: string;
  clientId?: string;
  creationDate: Date;
  lastUpdateDate: Date;
  fieldResults: FieldResult[];
}

export interface ClientDiligenceStatus {
  id?: string;
  clientId: string;
  formConfigId: string;
  status: 'PENDING' | 'SUBMITTED' | 'VALIDATED';
  resultId?: string; // Optional, link to the submission
}


// gestion ds dossier

export interface StatutDossier {
  id: string;
  label: string;
  code: string;   // OUVERT, EN_COURS, etc.
  color?: string; // Optional for UI display
  active: boolean;
  order: number;
}


export interface DossierPriorite {
  id: string;
  label: string;
  code: string;
  color?: string;
  active: boolean;
  order: number;
}


export interface DomaineJuridique {
  id: string;
  label: string;
  code: string;
  color?: string;
  active: boolean;
  order: number;
}


export interface Dossier {
  id?: number;
  referenceInterne: string;    // Ex: 2026-0045 (Généré automatiquement)
  titre: string;               // Nom du dossier (ex: Litige Commercial Dupont vs Durand)
  description?: string;

  // Relations
  clientId: string | number;   // ID du client rattaché
  responsableId: string;       // ID de l'avocat responsable (associé)
  intervenantsIds: string[];   // Liste des collaborateurs travaillant sur le dossier

  // Classification
  domaineJuridique: string;    // Ex: Droit des Affaires, Droit Social, Immobilier
  prioriteID: string; // Relies on DossierPriorite.code or DossierPriorite.id
  statutID: string; // Relies on StatutDossier.code or StatutDossier.id

  // Compliance AML
  amlValidated: boolean;       // Indique si le KYC client a été validé pour ce dossier
  riskLevel: 'FAIBLE' | 'MODERE' | 'ELEVE'; // Hérité du score client ou spécifique au dossier

  documents: Document[]; // les documents du dossier

  // Dates
  dateOuverture: Date;
  dateCloture?: Date;
  updated_at: Date;

  // Données Financières (Optionnel)
  budgetEstime?: number;
  tauxHoraireApplique?: number;
  methodeFacturation: 'HORAIRE' | 'FORFAIT' | 'RESULTAT';

  // Métadonnées
  tags?: string[];             // Pour la recherche rapide
}

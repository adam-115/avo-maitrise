export enum UserRole {
  ADMIN = 'ADMIN',             // Accès complet : configuration AML, gestion utilisateurs
  ASSOCIE = 'ASSOCIE',         // Accès total aux dossiers, validation des indilgences
  AVOCAT = 'AVOCAT',           // Gestion de ses propres dossiers et dossiers partagés
  COLLABORATEUR = 'COLLABORATEUR', // Travail sur les dossiers assignés
  SECRETARIAT = 'SECRETARIAT', // Création clients, upload documents, pas d'accès AML critique
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER' // Focus exclusif sur le scoring et les risques
}

export interface User {
  id: string | number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;

  photo?: Document;
  photoBlob?: string; // Représente la photo en base64 ou sous forme de blob textuel

  // Spécificités Cabinet
  barreauId?: string;          // Numéro de toque ou identifiant au barreau
  phoneNumber?: string;
  gsm?: string;
  address?: string;
  isPartner: boolean;          // Indique si l'utilisateur est associé

  // Paramètres Système
  isActive: boolean;
  avatarUrl?: string;
  lastLogin?: Date;

  // Sécurité
  twoFactorEnabled: boolean;
  createdAt: Date;
}

// tab dossier type for dossier details component
export enum DossierTabType {
  VUE_ENSEMBLE = 'VUE_ENSEMBLE',
  Document = 'DOCUMENT',
  // TEMP_FACTURATION = 'TEMP_FACTURATION',
  EVENEMENT = 'EVENEMENT',
  TACHE = 'TACHE',
  NOTE = 'NOTE',
  CONTACT = 'CONTACT',
  ACTIVITY = 'ACTIVITY'
}
// contact type for contact Dialog component
export enum ContactTypeCreation {
  NOUVEAU = 'NOUVEAU',
  EXISTANT = 'EXISITANT'
}




// Interface pour définir la structure d'une Audience Judiciaire
export interface Appointement {
  id: number | string;
  title: string;
  clientCase: string; // Keep for backward compatibility or simple display
  clientId?: number | string;      // ID of the related client
  dossierId?: number | string; // ID of the related dossier
  time: string; // Heure de début "HH:mm"
  endTime: string; // Heure de fin "HH:mm"
  location: string;
  status: 'Urgent' | 'Standard' | 'Reporté';
  date: Date;
  style?: any; // Contient les styles calculés: { top: '...', height: '...', width: '...', left: '...' }
}

// icon type for alert service
export type IconType = "success" | "error" | "warning" | "info" | "question";



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
  ordreAffichage: number;
  actif: boolean;
  createdAt?: Date;
}

export interface UBO {
  id?: number;
  fullName: string;
  dateOfBirth?: Date;
  nationality?: string;
  roleInCompany?: string;
  percentageOfOwnership?: number;
  amlAnalysisStatus?: 'TODO' | 'OK' | 'SUSPECT' | 'BLOCKED';

  // Compatibility fields
  nom?: string;
  prenom?: string;
  partDetention?: number;
  isPPE?: boolean;
}

export interface ContactPoint {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  occupation: string;
  adresse?: string;
}

export interface Client {
  id?: number;
  type?: ClientTypeEnum;
  email?: string;
  telephone?: string;
  adresse?: string;
  pays?: string;
  paysResidance?: string; // Alias for pays (deprecated)

  // Common collections
  documents?: Document[];
  ubos?: UBO[]; // For compatibility with ClientFormComponent
  
  // Additional fields for frontend logic
  clientStatus?: ClientStatus;
  secteurActivite?: string;
  contacts?: ContactPoint[];
}

export interface ClientPersonnePhysique extends Client {
  nom?: string;
  prenom?: string;
  nationalite?: string;
  cin?: string;
  dateNaissance?: Date;
}

export interface ClientMoral extends Client {
  nomCommercial?: string;
  formeJuridique?: string;
  numeroRegistreCommerce?: string;
  numeroIdFiscal?: string;
  nomRepresentantLegal?: string;
  prenomRepresentantLegal?: string;
  nationaliteRepresentantLegal?: string;
  cinRepresentantLegal?: string;
  dateNaissanceRepresentantLegal?: Date;
  ubos?: UBO[];
}

export interface Association extends Client {
  nom?: string;
  numeroRegistreNational?: string;
  numeroIdFiscal?: string;
  nomRepresentantLegal?: string;
  prenomRepresentantLegal?: string;
  nationaliteRepresentantLegal?: string;
  cinRepresentantLegal?: string;
  dateNaissanceRepresentantLegal?: Date;
}

export interface Institution extends Client {
  nom?: string;
  numeroRegistreNational?: string;
  numeroIdFiscal?: string;
  nomRepresentantLegal?: string;
  prenomRepresentantLegal?: string;
  nationaliteRepresentantLegal?: string;
  cinRepresentantLegal?: string;
  dateNaissanceRepresentantLegal?: Date;
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
  nomFichier?: string;
  typeDocument?: string;
  urlStockage?: string;
  dateUpload?: Date;
  estValide?: boolean;
  filename?: string; // For compatibility
  
  // Frontend specific fields (for file upload & compatibility)
  title?: string;
  name?: string;
  label?: string; // For DocumentComponent
  description?: string;
  file?: File;
  tags?: string; // For DocumentDialog
  date?: Date; // For legacy DocumentComponent
  fileData?: string; // Base64 content for backend BLOB
  clientId?: number;
  dossierId?: string | number;
}



export enum ClientStatus {
  // Phase de Création
  AML_REQUIRED = 'AML_REQUIRED', // Client créé, mais questionnaire AML non rempli.

  // Phase de Traitement AML
  VERIFICATION_AML_REQUIRED = 'VERIFICATION_AML_REQUIRED', // Formulaire rempli, score calculé, en attente de revue.
  AML_VALIDATED = 'AML_VALIDATED',               // Conformité validée (standard).

  // Phase d'Indulgence (Dérogation)
  INDULGENCE_REQUIRED = 'INDULGENCE_REQUIRED',   // Le client nécessite une validation spéciale (ex: risque élevé).
  VALIDATED = 'VALIDATED',                       // Dossier complet et accepté. Le client est opérationnel.
  BLOCKED = 'BLOCKED'                            // Client rejeté ou gelé pour non-conformité majeure.
}


//ScreeningMatches

export enum ScreeningExecutionStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED'
}

export enum ScreeningMatchStatus {
  PENDING = 'PENDING',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  TRUE_POSITIVE = 'TRUE_POSITIVE',
  DILIGENCE_REQUIRED = 'DILIGENCE_REQUIRED',
  NO_LONGER_SANCTIONED = 'NO_LONGER_SANCTIONED'
}

export interface Notification {
  id?: number;
  title: string;
  message: string;
  clientId?: number;
  createdAt: Date;
  isRead: boolean;
}

export interface ScreeningExecutionDTO {
  id?: number;
  clientEntityDTO?: Client;
  uboDTO?: UBO;
  rawResponse?: any;
  createdAt?: Date | string;
  executionMessage?: string;
  status?: ScreeningExecutionStatus;
}

export interface ScreeningMatchDTO {
  id?: number;
  clientEntityDTO?: Client;
  uboDTO?: UBO;
  screeningExecutionDTO?: ScreeningExecutionDTO;
  yenteId?: string;
  score?: number;
  targetName?: string;
  matchReason?: string;
  rawResponse?: any;
  createdAt?: Date | string;
  status?: ScreeningMatchStatus;
  reviewerComment?: string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  yenteLastUpdate?: string;
}

export enum FormType {
  INDULGENCE = 'INDULGENCE',
}


export interface FormConfig {
  id?: string;
  type: FormType;
  targetClientType?: ClientTypeEnum;
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
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
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
  clientId?: number;
  creationDate: Date;
  lastUpdateDate: Date;
  fieldResults: FieldResult[];
}

export interface ClientDiligenceStatus {
  id?: string;
  clientId: number;
  formConfigId: string;
  status: 'PENDING' | 'SUBMITTED' | 'VALIDATED';
  resultId?: string; // Optional, link to the submission
  creationDate?: Date;
  lastUpdateDate?: Date;
  enabled?: boolean;
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
  id?: string;
  referenceInterne: string;    // Ex: 2026-0045 (Généré automatiquement)
  titre: string;               // Nom du dossier (ex: Litige Commercial Dupont vs Durand)
  description?: string;

  // Relations
  clientId: number;   // ID du client rattaché
  responsableId: string;       // ID de l'avocat responsable (associé)
  intervenantsIds: string[];   // Liste des collaborateurs travaillant sur le dossier

  // Classification
  domaineJuridique: string;    // Ex: Droit des Affaires, Droit Social, Immobilier
  prioriteID: string; // Relies on DossierPriorite.code or DossierPriorite.id
  statutID: string; // Relies on StatutDossier.code or StatutDossier.id

  // Compliance AML (Removed)
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


// gestion des taches

// Représente une catégorie de tâche (ex: Procédure, Recherche)
export interface TaskCategory {
  id:  number;
  code: string;
  libelle: string;      // Ex: "Actes et Procédures"
  couleur: string;      // Code Hexa ou classe Tailwind pour l'UI
  icone?: string;       // Nom de l'icône (Lucide, Heroicons...)
  actif: boolean;
}

// Représente l'état d'avancement d'une tâche
export interface TaskStatus {
  id: number;
  code: string;
  libelle: string;      // Ex: "En attente"
  ordre_affichage: number;
  isClosingStatus: boolean; // Si vrai, la tâche est considérée comme finie
}

export interface Task {
  id?: number ;
  dossierId: number;
  titre: string;
  description?: string;

  // Relations par objets
  category: TaskCategory;
  status: TaskStatus;

  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  assignees?: User[];
  dateEcheance: Date;
  isCompleted: boolean;
  createdAt: Date;
  createdBy?: User;

  // Facturation
  invoiceId?: string;

  estimatedTimeMinutes?: number;

}

export interface TaskLog {
  id?: number;
  taskId?: string;
  action: string;
  description?: string;
  createdAt: Date;
  createdBy?: User;
}


// note par 
export interface NoteCategory {
  id: string | number;
  label: string;
  code: string;
  color?: string;
  active: boolean;
  order: number;
}

export interface Note {
  id?: number;
  dossierId: number | string;  // Le dossier auquel la note est liée
  auteurId: number | string;   // L'utilisateur (avocat/collaborateur) qui a écrit la note        // Pour l'affichage rapide (ex: "Me. Dupont")

  title: string;
  description: string;             // Le corps de la note (peut supporter du Markdown)

  categoryId: string | number;

  // Temporalité
  createdAt: Date;
  updatedAt: Date;

  // Pièces jointes (optionnel)
  attachmentIds?: string[];    // Si la note est liée à des documents spécifiques
}

export enum ContactRole {
  AVOCAT_ADVERSE = 'AVOCAT_ADVERSE',
  NOTAIRE = 'NOTAIRE',
  EXPERT = 'EXPERT',
  HUISSIER = 'HUISSIER',
  TEMOIN = 'TEMOIN',
  JUGE = 'JUGE',
  PARTIE_ADVERSE = 'PARTIE_ADVERSE',
  CONSEIL_JURIDIQUE = 'CONSEIL_JURIDIQUE',
  AUTRE = 'AUTRE'
}

export interface DossierContact {
  id?: number | string;
  dossierId: number | string; // Relation avec le dossier

  // Identité
  civilite?: 'M.' | 'Mme' | 'Me';
  nom: string;
  prenom: string;
  type?: ContactRole;

  entreprise?: string;         // Nom du cabinet ou de l'étude

  // Coordonnées
  email: string;
  telephoneFixe?: string;
  telephoneMobile?: string;
  adresse?: string;

  // Précisions métiers
  numToque?: string;           // Pour les avocats (Toque au barreau)
  siteWeb?: string;
  pays?: string;
  profession?: string;

  // Métadonnées
  notes?: string;              // Commentaire libre sur ce contact (Role in UI)
  observation?: string;        // Observations complémentaires
  createdAt: Date;
  updatedAt: Date;
}


export interface EventType {
  id: number;
  label: string;
  code: string;
  color?: string;
  active: boolean;
  order: number;
}

export interface MatterEvent {
  id?: number | string;
  dossierId: number | string;      // Référence au dossier
  titre: string;                   // Ex: "Audience de plaidoirie - JAF"
  description?: string;

  categorie: EventType;         // Identifiant de l'EventType

  // Temps
  startDate: Date;                 // Date et heure de début
  endDate: Date;                   // Date et heure de fin
  isAllDay: boolean;               // Pour les événements sur toute la journée

  // Lieu
  lieu?: string;                   // Adresse ou nom du Tribunal/Salle

  // Participants
  participantsIds: string[];       // Liste des IDs (Collaborateurs ou Contacts)

  // Rappels & Alertes
  reminderMinutesBefore?: number;  // Notification (ex: 30, 60, 1440)

  // État
  statut: 'CONFIRME' | 'ANNULE' | 'REPORTE' | 'TERMINE';

  createdAt: Date;
  updatedAt: Date;
}

// Modèles de Facturation
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;      // Heures ou Unités
  hourlyRate: number;    // Taux unitaire
  vatRate: number;       // TVA (ex: 20)
  totalHT: number;
  totalTTC: number;

  // Liens avec les prestations
  relatedTaskId?: number | string;
  relatedEventId?: number | string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // N° facture
  date: Date;
  clientId: number;      // Référence au client
  clientAddress?: string; // Adresse du client au moment de la facture
  dossierId?: string;    // Référence au dossier (optionnel pour rétrocompatibilité)

  status: InvoiceStatus;

  lineItems: InvoiceLineItem[];

  // Footer / Totaux globaux
  disbursements: number; // Débours/Frais supplémentaires
  totalHT: number;
  totalVAT: number;
  totalTTC: number;

  createdAt: Date;
  updatedAt: Date;
}

// for opensanctions :
export interface YenteMatchQuery {
  schema: string;
  properties: Record<string, string[]>;
}

export interface YenteMatchRequest {
  queries: Record<string, YenteMatchQuery>;
}

export interface YenteEntity {
  id: string;
  schema: string; // 'Person', 'Company', 'Organization', etc.
  properties: Record<string, string[]>;
  datasets: string[];
  referents?: string[];
  target?: boolean;
  first_seen?: string;
  last_seen?: string;
  last_change?: string;
}

export interface YenteMatchResult extends YenteEntity {
  score: number;
  match: boolean;
}

export interface YenteQueryResponse {
  query: YenteMatchQuery;
  results: YenteMatchResult[];
}

export interface YenteMatchResponse {
  responses: Record<string, YenteQueryResponse>;
}

export interface MatterActivity {
    id?: number;
    dossierId: number | string;
    author: string;
    action: string;
    targetType: string;
    targetId?: number | string;
    description: string;
    createdAt: Date | string;
}

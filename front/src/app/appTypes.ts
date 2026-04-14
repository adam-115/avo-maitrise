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

  // Spécificités Cabinet
  barreauId?: string;          // Numéro de toque ou identifiant au barreau
  specialite?: string[];       // Ex: ['Droit des sociétés', 'Fiscalité']
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
  // FACTURE = 'FACTURE'
}
// contact type for contact Dialog component
export enum ContactTypeCreation {
  NOUVEAU = 'NOUVEAU',
  EXISTANT = 'EXISITANT'
}




// Interface pour définir la structure d'une Audience Judiciaire
export interface Appointement {
  id: number;
  title: string;
  clientCase: string; // Keep for backward compatibility or simple display
  clientId?: string;      // ID of the related client
  dossierId?: string | number; // ID of the related dossier
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
  ordre_affichage: number;
  actif: boolean;
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
  adresse?: string;
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




export enum FormType {
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
  id?: string;
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


// gestion des taches

// Représente une catégorie de tâche (ex: Procédure, Recherche)
export interface TaskCategory {
  id: number | string;
  code: 'PROCEDURE' | 'RECHERCHE' | 'CLIENT' | 'ADMIN' | 'AUDIENCE';
  libelle: string;      // Ex: "Actes et Procédures"
  couleur: string;      // Code Hexa ou classe Tailwind pour l'UI
  icone?: string;       // Nom de l'icône (Lucide, Heroicons...)
  actif: boolean;
}

// Représente l'état d'avancement d'une tâche
export interface TaskStatus {
  id: string;
  code: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  libelle: string;      // Ex: "En attente"
  ordre_affichage: number;
  isClosingStatus: boolean; // Si vrai, la tâche est considérée comme finie
}

export interface Task {
  id?: number;
  dossierId: number | string;
  titre: string;
  description?: string;

  // Relations par ID
  categoryId: number | string;
  statusId: string;

  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  assigneA?: User[];
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

  entreprise?: string;         // Nom du cabinet ou de l'étude

  // Coordonnées
  email: string;
  telephoneFixe?: string;
  telephoneMobile?: string;
  adresse?: string;

  // Précisions métiers
  numToque?: string;           // Pour les avocats (Toque au barreau)
  siteWeb?: string;

  // Métadonnées
  notes?: string;              // Commentaire libre sur ce contact
  createdAt: Date;
  updatedAt: Date;
}


export interface EventType {
  id?: string;
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

  typeId: string;         // Identifiant de l'EventType

  // Temps
  startDate: Date;                 // Date et heure de début
  endDate: Date;                   // Date et heure de fin
  isAllDay: boolean;               // Pour les événements sur toute la journée

  // Lieu
  lieu?: string;                   // Adresse ou nom du Tribunal/Salle
  isVirtual: boolean;              // Si c'est une visio (Lien Teams/Zoom)
  meetingLink?: string;

  // Participants
  organisateurId: string;          // L'avocat qui crée l'événement
  participantsIds: string[];       // Liste des IDs (Collaborateurs ou Contacts)

  // Rappels & Alertes
  reminderMinutesBefore?: number;  // Notification (ex: 30, 60, 1440)

  // État
  statut: 'CONFIRME' | 'ANNULE' | 'REPORTE' | 'TERMINE';

  createdAt: Date;
  updatedAt: Date;

  // Facturation
  isBilled?: boolean;
  invoiceId?: string;
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
  clientId: string;      // Référence au client
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
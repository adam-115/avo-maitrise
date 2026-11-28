import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { ConflictCheckResponse, ConflictCheckService, ConflictMatch } from '../../services/conflict-check.service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { UserService } from '../../services/user.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { Client, StatutDossier, DossierPriorite, User, Dossier, Document, DomaineJuridique } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { ClientSelectionDialog } from '../client-selection-dialog/client-selection-dialog';
import { UserSelectionDialog } from '../user-selection-dialog/user-selection-dialog';
import { PartieSelectionDialog } from '../partie-selection-dialog/partie-selection-dialog';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { DomaineJuridiqueSelectionDialog } from '../domaine-juridique-selection-dialog/domaine-juridique-selection-dialog';
import { ClientStatusAlertComponent } from '../../shared/components/client-status-alert/client-status-alert.component';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { forkJoin, firstValueFrom } from 'rxjs';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PAYS_JURIDICTION, normalizePays } from '../../shared/ai-sources/pays';
import { VoiceNoteService } from '../../services/voice-note.service';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-dossier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, UserSelectionDialog, ClientSelectionDialog, PartieSelectionDialog, DocumentDialog, DomaineJuridiqueSelectionDialog, ClientStatusAlertComponent, TranslatePipe],
  templateUrl: './dossier-form.html',
  styleUrl: './dossier-form.css'
})
export class DossierForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private statusService = inject(StatutDossierService);
  private priorityService = inject(DossierPrioriteService);
  private userService = inject(UserService);
  private domaineService = inject(DomaineJuridiqueService);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private conflictService = inject(ConflictCheckService);
  private voiceNoteService = inject(VoiceNoteService);
  private documentService = inject(DocumentService);

  // Dictée vocale + enregistrement audio de la description
  isRecordingDescription = false;
  interimTranscript = '';
  voiceError = '';
  recordedAudioBlob: Blob | null = null;
  recordedAudioMime = 'audio/webm';
  audioPreviewUrl: string | null = null;
  descriptionAudioDocumentId: number | null = null;
  isStructuringDescription = false;

  // Contrôle automatique des conflits d'intérêts
  isCheckingConflicts = false;
  conflictResult: ConflictCheckResponse | null = null;
  quickConflictQuery = '';
  showWaiverModal = false;
  waiverJustification = '';
  waiverError = '';
  pendingSubmitAfterWaiver = false;

  dossierForm: FormGroup;
  isEditMode = false;
  dossierId: string | number | null = null;
  loading = true;

  selectedClient: Client | null = null;
  statuses: StatutDossier[] = [];
  priorities: DossierPriorite[] = [];
  users: User[] = [];
  domaines: DomaineJuridique[] = [];

  showUserDialog = false;
  showClientDialog = false;
  showPartieDialog = false;
  selectedPartieRole = 'ADVERSAIRE'; // Default
  showResponsableDialog = false;
  showDocumentDialog = false;
  showDomaineDialog = false;
  readonly paysJuridiction = PAYS_JURIDICTION;

  constructor() {
    this.dossierForm = this.fb.group({
      referenceInterne: ['', Validators.required],
      titre: ['', Validators.required],
      description: [''],
      clientId: ['', Validators.required],
      responsableId: ['', Validators.required],
      intervenantsIds: [[]],
      domaineJuridique: ['', Validators.required],
      // Droit applicable au litige : l'IA n'analyse le dossier qu'avec la jurisprudence de ce pays (+ international)
      paysJuridiction: ['', Validators.required],
      prioriteID: ['', Validators.required],
      statutID: ['', Validators.required],
      dateOuverture: [new Date().toISOString().substring(0, 10), Validators.required],
      tags: [[]],
      documents: [[]],
      autresParties: [[]]
    });

    this.dossierForm.valueChanges.subscribe(() => {
      if (this.dossierForm.dirty) {
        this.dossierForm.markAllAsTouched();
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const clientId = this.route.snapshot.queryParamMap.get('clientId');
      this.loading = true;

      const requests: any = {
        statuses: this.statusService.getAll(),
        priorities: this.priorityService.getAll(),
        users: this.userService.getAll(),
        domaines: this.domaineService.getAll()
      };

      if (id) {
        this.isEditMode = true;
        this.dossierId = id;
        requests.dossier = this.dossierService.findById(id);
      } else if (clientId) {
        requests.client = this.clientService.findById(clientId);
      }

      forkJoin(requests).subscribe({
        next: (res: any) => {
          this.statuses = res.statuses.content || [];
          this.priorities = res.priorities.content || [];
          this.users = res.users.content || [];
          this.domaines = (res.domaines.content || []).filter((d: any) => d.active);

          if (res.dossier) {
            const dossier = res.dossier;
            this.dossierForm.patchValue({
              ...dossier,
              dateOuverture: dossier.dateOuverture ? new Date(dossier.dateOuverture).toISOString().substring(0, 10) : '',
            });
            if (dossier.descriptionAudioDocumentId) {
              this.descriptionAudioDocumentId = dossier.descriptionAudioDocumentId;
              this.loadExistingDescriptionAudio(dossier.descriptionAudioDocumentId);
            }
            if (dossier.client?.id || dossier.clientId) {
              const cid = dossier.client?.id || dossier.clientId;
              this.clientService.findById(cid).subscribe(client => {
                this.selectedClient = client;
                this.dossierForm.patchValue({ clientId: client.id });
                this.checkClientStatus();
              });
            }
          } else if (res.client) {
             this.selectedClient = res.client;
             this.dossierForm.patchValue({ clientId: res.client.id });
             this.prefillPaysJuridiction(res.client);
             this.checkClientStatus();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading dossier form dependencies', err);
          this.loading = false;
        }
      });
    });
  }

  checkClientStatus(): void {
    if (this.isClientBlocked) {
      this.dossierForm.disable();
    } else {
      this.dossierForm.enable();
    }
  }

  get isClientBlocked(): boolean {
    return this.getSelectedClientStatus() === 'BLOCKED';
  }

  // Client Selection Dialog Methods
  openClientDialog(): void {
    this.showClientDialog = true;
  }

  closeClientDialog(): void {
    this.showClientDialog = false;
  }

  onClientSelected(client: Client): void {
    if (!client.id) return;
    this.setClientAndClose(client);
  }

  private setClientAndClose(client: Client): void {
    this.selectedClient = client;
    this.dossierForm.patchValue({ clientId: client.id });
    this.prefillPaysJuridiction(client);
    this.checkClientStatus();
    this.closeClientDialog();
    this.runConflictCheck();
  }

  /** Préremplit le pays de juridiction avec le pays du client (s'il est géré), sans écraser un choix existant. */
  private prefillPaysJuridiction(client: Client): void {
    const current = this.dossierForm.get('paysJuridiction');
    const pays = normalizePays((client as any)?.pays);
    if (current && !current.value && pays) {
      current.setValue(pays);
    }
  }

  // Autres Parties Selection Dialog Methods
  openPartieDialog(): void {
    this.showPartieDialog = true;
  }

  closePartieDialog(): void {
    this.showPartieDialog = false;
  }

  onPartieSelected(client: Client): void {
    if (!client.id) return;
    this.addPartieAndClose(client);
  }

  private addPartieAndClose(client: Client): void {
    const currentParties = this.autresParties;
    if (!currentParties.some(p => p.partie.id === client.id)) {
      this.dossierForm.patchValue({
        autresParties: [...currentParties, { partie: client, role: this.selectedPartieRole }]
      });
    }
    this.closePartieDialog();
    this.runConflictCheck();
  }

  get autresParties(): any[] {
    return this.dossierForm.get('autresParties')?.value || [];
  }

  removePartie(index: number): void {
    const currentParties = this.autresParties;
    this.dossierForm.patchValue({
      autresParties: currentParties.filter((_, i) => i !== index)
    });
    this.runConflictCheck();
  }

  // ==================== CONTRÔLE AUTOMATIQUE DES CONFLITS D'INTÉRÊTS ====================

  runConflictCheck(): void {
    const clientId = this.dossierForm.get('clientId')?.value;
    const parties = this.autresParties.map(p => ({
      clientId: p.partie?.id ? Number(p.partie.id) : null,
      role: p.role || 'ADVERSAIRE',
      name: this.getPartieName(p.partie)
    }));
    const freeQueries = this.quickConflictQuery
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 2);

    if (!clientId && parties.length === 0 && freeQueries.length === 0) {
      this.conflictResult = null;
      return;
    }

    this.isCheckingConflicts = true;
    this.conflictService.check({
      dossierId: this.dossierId ? Number(this.dossierId) : null,
      clientId: clientId ? Number(clientId) : null,
      parties,
      freeTextQueries: freeQueries
    }).subscribe({
      next: res => {
        this.conflictResult = res;
        this.isCheckingConflicts = false;
      },
      error: err => {
        console.error('Erreur vérification conflits:', err);
        this.isCheckingConflicts = false;
      }
    });
  }

  labelRisk(level?: string): string {
    switch (level) {
      case 'CRITICAL': return 'Critique';
      case 'HIGH': return 'Élevé';
      case 'MEDIUM': return 'Moyen';
      default: return 'Aucun';
    }
  }

  labelMatchType(type: ConflictMatch['matchType']): string {
    switch (type) {
      case 'CLIENT_DIRECT': return 'Client direct';
      case 'IDENTIFIANT_UNIQUE': return 'Identifiant unique';
      case 'DIRIGEANT': return 'Dirigeant / Rep. légal';
      case 'UBO': return 'UBO / Bénéficiaire effectif';
      case 'PARTIE_DOSSIER': return 'Autre dossier';
      case 'HOMONYME': return 'Homonyme / Nom proche';
      default: return type;
    }
  }

  confirmWaiverAndSubmit(): void {
    if (!this.waiverJustification || this.waiverJustification.trim().length < 5) {
      this.waiverError = 'Veuillez saisir une justification écrite d\'au moins 5 caractères.';
      return;
    }
    this.waiverError = '';
    this.showWaiverModal = false;
    this.executeSubmit(true);
  }

  cancelWaiver(): void {
    this.showWaiverModal = false;
    this.waiverError = '';
  }

  private recordConflictAudit(savedDossierId: number | null, usedWaiver: boolean): void {
    if (!this.conflictResult) return;
    this.conflictService.record({
      dossierId: savedDossierId,
      searchSummary: this.conflictResult.searchSummary,
      riskLevel: this.conflictResult.riskLevel,
      decision: usedWaiver ? 'PROCEEDED_WITH_WAIVER' : 'CLEARED',
      justification: usedWaiver ? this.waiverJustification.trim() : null,
      matches: this.conflictResult.matches || []
    }).subscribe({ error: () => {} });
  }

  getPartieName(client: Client): string {
    const c = client as any;
    return c ? `${c.nom || c.nomCommercial || ''} ${c.prenom || ''}`.trim() : '';
  }

  getSelectedClientName(): string {
    const c = this.selectedClient as any;
    return c ? `${c.nom || c.nomCommercial || ''} ${c.prenom || ''}`.trim() : '';
  }

  getSelectedClientStatus(): string | undefined {
    return this.selectedClient?.clientStatus || (this.selectedClient as any)?.status;
  }

  // User Selection Dialog Methods
  openUserDialog(): void {
    this.showUserDialog = true;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
  }

  onUsersSelected(selectedIds: string[]): void {
    this.dossierForm.patchValue({ intervenantsIds: selectedIds });
    this.closeUserDialog();
  }

  getSelectedIntervenants(): User[] {
    const selectedIds = this.dossierForm.get('intervenantsIds')?.value || [];
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  removeIntervenant(userId: string | number): void {
    const currentIds = this.dossierForm.get('intervenantsIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.dossierForm.patchValue({ intervenantsIds: newIds });
  }

  // Domaine Juridique Selection Dialog Methods
  openDomaineDialog(): void {
    this.showDomaineDialog = true;
  }

  closeDomaineDialog(): void {
    this.showDomaineDialog = false;
  }

  onDomaineSelected(domaineId: string): void {
    this.dossierForm.patchValue({ domaineJuridique: domaineId });
    this.closeDomaineDialog();
  }

  getSelectedDomaineLabel(): string {
    const domaineId = this.dossierForm.get('domaineJuridique')?.value;
    if (!domaineId) return '';
    const domaine = this.domaines.find(d => d.id == domaineId);
    return domaine ? domaine.label : '';
  }

  getSelectedDomaineColor(): string {
    const domaineId = this.dossierForm.get('domaineJuridique')?.value;
    if (!domaineId) return 'transparent';
    const domaine = this.domaines.find(d => d.id == domaineId);
    return domaine ? (domaine.color || 'transparent') : 'transparent';
  }


  // User Selection Dialog Methods for Responsable
  openResponsableDialog(): void {
    this.showResponsableDialog = true;
  }

  closeResponsableDialog(): void {
    this.showResponsableDialog = false;
  }

  onResponsableSelected(userIds: string[]): void {
    if (userIds.length > 0) {
      this.dossierForm.patchValue({ responsableId: userIds[0] });
    }
    this.closeResponsableDialog();
  }

  getSelectedResponsableName(): string {
    const userId = this.dossierForm.get('responsableId')?.value;
    if (!userId) return '';
    const user = this.users.find(u => u.id == userId);
    return user ? user.username : '';
  }

  // Tags Management
  get tags(): string[] {
    return this.dossierForm.get('tags')?.value || [];
  }

  addTag(event: any): void {
    const input = event.target;
    const value = input.value.trim();

    if (value) {
      const currentTags = this.tags;
      if (!currentTags.includes(value)) {
        this.dossierForm.patchValue({
          tags: [...currentTags, value]
        });
      }
      input.value = '';
    }
  }

  removeTag(index: number): void {
    const currentTags = this.tags;
    this.dossierForm.patchValue({
      tags: currentTags.filter((_, i) => i !== index)
    });
  }

  // Documents Management
  get documents(): Document[] {
    return this.dossierForm.get('documents')?.value || [];
  }

  openDocumentDialog(): void {
    this.showDocumentDialog = true;
  }

  closeDocumentDialog(): void {
    this.showDocumentDialog = false;
  }

  onDocumentAdded(doc: Document): void {
    this.dossierForm.patchValue({
      documents: [...this.documents, doc]
    });
    this.closeDocumentDialog();
  }

  async removeDocument(index: number): Promise<void> {
    const doc = this.documents[index];
    const docTitle = doc?.title || doc?.name || doc?.nomFichier || '';

    const title = this.translate.instant('DOSSIER_FORM.CONFIRM_REMOVE_DOC_TITLE');
    const msg = docTitle
      ? `${this.translate.instant('DOSSIER_FORM.CONFIRM_REMOVE_DOC_MSG')} (${docTitle})`
      : this.translate.instant('DOSSIER_FORM.CONFIRM_REMOVE_DOC_MSG');

    const confirmed = await this.alertService.confirmMessage(
      title,
      msg,
      'warning'
    );

    if (confirmed) {
      const currentDocs = this.documents;
      this.dossierForm.patchValue({
        documents: currentDocs.filter((_, i) => i !== index)
      });
      this.alertService.success(this.translate.instant('DOSSIER_FORM.DOC_REMOVED_SUCCESS'));
    }
  }

  async onSubmit(): Promise<void> {
    if (this.dossierForm.invalid) {
      return;
    }

    // Option A : si conflit ÉLEVÉ ou CRITIQUE, justification écrite obligatoire avant création/modification
    if (this.conflictResult?.requiresJustification) {
      this.waiverError = '';
      this.showWaiverModal = true;
      return;
    }

    await this.executeSubmit(false);
  }

  private async executeSubmit(usedWaiver: boolean): Promise<void> {
    if (this.isRecordingDescription) {
      this.stopDescriptionDictation();
    }

    let finalAudioDocId = this.descriptionAudioDocumentId;
    if (this.recordedAudioBlob) {
      try {
        finalAudioDocId = await this.uploadRecordedAudio(this.recordedAudioBlob, this.recordedAudioMime);
        this.descriptionAudioDocumentId = finalAudioDocId;
      } catch (err) {
        console.error('Erreur upload audio description', err);
        this.alertService.displayMessage('Erreur audio', 'Impossible d\'enregistrer le fichier audio. La transcription texte reste disponible.', 'error');
        return;
      }
    }

    const dossierData: Dossier = {
      ...this.dossierForm.value,
      descriptionAudioDocumentId: finalAudioDocId,
      client: { id: this.dossierForm.value.clientId },
      id: this.dossierId,
      updated_at: new Date()
    };

    if (this.isEditMode && this.dossierId) {
      const confirmed = usedWaiver || await this.alertService.confirmMessage(
        'Modifier le dossier',
        'Êtes-vous sûr de vouloir enregistrer les modifications apportées à ce dossier ?',
        'warning'
      );
      if (confirmed) {
        this.dossierService.update(dossierData).subscribe({
          next: () => {
            this.recordConflictAudit(Number(this.dossierId), usedWaiver);
            this.alertService.success('Dossier mis à jour avec succès');
            this.router.navigate(['/home/dossier-detail', this.dossierId, 'vue-ensemble']);
          },
          error: (err) => {
            const errorMsg = err?.error?.message || err?.error || 'Erreur lors de la mise à jour du dossier';
            this.alertService.displayMessage('Erreur', typeof errorMsg === 'string' ? errorMsg : 'Erreur lors de la mise à jour du dossier', 'error');
          }
        });
      }
    } else {
      this.dossierService.create(dossierData).subscribe({
        next: (created) => {
          this.recordConflictAudit(created?.id ? Number(created.id) : null, usedWaiver);
          this.alertService.success('Dossier créé avec succès');
          if (created?.id) {
            this.router.navigate(['/home/dossier-detail', created.id, 'vue-ensemble']);
          } else {
            this.navigateToDossier();
          }
        },
        error: (err) => {
          const errorMsg = err?.error?.message || err?.error || 'Erreur lors de la création du dossier';
          this.alertService.displayMessage('Erreur', typeof errorMsg === 'string' ? errorMsg : 'Erreur lors de la création du dossier', 'error');
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode && this.dossierId) {
      this.router.navigate(['/home/dossier-detail', this.dossierId, 'vue-ensemble']);
    } else {
      this.navigateToDossier();
    }
  }

  navigateToDossier() {
    this.router.navigateByUrl('/home/dossier');
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.dossierForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  ngOnDestroy(): void {
    this.stopDescriptionDictation();
    this.revokeAudioUrl();
  }

  private revokeAudioUrl(): void {
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
      this.audioPreviewUrl = null;
    }
  }

  private loadExistingDescriptionAudio(docId: number): void {
    this.documentService.downloadDocumentFile(docId).subscribe({
      next: (blob) => {
        this.revokeAudioUrl();
        this.audioPreviewUrl = URL.createObjectURL(blob);
      },
      error: () => {
        // Audio indisponible
      }
    });
  }

  async toggleDescriptionDictation(): Promise<void> {
    if (this.isRecordingDescription) {
      this.stopDescriptionDictation();
      return;
    }

    this.voiceError = '';
    this.interimTranscript = '';
    const currentLang = this.translate.getCurrentLang();
    const lang = currentLang === 'en' ? 'en-US' : (currentLang === 'ar' ? 'ar-MA' : 'fr-FR');

    const audioStarted = await this.voiceNoteService.startAudioRecording((blob, mimeType) => {
      this.recordedAudioBlob = blob;
      this.recordedAudioMime = mimeType;
      this.revokeAudioUrl();
      this.audioPreviewUrl = URL.createObjectURL(blob);
    });

    const speechStarted = this.voiceNoteService.startRecognition(lang, {
      onFinal: (chunk) => {
        const current = (this.dossierForm.get('description')?.value || '').trim();
        const nextVal = current ? `${current} ${chunk}` : chunk;
        this.dossierForm.patchValue({ description: nextVal });
      },
      onInterim: (text) => {
        this.interimTranscript = text;
      },
      onError: (msg) => {
        this.voiceError = msg;
      },
      onEnd: () => {
        this.interimTranscript = '';
        if (this.isRecordingDescription) {
          this.isRecordingDescription = false;
          this.voiceNoteService.stopAudioRecording();
        }
      }
    });

    if (audioStarted || speechStarted) {
      this.isRecordingDescription = true;
    } else if (!this.voiceError) {
      this.voiceError = 'Impossible d\'accéder au microphone (vérifiez les permissions navigateur / HTTPS).';
    }
  }

  stopDescriptionDictation(): void {
    this.isRecordingDescription = false;
    this.interimTranscript = '';
    this.voiceNoteService.stopRecognition();
    this.voiceNoteService.stopAudioRecording();
  }

  removeDescriptionAudio(): void {
    this.recordedAudioBlob = null;
    this.descriptionAudioDocumentId = null;
    this.revokeAudioUrl();
  }

  polishDescriptionWithAi(): void {
    const raw = (this.dossierForm.get('description')?.value || '').trim();
    if (!raw || this.isStructuringDescription) return;
    this.isStructuringDescription = true;
    const idNum = this.dossierId ? Number(this.dossierId) : null;
    this.voiceNoteService.structureTranscript(raw, idNum).subscribe({
      next: (res) => {
        if (res?.structuredContent) {
          this.dossierForm.patchValue({ description: res.structuredContent });
        }
        this.isStructuringDescription = false;
      },
      error: () => {
        this.isStructuringDescription = false;
        this.alertService.displayMessage('IA indisponible', 'Impossible de reformuler la description pour le moment.', 'warning');
      }
    });
  }

  private async uploadRecordedAudio(blob: Blob, mimeType: string): Promise<number> {
    const base64 = await this.voiceNoteService.blobToBase64(blob);
    const ext = mimeType.includes('mp4') ? 'm4a' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
    const docPayload: any = {
      nomFichier: `description-dossier-${Date.now()}.${ext}`,
      filename: `description-dossier-${Date.now()}.${ext}`,
      title: 'Audio de la description du dossier',
      tags: 'AUDIO_DESCRIPTION',
      typeDocument: 'DOSSIER',
      fileData: base64,
      clientId: this.dossierForm.value.clientId ? Number(this.dossierForm.value.clientId) : undefined,
      dossierId: this.dossierId ? Number(this.dossierId) : undefined
    };
    const saved: any = await firstValueFrom(this.documentService.create(docPayload));
    return Number(saved.id);
  }
}

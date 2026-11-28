import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dossier, User, Client, DomaineJuridique, MatterEvent, Task, MatterActivity } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { MatterEventService } from '../../services/matter-event.service';
import { TaskService } from '../../services/task.service';
import { MatterActivityService } from '../../services/matter-activity.service';
import { DossierService } from '../../services/dossier.service';
import { DocumentService } from '../../services/document.service';
import { VoiceNoteService } from '../../services/voice-note.service';
import { AlertService } from '../../services/alert-service';
import { ConflictCheckHistoryItem, ConflictCheckResponse, ConflictCheckService } from '../../services/conflict-check.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dossier-vue-ensemble',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './dossier-vue-ensemble.html',
  styleUrl: './dossier-vue-ensemble.css'
})
export class DossierVueEnsemble implements OnInit, OnChanges, OnDestroy {
  @Input() dossier: Dossier | null = null;
  @Input() users: User[] = [];

  private clientService = inject(ClientService);
  private domaineService = inject(DomaineJuridiqueService);
  private eventService = inject(MatterEventService);
  private taskService = inject(TaskService);
  private activityService = inject(MatterActivityService);
  private conflictService = inject(ConflictCheckService);
  private dossierService = inject(DossierService);
  private documentService = inject(DocumentService);
  private voiceNoteService = inject(VoiceNoteService);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Audio & dictée rapide de la description
  audioUrl: string | null = null;
  private loadedAudioDocId: number | null = null;
  editingDescription = false;
  draftDescription = '';
  isRecording = false;
  interimTranscript = '';
  voiceError = '';
  recordedBlob: Blob | null = null;
  recordedMime = 'audio/webm';
  draftAudioDocId: number | null = null;
  savingDescription = false;
  structuringWithAi = false;

  client: Client | null = null;
  domaines: DomaineJuridique[] = [];
  upcomingEvents: MatterEvent[] = [];
  pendingTasks: Task[] = [];
  recentActivities: MatterActivity[] = [];
  loadingData = false;

  latestConflictCheck: ConflictCheckHistoryItem | null = null;
  liveRecheckResult: ConflictCheckResponse | null = null;
  isRecheckingConflict = false;

  ngOnInit(): void {
    this.loadDomaines();
    this.loadOverviewData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossier'] && this.dossier) {
      this.loadOverviewData();
    }
  }

  loadDomaines(): void {
    this.domaineService.getAll().subscribe({
      next: (res: any) => {
        this.domaines = res.content || res || [];
      },
      error: () => {}
    });
  }

  loadOverviewData(): void {
    if (!this.dossier) return;

    // Charger l'audio de la description si présent
    this.loadSavedAudio();

    // Load Client Details
    if (this.dossier.client) {
      this.client = this.dossier.client as Client;
    } else if (this.dossier.clientId) {
      this.clientService.findById(this.dossier.clientId).subscribe({
        next: (c: Client) => this.client = c,
        error: () => {}
      });
    }

    const dossierId = this.dossier.id;
    if (!dossierId) return;

    // Load Events
    this.eventService.getByDossierId(dossierId, 0, 3).subscribe({
      next: (res) => {
        this.upcomingEvents = (res.content || []).filter(e => {
          if (!e.startDate) return true;
          return new Date(e.startDate).getTime() >= (Date.now() - 24 * 60 * 60 * 1000);
        }).slice(0, 3);
      },
      error: () => {
        this.upcomingEvents = [];
      }
    });

    // Load Pending Tasks
    this.taskService.getByDossierId(dossierId, 0, 4).subscribe({
      next: (res) => {
        this.pendingTasks = (res.content || []).slice(0, 4);
      },
      error: () => {
        this.pendingTasks = [];
      }
    });

    // Load Activity Log
    this.activityService.getActivitiesByDossier(dossierId).subscribe({
      next: (data) => {
        this.recentActivities = (data || []).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 5);
      },
      error: () => {
        this.recentActivities = [];
      }
    });

    // Load latest Conflict Check history
    this.conflictService.getDossierHistory(dossierId).subscribe({
      next: list => {
        this.latestConflictCheck = list && list.length > 0 ? list[0] : null;
      },
      error: () => {
        this.latestConflictCheck = null;
      }
    });
  }

  recheckDossierConflicts(): void {
    const dossierId = this.dossier?.id;
    if (!dossierId || this.isRecheckingConflict) return;
    this.isRecheckingConflict = true;
    this.conflictService.recheckDossier(dossierId).subscribe({
      next: res => {
        this.liveRecheckResult = res;
        this.isRecheckingConflict = false;
        if (!res.requiresJustification) {
          this.conflictService.record({
            dossierId: Number(dossierId),
            searchSummary: res.searchSummary,
            riskLevel: res.riskLevel,
            decision: 'CLEARED',
            matches: res.matches || []
          }).subscribe({
            next: saved => this.latestConflictCheck = saved,
            error: () => {}
          });
        }
      },
      error: () => {
        this.isRecheckingConflict = false;
      }
    });
  }

  getResponsable(): User | undefined {
    if (!this.dossier || !this.dossier.responsableId) return undefined;
    return this.users.find(u => String(u.id) === String(this.dossier?.responsableId));
  }

  getIntervenants(): User[] {
    if (!this.dossier || !this.dossier.intervenantsIds) return [];
    const ids = this.dossier.intervenantsIds.map(id => String(id));
    return this.users.filter(u => ids.includes(String(u.id)));
  }

  getDomaineLabel(): string {
    if (!this.dossier || !this.dossier.domaineJuridique) return 'Non défini';
    const dom = this.domaines.find(d => String(d.id) === String(this.dossier?.domaineJuridique));
    return dom ? dom.label : (typeof this.dossier.domaineJuridique === 'object' ? (this.dossier.domaineJuridique as any).label : 'Droit Général');
  }

  getDomaineColor(): string {
    if (!this.dossier || !this.dossier.domaineJuridique) return '#6366f1';
    const dom = this.domaines.find(d => String(d.id) === String(this.dossier?.domaineJuridique));
    return dom ? (dom.color || '#6366f1') : '#6366f1';
  }

  getClientName(): string {
    if (!this.client) return 'Client Inconnu';
    const c = this.client as any;
    if (c.type === 'SOCIETE') return c.nomCommercial || c.nom || 'Société';
    return `${c.prenom || ''} ${c.nom || ''}`.trim() || 'Client';
  }

  getClientInitials(): string {
    if (!this.client) return '?';
    const c = this.client as any;
    if (c.type === 'SOCIETE' && c.nomCommercial) {
      return c.nomCommercial.substring(0, 2).toUpperCase();
    }
    const first = c.prenom ? c.prenom.charAt(0) : '';
    const last = c.nom ? c.nom.charAt(0) : '';
    const initials = (first + last).toUpperCase();
    return initials || this.getClientName().charAt(0).toUpperCase() || '?';
  }

  getClientTypeLabel(): string {
    if (!this.client) return '';
    if (this.client.type === 'PERSONNE') return 'Personne Physique';
    if (this.client.type === 'SOCIETE') return 'Personne Morale / Société';
    return String(this.client.type || '');
  }

  getClientStatus(): string | undefined {
    if (!this.client) return undefined;
    const c = this.client as any;
    return c.clientStatus || c.status;
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'Tâche':
      case 'TASK':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
      case 'Note':
      case 'NOTE':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'Événement':
      case 'EVENT':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'Document':
      case 'DOCUMENT':
        return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getActivityBadgeColor(type: string): string {
    switch (type) {
      case 'Tâche':
      case 'TASK':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Note':
      case 'NOTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Événement':
      case 'EVENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Document':
      case 'DOCUMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  navigateToTab(tabName: string): void {
    if (this.dossier?.id) {
      this.router.navigate(['/home/dossier-detail', this.dossier.id, tabName]);
    } else {
      this.router.navigate(['../', tabName], { relativeTo: this.route });
    }
  }

  ngOnDestroy(): void {
    this.stopDictation();
    this.revokeAudioUrl();
  }

  private revokeAudioUrl(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }

  private loadSavedAudio(): void {
    const docId = this.dossier?.descriptionAudioDocumentId ?? null;
    if (!docId) {
      this.loadedAudioDocId = null;
      this.revokeAudioUrl();
      return;
    }
    if (this.loadedAudioDocId === docId && this.audioUrl) {
      return;
    }
    this.loadedAudioDocId = docId;
    this.documentService.downloadDocumentFile(docId).subscribe({
      next: (blob) => {
        this.revokeAudioUrl();
        this.audioUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.loadedAudioDocId = null;
      }
    });
  }

  openDescriptionEditor(): void {
    this.editingDescription = true;
    this.draftDescription = this.dossier?.description || '';
    this.draftAudioDocId = this.dossier?.descriptionAudioDocumentId ?? null;
    this.recordedBlob = null;
    this.voiceError = '';
  }

  cancelDescriptionEditor(): void {
    this.stopDictation();
    this.editingDescription = false;
    this.recordedBlob = null;
    this.voiceError = '';
    this.loadedAudioDocId = null;
    this.loadSavedAudio();
  }

  async toggleDictation(): Promise<void> {
    if (this.isRecording) {
      this.stopDictation();
      return;
    }
    this.voiceError = '';
    this.interimTranscript = '';
    const currentLang = this.translate.getCurrentLang();
    const lang = currentLang === 'en' ? 'en-US' : (currentLang === 'ar' ? 'ar-MA' : 'fr-FR');

    const audioStarted = await this.voiceNoteService.startAudioRecording((blob, mimeType) => {
      this.recordedBlob = blob;
      this.recordedMime = mimeType;
      this.revokeAudioUrl();
      this.audioUrl = URL.createObjectURL(blob);
    });

    const speechStarted = this.voiceNoteService.startRecognition(lang, {
      onFinal: (chunk) => {
        const current = this.draftDescription.trim();
        this.draftDescription = current ? `${current} ${chunk}` : chunk;
      },
      onInterim: (text) => {
        this.interimTranscript = text;
      },
      onError: (msg) => {
        this.voiceError = msg;
      },
      onEnd: () => {
        this.interimTranscript = '';
        if (this.isRecording) {
          this.isRecording = false;
          this.voiceNoteService.stopAudioRecording();
        }
      }
    });

    if (audioStarted || speechStarted) {
      this.isRecording = true;
    } else if (!this.voiceError) {
      this.voiceError = 'Impossible d\'accéder au microphone.';
    }
  }

  stopDictation(): void {
    this.isRecording = false;
    this.interimTranscript = '';
    this.voiceNoteService.stopRecognition();
    this.voiceNoteService.stopAudioRecording();
  }

  removeDraftAudio(): void {
    this.recordedBlob = null;
    this.draftAudioDocId = null;
    this.loadedAudioDocId = null;
    this.revokeAudioUrl();
  }

  polishDraftWithAi(): void {
    const raw = this.draftDescription.trim();
    if (!raw || this.structuringWithAi) return;
    this.structuringWithAi = true;
    const idNum = this.dossier?.id ? Number(this.dossier.id) : null;
    this.voiceNoteService.structureTranscript(raw, idNum).subscribe({
      next: (res) => {
        if (res?.structuredContent) {
          this.draftDescription = res.structuredContent;
        }
        this.structuringWithAi = false;
      },
      error: () => {
        this.structuringWithAi = false;
        this.alertService.displayMessage('IA indisponible', 'Impossible de reformuler la description pour le moment.', 'warning');
      }
    });
  }

  async saveDescription(): Promise<void> {
    if (!this.dossier?.id || this.savingDescription) return;
    this.stopDictation();
    this.savingDescription = true;

    try {
      let finalAudioId = this.draftAudioDocId;
      if (this.recordedBlob) {
        const base64 = await this.voiceNoteService.blobToBase64(this.recordedBlob);
        const ext = this.recordedMime.includes('mp4') ? 'm4a' : (this.recordedMime.includes('ogg') ? 'ogg' : 'webm');
        const fileName = `description-dossier-${this.dossier.id}-${Date.now()}.${ext}`;
        const savedDoc: any = await firstValueFrom(this.documentService.create({
          nomFichier: fileName,
          filename: fileName,
          title: 'Audio de la description du dossier',
          tags: 'AUDIO_DESCRIPTION',
          typeDocument: 'DOSSIER',
          fileData: base64,
          dossierId: Number(this.dossier.id),
          clientId: this.dossier.client?.id ? Number(this.dossier.client.id) : undefined
        } as any));
        finalAudioId = Number(savedDoc.id);
      }

      const updated = await firstValueFrom(
        this.dossierService.updateDescription(this.dossier.id, this.draftDescription, finalAudioId)
      );
      this.dossier.description = updated.description;
      this.dossier.descriptionAudioDocumentId = updated.descriptionAudioDocumentId ?? finalAudioId;
      this.loadedAudioDocId = this.dossier.descriptionAudioDocumentId ?? null;
      this.editingDescription = false;
      this.recordedBlob = null;
      this.savingDescription = false;
      this.alertService.success('Description et audio enregistrés');
      this.loadOverviewData();
    } catch (err) {
      console.error('Erreur enregistrement description audio', err);
      this.savingDescription = false;
      this.alertService.displayMessage('Erreur audio', 'Impossible d\'enregistrer la description audio.', 'error');
    }
  }
}

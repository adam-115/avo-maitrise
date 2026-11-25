import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VoiceDossierSuggestion, VoiceNoteService } from '../services/voice-note.service';
import { NoteService } from '../services/note.service';
import { NoteCategoryService } from '../services/note-category.service';
import { DocumentService } from '../services/document.service';
import { WordExportService } from '../services/word-export.service';
import { ClientSelectionDialog } from '../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../dossier/dossier-selection-dialog/dossier-selection-dialog';
import { Dossier, Note, NoteCategory } from '../appTypes';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-voice-note-quick',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClientSelectionDialog, DossierSelectionDialog],
  template: `
    <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 font-sans min-h-full">

      <!-- En-tête mobile-first -->
      <div class="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 text-white rounded-3xl p-6 shadow-lg">
        <div class="flex items-center justify-between gap-3">
          <div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider">
              🎙️ Mode Mobile / PWA
            </span>
            <h1 class="text-xl sm:text-2xl font-black mt-2 tracking-tight">Dictée vocale &amp; Note rapide</h1>
            <p class="text-xs sm:text-sm text-indigo-100 mt-1">
              En sortant d'audience, dictez 30 secondes : votre compte-rendu est transcrit, structuré et rattaché au dossier.
            </p>
          </div>
          <select [(ngModel)]="speechLang"
            class="rounded-xl bg-white/15 border border-white/25 text-white text-xs font-bold px-2.5 py-1.5 focus:outline-none">
            <option value="fr-FR" class="text-slate-900">🇫🇷 FR</option>
            <option value="en-US" class="text-slate-900">🇬🇧 EN</option>
            <option value="ar-MA" class="text-slate-900">🇲🇦 AR</option>
          </select>
        </div>

        <!-- Gros bouton micro utilisable à une main -->
        <div class="mt-6 flex flex-col items-center gap-3">
          <button type="button" (click)="toggleRecording()"
            class="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer"
            [ngClass]="isRecording() ? 'bg-rose-500 hover:bg-rose-600 ring-8 ring-rose-400/40 animate-pulse' : 'bg-white text-indigo-700 hover:bg-indigo-50 ring-8 ring-white/20'">
            <svg *ngIf="!isRecording()" class="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <svg *ngIf="isRecording()" class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>

          <div class="text-center">
            <div class="text-sm font-extrabold">
              {{ isRecording() ? ('Enregistrement en cours — ' + formattedElapsed()) : 'Appuyez pour dicter' }}
            </div>
            <div *ngIf="interimText()" class="mt-1 text-xs text-cyan-200 italic max-w-md">
              « {{ interimText() }}… »
            </div>
            <div *ngIf="!voiceService.isSpeechSupported" class="mt-1 text-xs text-amber-200 font-semibold">
              Reconnaissance vocale non supportée sur ce navigateur — vous pouvez saisir ou coller votre texte ci-dessous.
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div *ngIf="errorMessage()" class="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-xs font-semibold">
        {{ errorMessage() }}
      </div>
      <div *ngIf="savedNoteId()" class="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
        <span>
          ✓ Note enregistrée avec succès dans le dossier{{ savedAudioArchived() ? ' (+ audio archivé dans la GED)' : '' }} !
        </span>
        <div class="flex items-center gap-2">
          <button type="button" (click)="exportSavedToWord()"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
            Exporter Word (.docx)
          </button>
          <a *ngIf="selectedDossierId" [routerLink]="['/home/dossier-detail', selectedDossierId, 'notes']"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
            Ouvrir les Notes du dossier ↗
          </a>
        </div>
      </div>

      <!-- Lecteur audio de réécoute + option d'archivage GED -->
      <div *ngIf="audioPreviewUrl()" class="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs font-extrabold text-blue-900">
            🎧 Enregistrement audio capturé ({{ audioSizeKb() }} Ko)
          </div>
          <button type="button" (click)="discardAudio()"
            class="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer">
            Supprimer l'audio
          </button>
        </div>
        <audio [src]="audioPreviewUrl()" controls class="w-full h-10"></audio>
        <label class="inline-flex items-center gap-2 text-xs font-semibold text-blue-950 cursor-pointer select-none">
          <input type="checkbox" [(ngModel)]="saveAudioToGed" class="rounded text-indigo-600" />
          <span>Archiver aussi l'enregistrement audio dans les documents du dossier (GED MinIO)</span>
        </label>
      </div>

      <!-- Suggestion automatique de dossier -->
      <div *ngIf="suggestedDossier() as sug"
        class="rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="text-indigo-900">
          <b>Dossier détecté automatiquement :</b> {{ sug.referenceInterne }} — {{ sug.titre }}
          <span class="text-indigo-600">({{ sug.reason }})</span>
        </div>
        <button *ngIf="selectedDossierId !== sug.dossierId" type="button" (click)="applySuggestedDossier(sug)"
          class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-700">
          Sélectionner ce dossier
        </button>
      </div>

      <!-- Carte de rédaction / structuration -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">

        <!-- Choix du dossier de destination -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">1. Client</label>
            <button type="button" (click)="showClientDialog.set(true)"
              class="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:border-indigo-400 text-xs font-bold text-slate-700 truncate cursor-pointer">
              {{ selectedClientName() ? ('👤 ' + selectedClientName()) : '🔍 Chercher un client...' }}
            </button>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">2. Dossier cible *</label>
            <button type="button" (click)="openDossierPicker()"
              class="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:border-cyan-400 text-xs font-bold text-slate-700 truncate cursor-pointer">
              {{ selectedDossierLabel() ? ('📂 ' + selectedDossierLabel()) : '📂 Choisir un dossier...' }}
            </button>
          </div>
        </div>

        <!-- Catégorie & Titre -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Catégorie</label>
            <select [(ngModel)]="selectedCategoryId"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800">
              <option *ngFor="let c of categories()" [value]="c.id">{{ c.label }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Titre de la note *</label>
            <input type="text" [(ngModel)]="noteTitle" placeholder="Ex. Compte-rendu d'audience CPH Lyon"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <!-- Transcription / Contenu -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label class="text-[11px] font-bold uppercase text-slate-500">Contenu transcrit (éditable) *</label>
            <div class="flex items-center gap-2">
              <button type="button" (click)="structureWithAi()" [disabled]="isStructuring() || !transcript.trim()"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-bold cursor-pointer disabled:opacity-50">
                <span>{{ isStructuring() ? 'Structuration IA...' : '✨ Structurer avec l\'IA' }}</span>
              </button>
              <button *ngIf="transcript" type="button" (click)="clearDraft()"
                class="text-xs font-bold text-slate-400 hover:text-rose-600 cursor-pointer">
                Effacer
              </button>
            </div>
          </div>
          <textarea [(ngModel)]="transcript" rows="7"
            placeholder="Appuyez sur le micro ci-dessus et dictez votre compte-rendu d'audience ou vos instructions..."
            class="w-full rounded-2xl border border-slate-300 p-3.5 text-sm text-slate-800 leading-relaxed focus:border-indigo-500 focus:outline-none"></textarea>
        </div>

        <!-- Actions détectées par l'IA -->
        <div *ngIf="suggestedTasks().length > 0 || suggestedEventTitle()"
          class="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 space-y-2 text-xs text-purple-950">
          <div class="font-extrabold">✨ Éléments détectés dans votre dictée :</div>
          <div *ngIf="suggestedEventTitle()">
            <b>📅 Audience / RDV mentionné :</b> {{ suggestedEventTitle() }}
            <span *ngIf="suggestedEventDate()"> (le {{ suggestedEventDate() }})</span>
          </div>
          <div *ngIf="suggestedTasks().length > 0">
            <b>✅ Tâches détectées :</b>
            <ul class="list-disc pl-5 mt-1 space-y-0.5">
              <li *ngFor="let t of suggestedTasks()">{{ t }}</li>
            </ul>
          </div>
        </div>

        <!-- Bouton Enregistrer -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button type="button" (click)="saveToDossier()" [disabled]="isSaving() || !selectedDossierId || !transcript.trim()"
            class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-black shadow-md shadow-indigo-200 cursor-pointer transition-all">
            {{ isSaving() ? 'Enregistrement...' : 'Enregistrer la note dans le dossier' }}
          </button>
        </div>
      </div>

      <!-- Dialogues Client & Dossier -->
      <app-client-selection-dialog *ngIf="showClientDialog()"
        [initialSelection]="selectedClientId"
        (confirmSelection)="onClientSelected($event)"
        (closeDialog)="showClientDialog.set(false)">
      </app-client-selection-dialog>

      <app-dossier-selection-dialog *ngIf="showDossierDialog()"
        [dossiers]="clientDossiers()"
        [initialSelection]="selectedDossierId"
        (confirmSelection)="onDossierSelected($event)"
        (closeDialog)="showDossierDialog.set(false)">
      </app-dossier-selection-dialog>
    </div>
  `
})
export class VoiceNoteQuickComponent implements OnInit, OnDestroy {
  public voiceService = inject(VoiceNoteService);
  private noteService = inject(NoteService);
  private categoryService = inject(NoteCategoryService);
  private documentService = inject(DocumentService);
  private wordExportService = inject(WordExportService);
  private http = inject(HttpClient);

  speechLang = 'fr-FR';
  noteTitle = '';
  transcript = '';
  selectedCategoryId: number | string = '';
  selectedClientId: number | null = null;
  selectedDossierId: number | null = null;
  saveAudioToGed = true;

  isRecording = signal(false);
  interimText = signal('');
  elapsedSeconds = signal(0);
  isStructuring = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  savedNoteId = signal<number | null>(null);
  savedAudioArchived = signal(false);

  audioBlob = signal<Blob | null>(null);
  audioMimeType = signal<string>('audio/webm');
  audioPreviewUrl = signal<string | null>(null);
  audioSizeKb = signal<number>(0);

  categories = signal<NoteCategory[]>([]);
  suggestedDossier = signal<VoiceDossierSuggestion | null>(null);
  suggestedTasks = signal<string[]>([]);
  suggestedEventTitle = signal<string | null>(null);
  suggestedEventDate = signal<string | null>(null);

  selectedClientName = signal<string | null>(null);
  selectedDossierLabel = signal<string | null>(null);
  showClientDialog = signal(false);
  showDossierDialog = signal(false);
  clientDossiers = signal<Dossier[]>([]);

  private timerHandle: any = null;

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (res: any) => {
        const list = res?.content || (Array.isArray(res) ? res : []);
        this.categories.set(list);
        if (list.length > 0) this.selectedCategoryId = list[0].id;
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.voiceService.stopRecognition();
    this.voiceService.stopAudioRecording();
    this.revokeAudioUrl();
  }

  formattedElapsed(): string {
    const s = this.elapsedSeconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  toggleRecording(): void {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.errorMessage.set(null);
    this.savedNoteId.set(null);
    this.savedAudioArchived.set(false);
    this.discardAudio();
    this.elapsedSeconds.set(0);

    // Démarrer la capture audio en parallèle pour réécoute / archivage GED optionnel
    this.voiceService.startAudioRecording((blob, mime) => {
      this.revokeAudioUrl();
      this.audioBlob.set(blob);
      this.audioMimeType.set(mime);
      this.audioSizeKb.set(Math.max(1, Math.round(blob.size / 1024)));
      this.audioPreviewUrl.set(URL.createObjectURL(blob));
    });

    const started = this.voiceService.startRecognition(this.speechLang, {
      onFinal: chunk => {
        this.transcript = this.transcript ? `${this.transcript.trim()} ${chunk}` : chunk;
        this.interimText.set('');
      },
      onInterim: text => this.interimText.set(text),
      onError: msg => {
        this.errorMessage.set(msg);
        this.isRecording.set(false);
        this.voiceService.stopAudioRecording();
        this.stopTimer();
      },
      onEnd: () => {
        this.isRecording.set(false);
        this.interimText.set('');
        this.voiceService.stopAudioRecording();
        this.stopTimer();
        this.autoSuggestDossier();
      }
    });

    if (started) {
      this.isRecording.set(true);
      this.timerHandle = setInterval(() => this.elapsedSeconds.update(v => v + 1), 1000);
    }
  }

  private stopRecording(): void {
    this.voiceService.stopRecognition();
    this.voiceService.stopAudioRecording();
    this.isRecording.set(false);
    this.interimText.set('');
    this.stopTimer();
    this.autoSuggestDossier();
  }

  discardAudio(): void {
    this.revokeAudioUrl();
    this.audioBlob.set(null);
    this.audioSizeKb.set(0);
  }

  private revokeAudioUrl(): void {
    const cur = this.audioPreviewUrl();
    if (cur) {
      URL.revokeObjectURL(cur);
      this.audioPreviewUrl.set(null);
    }
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private autoSuggestDossier(): void {
    if (!this.transcript.trim() || this.selectedDossierId) return;
    this.voiceService.suggestDossier(this.transcript).subscribe({
      next: res => {
        if (res?.found && res.suggestion) {
          this.suggestedDossier.set(res.suggestion);
          this.applySuggestedDossier(res.suggestion);
        }
      },
      error: () => {}
    });
  }

  applySuggestedDossier(sug: VoiceDossierSuggestion): void {
    this.selectedDossierId = sug.dossierId;
    this.selectedDossierLabel.set(`${sug.referenceInterne} — ${sug.titre}`);
    if (sug.clientName) this.selectedClientName.set(sug.clientName);
  }

  structureWithAi(): void {
    if (!this.transcript.trim() || this.isStructuring()) return;
    this.isStructuring.set(true);
    this.errorMessage.set(null);
    this.voiceService.structureTranscript(this.transcript, this.selectedDossierId).subscribe({
      next: res => {
        this.isStructuring.set(false);
        if (res.title) this.noteTitle = res.title;
        if (res.structuredContent) this.transcript = res.structuredContent;
        this.suggestedTasks.set(res.suggestedTasks || []);
        this.suggestedEventTitle.set(res.suggestedEventTitle || null);
        this.suggestedEventDate.set(res.suggestedEventDate || null);
        if (res.suggestedDossier && !this.selectedDossierId) {
          this.suggestedDossier.set(res.suggestedDossier);
          this.applySuggestedDossier(res.suggestedDossier);
        }
      },
      error: err => {
        this.isStructuring.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la structuration IA.');
      }
    });
  }

  onClientSelected(client: any): void {
    if (!client?.id) return;
    this.showClientDialog.set(false);
    this.selectedClientId = Number(client.id);
    const name = client.nomCommercial || `${client.prenom || ''} ${client.nom || ''}`.trim() || `Client #${client.id}`;
    this.selectedClientName.set(name);

    this.http.get<any>(`${environment.apiUrl}Dossier/search?client.id=${this.selectedClientId}&size=100`).subscribe({
      next: res => {
        const list: Dossier[] = res?.content || res || [];
        this.clientDossiers.set(list);
        if (list.length === 1) {
          this.onDossierSelected(list[0]);
        } else {
          this.showDossierDialog.set(true);
        }
      },
      error: () => {
        this.clientDossiers.set([]);
        this.showDossierDialog.set(true);
      }
    });
  }

  openDossierPicker(): void {
    if (!this.selectedClientId) {
      this.showClientDialog.set(true);
      return;
    }
    this.showDossierDialog.set(true);
  }

  onDossierSelected(dossier: any): void {
    if (!dossier?.id) return;
    this.showDossierDialog.set(false);
    this.selectedDossierId = Number(dossier.id);
    this.selectedDossierLabel.set(`${dossier.referenceInterne || 'DOS-' + dossier.id} — ${dossier.titre || ''}`.trim());
  }

  async saveToDossier(): Promise<void> {
    if (!this.selectedDossierId || !this.transcript.trim() || this.isSaving()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const title = this.noteTitle.trim() || `Compte-rendu vocal du ${new Date().toLocaleDateString('fr-FR')}`;
    const blob = this.audioBlob();

    const persistNote = (audioDocId: number | null) => {
      const payload: any = {
        title,
        description: this.transcript.trim(),
        dossierId: this.selectedDossierId,
        categoryId: this.selectedCategoryId ? Number(this.selectedCategoryId) : (this.categories()[0]?.id || 1),
        auteurId: 1,
        audioDocumentId: audioDocId,
        createdAt: new Date()
      };
      this.noteService.create(payload).subscribe({
        next: (created: any) => {
          this.savedAudioArchived.set(!!audioDocId);
          this.isSaving.set(false);
          this.savedNoteId.set(created?.id ? Number(created.id) : 1);
        },
        error: err => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.error?.message || 'Impossible d\'enregistrer la note.');
        }
      });
    };

    if (this.saveAudioToGed && blob && this.selectedDossierId) {
      try {
        const b64 = await this.voiceService.blobToBase64(blob);
        const ext = this.audioMimeType().includes('mp4') ? 'm4a' : (this.audioMimeType().includes('ogg') ? 'ogg' : 'webm');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
        const docPayload: any = {
          dossierId: this.selectedDossierId,
          nomFichier: `Dictee_vocale_${stamp}.${ext}`,
          description: `Enregistrement vocal : ${title}`,
          fileData: b64
        };
        this.documentService.create(docPayload).subscribe({
          next: (createdDoc: any) => persistNote(createdDoc?.id ? Number(createdDoc.id) : null),
          error: () => persistNote(null)
        });
        return;
      } catch {
        // Fallback : sauvegarder la note sans audio
      }
    }

    persistNote(null);
  }

  exportSavedToWord(): void {
    const id = this.savedNoteId();
    if (!id) return;
    this.wordExportService.downloadNote(id, `Note_Vocale_${id}.docx`).subscribe({ error: () => {} });
  }

  clearDraft(): void {
    this.transcript = '';
    this.noteTitle = '';
    this.suggestedTasks.set([]);
    this.suggestedEventTitle.set(null);
    this.suggestedEventDate.set(null);
    this.savedNoteId.set(null);
    this.savedAudioArchived.set(false);
    this.discardAudio();
  }
}

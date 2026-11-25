import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ClientDocumentGeneratorService,
  ModelCandidate,
  ModelSearchResult
} from '../../services/client-document-generator.service';
import { VoiceNoteService } from '../../services/voice-note.service';

@Component({
  selector: 'app-client-document-generator-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div (click)="onClose()"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div (click)="$event.stopPropagation()"
        class="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <!-- Barre supérieure gradient -->
        <div class="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"></div>

        <!-- En-tête -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 text-lg">
              ✨
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight truncate">
                {{ dossierId ? ('Générer un document — ' + (dossierLabel || ('Dossier #' + dossierId))) : ('Générer un document pour ' + (clientName || ('Client #' + clientId))) }}
              </h3>
              <p class="text-xs text-slate-500 font-medium">
                {{ dossierId ? 'Depuis votre Bibliothèque de Modèles Juridiques, pré-rempli avec les informations du dossier et du client.' : 'Depuis votre Bibliothèque de Modèles Juridiques, pré-rempli automatiquement avec la fiche client.' }}
              </p>
            </div>
          </div>
          <button type="button" (click)="onClose()"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Corps scrollable -->
        <div class="p-6 overflow-y-auto flex-1 space-y-5">

          <!-- Étape 1 : Demande libre (texte ou micro) -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Quel document souhaitez-vous générer ?
              </label>
              <button *ngIf="voiceService.isSpeechSupported" type="button" (click)="toggleVoicePrompt()"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                [ngClass]="isListening()
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'">
                <span>{{ isListening() ? '⏹ Arrêter le micro' : '🎙️ Parler' }}</span>
              </button>
            </div>

            <p *ngIf="interimText()" class="text-xs text-indigo-600 italic">« {{ interimText() }}… »</p>

            <div class="flex gap-2">
              <input type="text" [(ngModel)]="promptText" (keyup.enter)="searchModels()" [disabled]="isSearching()"
                placeholder="Ex. Génère-moi le contrat de prestation avec ce client..."
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all disabled:opacity-60" />

              <button *ngIf="!isSearching()" type="button" (click)="searchModels()"
                class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-2 shrink-0">
                <span>🔍 Chercher</span>
              </button>

              <button *ngIf="isSearching()" type="button" (click)="stopSearch()"
                class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-2 shrink-0">
                <span class="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                <span>⏹ Arrêter</span>
              </button>

              <button *ngIf="!isSearching() && (searchResult() || promptText.trim() || errorMessage())"
                type="button" (click)="resetDialog()"
                class="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-bold cursor-pointer transition shrink-0"
                title="Réinitialiser et recommencer une nouvelle recherche">
                🔄 Recommencer
              </button>
            </div>

            <!-- Raccourcis rapides -->
            <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span class="text-[11px] font-semibold text-slate-400 me-1">Exemples :</span>
              <button *ngFor="let chip of quickPrompts" type="button" (click)="useQuickPrompt(chip)"
                class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/80 text-[11px] font-semibold transition-colors cursor-pointer">
                {{ chip }}
              </button>
            </div>
          </div>

          <!-- Erreur -->
          <div *ngIf="errorMessage()" class="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-xs font-semibold">
            ⚠️ {{ errorMessage() }}
          </div>

          <!-- Succès génération -->
          <div *ngIf="generatedSuccessMessage()" class="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3.5 text-xs font-bold flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">✓</span>
            <span>{{ generatedSuccessMessage() }}</span>
          </div>

          <!-- Étape 2 : Résultat de la recherche & choix du modèle -->
          <div *ngIf="searchResult() as res" class="space-y-3 pt-1">
            <!-- Bulle de réponse de l'assistant -->
            <div class="rounded-2xl bg-violet-50/80 border border-violet-200 px-4 py-3 flex items-start justify-between gap-3">
              <div class="text-xs text-violet-950 font-medium leading-relaxed">
                <span class="font-extrabold">🤖 Assistant :</span> {{ res.assistantMessage }}
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border"
                [ngClass]="res.aiUsed ? 'bg-violet-100 text-violet-800 border-violet-200' : 'bg-white text-slate-600 border-slate-200'">
                {{ res.aiUsed ? 'IA' : 'Bibliothèque' }}
              </span>
            </div>

            <!-- Aucun modèle dans la bibliothèque -->
            <div *ngIf="res.totalModelsInLibrary === 0" class="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
              <p class="text-xs font-bold text-slate-700">Aucun modèle dans la bibliothèque pour l'instant.</p>
              <a routerLink="/home/model" (click)="onClose()"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                Ouvrir la Bibliothèque de Modèles ↗
              </a>
            </div>

            <!-- Liste des modèles candidats -->
            <div *ngIf="displayedModels().length > 0" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Choisissez le modèle à utiliser
                </span>
                <button *ngIf="res.allModels.length > res.matches.length" type="button"
                  (click)="showAllLibrary.set(!showAllLibrary())"
                  class="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                  {{ showAllLibrary() ? 'Afficher uniquement les suggestions' : ('Voir toute la bibliothèque (' + res.allModels.length + ')') }}
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pe-1">
                <button *ngFor="let m of displayedModels()" type="button" (click)="selectModel(m)"
                  class="w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3"
                  [ngClass]="selectedModel()?.id === m.id
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-xs font-extrabold text-slate-900">{{ m.title }}</span>
                      <span *ngIf="m.recommended"
                        class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        Recommandé
                      </span>
                      <span *ngIf="m.tags"
                        class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {{ m.tags }}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 truncate">📄 {{ m.nomFichier }}</div>
                    <div *ngIf="m.reason" class="text-[11px] text-indigo-700 font-medium">{{ m.reason }}</div>
                  </div>
                  <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                    [ngClass]="selectedModel()?.id === m.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'">
                    <svg *ngIf="selectedModel()?.id === m.id" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <!-- Étape 3 : Consignes optionnelles & option GED -->
            <div *ngIf="selectedModel()" class="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  3. Précisions complémentaires (optionnel)
                </label>
                <textarea [(ngModel)]="extraInstructions" rows="2"
                  placeholder="Ex. Honoraires forfaitaires 15 000 DH HT, durée 12 mois renouvelable..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:border-indigo-500 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"></textarea>
              </div>

              <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="saveToClientGed" class="rounded text-indigo-600 border-slate-300" />
                <span>{{ dossierId ? 'Archiver automatiquement le document généré dans les documents du dossier (GED)' : 'Archiver automatiquement le document généré dans les documents du client (GED)' }}</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Pied de modale -->
        <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button type="button" (click)="onClose()"
            class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition">
            Fermer
          </button>
          <button type="button" (click)="generate()" [disabled]="!selectedModel() || isGenerating()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-45 text-white text-xs font-extrabold shadow-md shadow-indigo-200/70 cursor-pointer transition flex items-center gap-2">
            <span *ngIf="isGenerating()" class="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
            <span>{{ isGenerating() ? 'Génération en cours...' : '✨ Générer le document (.docx)' }}</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class ClientDocumentGeneratorDialogComponent implements OnDestroy {
  @Input() clientId?: number | string | null;
  @Input() clientName: string = '';
  @Input() dossierId?: number | string | null;
  @Input() dossierLabel: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() documentGenerated = new EventEmitter<void>();

  private generatorService = inject(ClientDocumentGeneratorService);
  public voiceService = inject(VoiceNoteService);

  promptText = '';
  extraInstructions = '';
  saveToClientGed = true;

  readonly quickPrompts = [
    'Contrat de prestation',
    'Convention d\'honoraires',
    'Procuration / Mandat',
    'Document KYC'
  ];

  isListening = signal(false);
  interimText = signal('');
  isSearching = signal(false);
  isGenerating = signal(false);
  errorMessage = signal<string | null>(null);
  generatedSuccessMessage = signal<string | null>(null);

  searchResult = signal<ModelSearchResult | null>(null);
  selectedModel = signal<ModelCandidate | null>(null);
  showAllLibrary = signal(false);

  private searchSub: Subscription | null = null;
  private generateSub: Subscription | null = null;
  private pendingAutoSearchTimer: any = null;
  private autoSearchHandled = false;

  ngOnDestroy(): void {
    this.cleanupPendingOperations();
  }

  private cleanupPendingOperations(): void {
    if (this.pendingAutoSearchTimer) {
      clearTimeout(this.pendingAutoSearchTimer);
      this.pendingAutoSearchTimer = null;
    }
    this.searchSub?.unsubscribe();
    this.searchSub = null;
    this.generateSub?.unsubscribe();
    this.generateSub = null;
    this.voiceService.stopRecognition();
  }

  displayedModels(): ModelCandidate[] {
    const res = this.searchResult();
    if (!res) return [];
    if (this.showAllLibrary() || res.matches.length === 0) {
      return res.allModels;
    }
    return res.matches;
  }

  useQuickPrompt(text: string): void {
    this.promptText = text;
    this.searchModels();
  }

  toggleVoicePrompt(): void {
    if (this.isListening()) {
      // Intégrer un éventuel texte intermédiaire non encore finalisé avant de lancer la recherche
      const pendingInterim = this.interimText().trim();
      if (pendingInterim && !this.promptText.toLowerCase().includes(pendingInterim.toLowerCase())) {
        this.promptText = this.promptText.trim() ? `${this.promptText.trim()} ${pendingInterim}` : pendingInterim;
      }
      this.autoSearchHandled = true;
      this.voiceService.stopRecognition();
      this.isListening.set(false);
      this.interimText.set('');
      this.scheduleAutoSearch();
      return;
    }

    this.errorMessage.set(null);
    this.autoSearchHandled = false;
    const started = this.voiceService.startRecognition('fr-FR', {
      onFinal: chunk => {
        this.promptText = this.promptText.trim() ? `${this.promptText.trim()} ${chunk}` : chunk;
        this.interimText.set('');
      },
      onInterim: text => this.interimText.set(text),
      onError: msg => {
        this.errorMessage.set(msg);
        this.isListening.set(false);
        this.interimText.set('');
      },
      onEnd: () => {
        this.isListening.set(false);
        const leftover = this.interimText().trim();
        if (leftover && !this.promptText.toLowerCase().includes(leftover.toLowerCase())) {
          this.promptText = this.promptText.trim() ? `${this.promptText.trim()} ${leftover}` : leftover;
        }
        this.interimText.set('');
        if (!this.autoSearchHandled && this.promptText.trim()) {
          this.autoSearchHandled = true;
          this.scheduleAutoSearch();
        }
      }
    });
    this.isListening.set(started);
  }

  private scheduleAutoSearch(): void {
    if (this.pendingAutoSearchTimer) {
      clearTimeout(this.pendingAutoSearchTimer);
    }
    this.pendingAutoSearchTimer = setTimeout(() => {
      this.pendingAutoSearchTimer = null;
      if (this.promptText.trim() && !this.isSearching()) {
        this.searchModels();
      }
    }, 150);
  }

  stopSearch(): void {
    this.searchSub?.unsubscribe();
    this.searchSub = null;
    this.isSearching.set(false);
  }

  resetDialog(): void {
    this.cleanupPendingOperations();
    this.isListening.set(false);
    this.interimText.set('');
    this.isSearching.set(false);
    this.isGenerating.set(false);
    this.promptText = '';
    this.extraInstructions = '';
    this.searchResult.set(null);
    this.selectedModel.set(null);
    this.showAllLibrary.set(false);
    this.errorMessage.set(null);
    this.generatedSuccessMessage.set(null);
  }

  searchModels(): void {
    if (this.isSearching()) return;
    this.searchSub?.unsubscribe();
    this.isSearching.set(true);
    this.errorMessage.set(null);
    this.generatedSuccessMessage.set(null);
    this.showAllLibrary.set(false);

    this.searchSub = this.generatorService.searchModels(this.clientId, this.promptText, this.dossierId).subscribe({
      next: res => {
        this.searchResult.set(res);
        // Si exactement 1 modèle correspond, on le pré-sélectionne ; sinon l'avocat choisit
        if (res.matches.length === 1) {
          this.selectedModel.set(res.matches[0]);
        } else {
          this.selectedModel.set(null);
        }
        this.isSearching.set(false);
        this.searchSub = null;
      },
      error: err => {
        this.errorMessage.set(err?.error?.message || 'Impossible de rechercher dans la Bibliothèque de Modèles.');
        this.isSearching.set(false);
        this.searchSub = null;
      }
    });
  }

  selectModel(model: ModelCandidate): void {
    this.selectedModel.set(model);
    this.generatedSuccessMessage.set(null);
  }

  generate(): void {
    const model = this.selectedModel();
    if (!model || this.isGenerating()) return;
    this.generateSub?.unsubscribe();
    this.isGenerating.set(true);
    this.errorMessage.set(null);
    this.generatedSuccessMessage.set(null);

    this.generateSub = this.generatorService.generateDocument({
      clientId: this.clientId,
      dossierId: this.dossierId,
      modelDocumentId: model.id,
      instructions: this.extraInstructions,
      saveToClientGed: this.saveToClientGed
    }).subscribe({
      next: response => {
        const blob = response.body;
        if (blob) {
          const filename = this.extractFilename(response.headers.get('Content-Disposition')) || `${model.title}.docx`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          const archivedId = response.headers.get('X-Archived-Document-Id');
          const mode = response.headers.get('X-Generation-Mode');
          const modeLabel = mode === 'AI_FILLED' ? ' (complété par l\'IA)' : ' (modèle Word pré-rempli)';
          const gedTarget = this.dossierId ? 'la GED du dossier' : 'la GED du client';
          this.generatedSuccessMessage.set(
            `Document « ${filename} » téléchargé${modeLabel}${archivedId ? ' et archivé dans ' + gedTarget : ''} !`
          );
          this.documentGenerated.emit();
        }
        this.isGenerating.set(false);
        this.generateSub = null;
      },
      error: err => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la génération du document.');
        this.isGenerating.set(false);
        this.generateSub = null;
      }
    });
  }

  onClose(): void {
    this.cleanupPendingOperations();
    this.close.emit();
  }

  private extractFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      try { return decodeURIComponent(utf8Match[1]); } catch {}
    }
    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch ? asciiMatch[1] : null;
  }
}

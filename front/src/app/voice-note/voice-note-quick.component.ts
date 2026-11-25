import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VoiceDossierSuggestion, VoiceNoteService } from '../services/voice-note.service';
import { NoteService } from '../services/note.service';
import { NoteCategoryService } from '../services/note-category.service';
import { TaskService } from '../services/task.service';
import { TaskCategoryService } from '../services/task-category.service';
import { TaskStatusService } from '../services/task-status.service';
import { DocumentService } from '../services/document.service';
import { WordExportService } from '../services/word-export.service';
import { AiStatusService } from '../services/ai-status.service';
import { ClientSelectionDialog } from '../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../dossier/dossier-selection-dialog/dossier-selection-dialog';
import { Dossier, Note, NoteCategory, Task, TaskCategory, TaskStatus } from '../appTypes';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-voice-note-quick',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClientSelectionDialog, DossierSelectionDialog],
  template: `
    <div class="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans min-h-full">

      <!-- En-tête compact + fil d'étapes -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Studio de Dictée Vocale</h1>
              <span class="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold uppercase tracking-wider">
                PWA Mobile
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">
              Dictez votre compte-rendu d'audience ou une instruction — transcrit, structuré et classé au dossier.
            </p>
          </div>
        </div>

        <!-- Indicateur d'étapes -->
        <div class="hidden md:flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-2xs text-[11px] font-bold">
          <span class="inline-flex items-center gap-1.5" [ngClass]="transcript.trim() || isRecording() ? 'text-indigo-700' : 'text-slate-400'">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              [ngClass]="transcript.trim() ? 'bg-emerald-100 text-emerald-700' : (isRecording() ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500')">
              {{ transcript.trim() ? '✓' : '1' }}
            </span>
            Dicter
          </span>
          <span class="text-slate-300">›</span>
          <span class="inline-flex items-center gap-1.5" [ngClass]="selectedDossierId ? 'text-indigo-700' : 'text-slate-400'">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              [ngClass]="selectedDossierId ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
              {{ selectedDossierId ? '✓' : '2' }}
            </span>
            Dossier
          </span>
          <span class="text-slate-300">›</span>
          <span class="inline-flex items-center gap-1.5" [ngClass]="savedNoteId() || directTaskCreated() ? 'text-emerald-700' : 'text-slate-400'">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              [ngClass]="savedNoteId() || directTaskCreated() ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
              {{ savedNoteId() || directTaskCreated() ? '✓' : '3' }}
            </span>
            Classer
          </span>
        </div>
      </div>

      <!-- Alertes globales (Erreur / Succès Note / Succès Tâche) -->
      <div *ngIf="errorMessage()" class="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3">
        <span>⚠️ {{ errorMessage() }}</span>
        <button type="button" (click)="errorMessage.set(null)" class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer">✕</button>
      </div>

      <div *ngIf="savedNoteId()" class="rounded-2xl border border-emerald-200 bg-emerald-50/90 text-emerald-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-2xs">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm">✓</span>
          <span>
            Note enregistrée dans le dossier{{ savedAudioArchived() ? ' avec son enregistrement audio archivé en GED' : '' }} !
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" (click)="exportSavedToWord()"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition">
            📄 Exporter .docx
          </button>
          <a *ngIf="selectedDossierId" [routerLink]="['/home/dossier-detail', selectedDossierId, 'notes']"
            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition">
            Ouvrir les Notes ↗
          </a>
        </div>
      </div>

      <div *ngIf="directTaskCreated()" class="rounded-2xl border border-emerald-200 bg-emerald-50/90 text-emerald-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-2xs">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm">✓</span>
          <span>Tâche créée dans le dossier{{ audioBlob() && saveAudioToGed ? ' avec son audio associé' : '' }} !</span>
        </div>
        <a *ngIf="selectedDossierId" [routerLink]="['/home/dossier-detail', selectedDossierId, 'taches']"
          class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition">
          Ouvrir les Tâches ↗
        </a>
      </div>

      <!-- Grille Principale : Studio Vocal (gauche) + Rédaction & Classement (droite) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- COLONNE GAUCHE : Console Micro + Audio -->
        <div class="lg:col-span-5 space-y-5">
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-slate-800">
            <!-- Halo subtil en arrière-plan -->
            <div class="pointer-events-none absolute -top-20 -end-20 w-56 h-56 rounded-full blur-3xl transition-colors duration-500"
              [ngClass]="isRecording() ? 'bg-rose-500/30' : 'bg-indigo-500/25'"></div>

            <!-- Barre supérieure : Statut + Sélecteur de langue segmenté -->
            <div class="relative flex items-center justify-between gap-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border"
                [ngClass]="isRecording()
                  ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                  : 'bg-white/10 text-slate-200 border-white/15'">
                <span class="w-2 h-2 rounded-full"
                  [ngClass]="isRecording() ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'"></span>
                <span>{{ isRecording() ? 'Enregistrement actif' : 'Prêt à dicter' }}</span>
              </div>

              <!-- Langue segmentée -->
              <div class="inline-flex p-0.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-[11px] font-bold">
                <button type="button" (click)="speechLang = 'fr-FR'" [disabled]="isRecording()"
                  class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  [ngClass]="speechLang === 'fr-FR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'">
                  FR
                </button>
                <button type="button" (click)="speechLang = 'ar-MA'" [disabled]="isRecording()"
                  class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  [ngClass]="speechLang === 'ar-MA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'">
                  AR
                </button>
                <button type="button" (click)="speechLang = 'en-US'" [disabled]="isRecording()"
                  class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  [ngClass]="speechLang === 'en-US' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'">
                  EN
                </button>
              </div>
            </div>

            <!-- Zone centrale Micro + Equalizer + Chronomètre -->
            <div class="relative py-8 flex flex-col items-center text-center gap-5">
              <div class="relative flex items-center justify-center">
                <!-- Ondes acoustiques quand actif -->
                <span *ngIf="isRecording()"
                  class="absolute w-36 h-36 rounded-full bg-rose-500/20 animate-ping"></span>
                <span *ngIf="isRecording()"
                  class="absolute w-32 h-32 rounded-full border-2 border-rose-400/40"></span>

                <button type="button" (click)="toggleRecording()"
                  class="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer"
                  [ngClass]="isRecording()
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-8 ring-rose-500/25'
                    : 'bg-gradient-to-br from-white to-indigo-50 text-indigo-700 hover:scale-105 ring-8 ring-white/10'">
                  <svg *ngIf="!isRecording()" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <svg *ngIf="isRecording()" class="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="3" />
                  </svg>
                </button>
              </div>

              <!-- Chronomètre + barres audio -->
              <div class="space-y-1.5">
                <div class="text-2xl font-black tracking-tight tabular-nums"
                  [ngClass]="isRecording() ? 'text-rose-300' : 'text-white'">
                  {{ isRecording() ? formattedElapsed() : '00:00' }}
                </div>
                <p class="text-xs font-medium text-slate-300">
                  {{ isRecording() ? 'Parlez naturellement — cliquez pour arrêter' : 'Appuyez sur le micro pour commencer la dictée' }}
                </p>

                <!-- Mini visualiseur animé -->
                <div *ngIf="isRecording()" class="flex items-end justify-center gap-1 h-5 pt-1">
                  <span class="w-1 bg-rose-400 rounded-full animate-bounce h-2" style="animation-delay: 0ms"></span>
                  <span class="w-1 bg-rose-300 rounded-full animate-bounce h-4" style="animation-delay: 120ms"></span>
                  <span class="w-1 bg-cyan-300 rounded-full animate-bounce h-5" style="animation-delay: 240ms"></span>
                  <span class="w-1 bg-rose-300 rounded-full animate-bounce h-3" style="animation-delay: 360ms"></span>
                  <span class="w-1 bg-rose-400 rounded-full animate-bounce h-4" style="animation-delay: 480ms"></span>
                </div>
              </div>

              <!-- Aperçu temps réel de la parole -->
              <div *ngIf="interimText()"
                class="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs text-cyan-200 italic leading-relaxed">
                « {{ interimText() }}… »
              </div>

              <div *ngIf="!voiceService.isSpeechSupported"
                class="w-full rounded-xl bg-amber-500/20 border border-amber-400/40 px-3.5 py-2 text-[11px] text-amber-200 font-semibold">
                Reconnaissance vocale non supportée sur ce navigateur — saisissez ou collez votre texte à droite.
              </div>
            </div>

            <!-- Lecteur Audio Capturé intégré -->
            <div *ngIf="audioPreviewUrl()" class="relative mt-2 pt-4 border-t border-white/10 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xs">🎧</span>
                  <div>
                    <div class="text-xs font-bold text-white">Audio capturé</div>
                    <div class="text-[10px] text-slate-400 font-medium">{{ audioSizeKb() }} Ko • prêt pour archivage</div>
                  </div>
                </div>
                <button type="button" (click)="discardAudio()"
                  class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/30 text-[11px] font-bold text-slate-300 hover:text-rose-200 cursor-pointer transition">
                  Supprimer
                </button>
              </div>
              <audio [src]="audioPreviewUrl()" controls class="w-full h-9 rounded-lg"></audio>
              <label class="flex items-center gap-2.5 text-[11px] font-medium text-slate-300 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="saveAudioToGed" class="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500" />
                <span>Archiver l'audio dans la GED du dossier (MinIO)</span>
              </label>
            </div>
          </div>

          <!-- Conseil rapide -->
          <div class="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs space-y-2">
            <div class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>💡</span> Astuce dictée rapide
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Mentionnez le <b class="text-slate-700">nom du client</b> ou la <b class="text-slate-700">référence du dossier</b> : l'application propose automatiquement le bon dossier et détecte les tâches ou dates d'audience avec l'IA.
            </p>
          </div>
        </div>

        <!-- COLONNE DROITE : Classement, Rédaction & Actions -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">

          <!-- Détection automatique de dossier -->
          <div *ngIf="suggestedDossier() as sug"
            class="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="text-indigo-950">
              <span class="font-extrabold">✨ Dossier détecté :</span>
              <span class="font-bold"> {{ sug.referenceInterne }}</span> — {{ sug.titre }}
              <span class="text-indigo-600 font-medium"> ({{ sug.reason }})</span>
            </div>
            <button *ngIf="selectedDossierId !== sug.dossierId" type="button" (click)="applySuggestedDossier(sug)"
              class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition">
              Appliquer
            </button>
          </div>

          <!-- Sélection Client & Dossier -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">1. Client</label>
              <button type="button" (click)="showClientDialog.set(true)"
                class="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-slate-50/80 hover:bg-white transition-all text-xs font-bold cursor-pointer"
                [ngClass]="selectedClientName() ? 'border-indigo-300 text-slate-900' : 'border-slate-200 text-slate-500 hover:border-indigo-300'">
                <span class="truncate">{{ selectedClientName() ? ('👤 ' + selectedClientName()) : '🔍 Choisir un client...' }}</span>
                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                2. Dossier cible <span class="text-rose-500">*</span>
              </label>
              <button type="button" (click)="openDossierPicker()"
                class="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-slate-50/80 hover:bg-white transition-all text-xs font-bold cursor-pointer"
                [ngClass]="selectedDossierLabel() ? 'border-emerald-300 bg-emerald-50/30 text-slate-900' : 'border-slate-200 text-slate-500 hover:border-indigo-300'">
                <span class="truncate">{{ selectedDossierLabel() ? ('📂 ' + selectedDossierLabel()) : '📂 Choisir un dossier...' }}</span>
                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Catégorie & Titre -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Catégorie</label>
              <select [(ngModel)]="selectedCategoryId"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none transition-all">
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.label }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Titre</label>
              <input type="text" [(ngModel)]="noteTitle" placeholder="Ex. Compte-rendu d'audience TPI — renvoi au 14/12"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all" />
            </div>
          </div>

          <!-- Zone Transcription / Contenu -->
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contenu transcrit</label>
                <span *ngIf="transcript.trim()" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold tabular-nums">
                  {{ wordCount() }} mot{{ wordCount() > 1 ? 's' : '' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button *ngIf="aiStatusService.isAiEnabled$ | async" type="button" (click)="structureWithAi()" [disabled]="isStructuring() || !transcript.trim()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-bold cursor-pointer disabled:opacity-45 transition-colors">
                  <span *ngIf="isStructuring()" class="w-3 h-3 rounded-full border-2 border-violet-300 border-t-violet-700 animate-spin"></span>
                  <span>{{ isStructuring() ? 'Structuration...' : '✨ Structurer avec l\'IA' }}</span>
                </button>
                <button *ngIf="transcript || noteTitle" type="button" (click)="clearDraft()"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors">
                  Effacer
                </button>
              </div>
            </div>
            <textarea [(ngModel)]="transcript" rows="8"
              placeholder="Votre transcription apparaîtra ici en temps réel. Vous pouvez aussi modifier le texte librement ou demander à l'IA de le structurer en compte-rendu juridique..."
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 p-4 text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none transition-all resize-y"></textarea>
          </div>

          <!-- Éléments détectés par l'IA (Audience + Tâches 1 clic) -->
          <div *ngIf="suggestedTasks().length > 0 || suggestedEventTitle()"
            class="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-indigo-50/40 p-4 space-y-3 text-xs text-violet-950">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-extrabold flex items-center gap-1.5">
                <span>✨</span> Éléments détectés dans votre dictée
              </div>
              <a *ngIf="selectedDossierId && createdTasksCount() > 0"
                [routerLink]="['/home/dossier-detail', selectedDossierId, 'taches']"
                class="text-xs font-bold text-indigo-700 hover:underline">
                Voir les tâches ({{ createdTasksCount() }} créée(s)) ↗
              </a>
            </div>
            <div *ngIf="suggestedEventTitle()" class="px-3 py-2 rounded-xl bg-white/80 border border-violet-100">
              <span class="font-bold">📅 Audience / RDV :</span> {{ suggestedEventTitle() }}
              <span *ngIf="suggestedEventDate()" class="text-violet-700 font-semibold"> — {{ suggestedEventDate() }}</span>
            </div>
            <div *ngIf="suggestedTasks().length > 0" class="space-y-2">
              <div class="font-bold text-violet-900">✅ Tâches suggérées (création en 1 clic) :</div>
              <div *ngFor="let t of suggestedTasks(); let i = index"
                class="flex items-center justify-between gap-2 bg-white rounded-xl border border-violet-100 px-3.5 py-2 shadow-2xs">
                <span class="font-medium text-slate-800">{{ t }}</span>
                <button type="button" (click)="createSingleTaskFromText(t, i)"
                  [disabled]="!selectedDossierId || createdSuggestedTaskIndexes().includes(i) || creatingTaskIndex() === i"
                  class="px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                  [ngClass]="createdSuggestedTaskIndexes().includes(i)
                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'">
                  {{ createdSuggestedTaskIndexes().includes(i) ? '✓ Créée' : (creatingTaskIndex() === i ? '...' : '+ Créer tâche') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Barre d'actions finale -->
          <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p class="text-[11px] text-slate-400 font-medium">
              <span *ngIf="!selectedDossierId">Sélectionnez un dossier cible pour enregistrer.</span>
              <span *ngIf="selectedDossierId && !transcript.trim()">Dictez ou saisissez un contenu pour continuer.</span>
              <span *ngIf="selectedDossierId && transcript.trim()" class="text-emerald-600 font-semibold">✓ Prêt à enregistrer dans le dossier</span>
            </p>
            <div class="flex flex-wrap items-center justify-end gap-2.5">
              <button type="button" (click)="saveDirectAsTask()" [disabled]="isCreatingDirectTask() || !selectedDossierId || !transcript.trim()"
                class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 disabled:opacity-45 text-xs font-extrabold cursor-pointer transition-all">
                {{ isCreatingDirectTask() ? 'Création...' : '✓ Créer comme Tâche' }}
              </button>
              <button type="button" (click)="saveToDossier()" [disabled]="isSaving() || !selectedDossierId || !transcript.trim()"
                class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-45 text-white text-xs font-extrabold shadow-md shadow-indigo-200/70 cursor-pointer transition-all">
                {{ isSaving() ? 'Enregistrement...' : 'Enregistrer la Note' }}
              </button>
            </div>
          </div>
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
  public aiStatusService = inject(AiStatusService);
  private noteService = inject(NoteService);
  private categoryService = inject(NoteCategoryService);
  private taskService = inject(TaskService);
  private taskCategoryService = inject(TaskCategoryService);
  private taskStatusService = inject(TaskStatusService);
  private documentService = inject(DocumentService);
  private wordExportService = inject(WordExportService);
  private http = inject(HttpClient);

  defaultTaskCategory: TaskCategory | null = null;
  defaultTaskStatus: TaskStatus | null = null;
  creatingTaskIndex = signal<number | null>(null);
  createdSuggestedTaskIndexes = signal<number[]>([]);
  createdTasksCount = signal(0);
  isCreatingDirectTask = signal(false);
  directTaskCreated = signal(false);

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
  private uploadedAudioDocId: number | null = null;

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
      error: () => { }
    });

    this.taskCategoryService.getAll().subscribe({
      next: (res: any) => {
        const list: TaskCategory[] = res?.content || (Array.isArray(res) ? res : []);
        if (list.length > 0) this.defaultTaskCategory = list[0];
      },
      error: () => { }
    });

    this.taskStatusService.getAll().subscribe({
      next: (res: any) => {
        const list: TaskStatus[] = res?.content || (Array.isArray(res) ? res : []);
        this.defaultTaskStatus = list.find(s => !s.isClosingStatus) || list[0] || null;
      },
      error: () => { }
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

  wordCount(): number {
    const t = this.transcript.trim();
    return t ? t.split(/\s+/).length : 0;
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
    this.uploadedAudioDocId = null;
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
      error: () => { }
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

  private async ensureAudioUploaded(title: string): Promise<number | null> {
    if (!this.saveAudioToGed || !this.audioBlob() || !this.selectedDossierId) {
      return null;
    }
    if (this.uploadedAudioDocId) {
      return this.uploadedAudioDocId;
    }
    try {
      const b64 = await this.voiceService.blobToBase64(this.audioBlob()!);
      const ext = this.audioMimeType().includes('mp4') ? 'm4a' : (this.audioMimeType().includes('ogg') ? 'ogg' : 'webm');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
      const docPayload: any = {
        dossierId: this.selectedDossierId,
        nomFichier: `Dictee_vocale_${stamp}.${ext}`,
        description: `Enregistrement vocal : ${title}`,
        fileData: b64
      };
      return await new Promise<number | null>(resolve => {
        this.documentService.create(docPayload).subscribe({
          next: (createdDoc: any) => {
            const id = createdDoc?.id ? Number(createdDoc.id) : null;
            this.uploadedAudioDocId = id;
            resolve(id);
          },
          error: () => resolve(null)
        });
      });
    } catch {
      return null;
    }
  }

  async saveToDossier(): Promise<void> {
    if (!this.selectedDossierId || !this.transcript.trim() || this.isSaving()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const title = this.noteTitle.trim() || `Compte-rendu vocal du ${new Date().toLocaleDateString('fr-FR')}`;
    const audioDocId = await this.ensureAudioUploaded(title);

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
  }

  async createSingleTaskFromText(taskText: string, index: number): Promise<void> {
    if (!this.selectedDossierId || !taskText.trim()) return;
    this.creatingTaskIndex.set(index);
    const audioDocId = await this.ensureAudioUploaded(taskText.trim());
    const payload = this.buildTaskPayload(taskText.trim(), `Issue de la dictée vocale : ${this.noteTitle || 'Compte-rendu'}`, audioDocId);
    this.taskService.create(payload).subscribe({
      next: () => {
        this.creatingTaskIndex.set(null);
        this.createdSuggestedTaskIndexes.update(arr => [...arr, index]);
        this.createdTasksCount.update(c => c + 1);
      },
      error: err => {
        this.creatingTaskIndex.set(null);
        this.errorMessage.set(err?.error?.message || 'Impossible de créer la tâche.');
      }
    });
  }

  async saveDirectAsTask(): Promise<void> {
    if (!this.selectedDossierId || !this.transcript.trim() || this.isCreatingDirectTask()) return;
    this.isCreatingDirectTask.set(true);
    this.directTaskCreated.set(false);
    this.errorMessage.set(null);

    const titre = this.noteTitle.trim()
      || (this.transcript.trim().length > 80 ? this.transcript.trim().substring(0, 80) + '…' : this.transcript.trim());
    const audioDocId = await this.ensureAudioUploaded(titre);
    const payload = this.buildTaskPayload(titre, this.transcript.trim(), audioDocId);
    this.taskService.create(payload).subscribe({
      next: () => {
        this.isCreatingDirectTask.set(false);
        this.directTaskCreated.set(true);
        this.createdTasksCount.update(c => c + 1);
      },
      error: err => {
        this.isCreatingDirectTask.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible de créer la tâche dans le dossier.');
      }
    });
  }

  private buildTaskPayload(titre: string, description: string, audioDocumentId: number | null = null): Task {
    const dueDate = this.suggestedEventDate() || new Date().toISOString().split('T')[0];
    return {
      titre,
      description,
      priorite: 'NORMALE',
      dateEcheance: dueDate,
      category: this.defaultTaskCategory!,
      status: this.defaultTaskStatus!,
      assignees: [],
      dossierId: Number(this.selectedDossierId),
      isCompleted: false,
      audioDocumentId,
      createdAt: new Date()
    } as Task;
  }

  exportSavedToWord(): void {
    const id = this.savedNoteId();
    if (!id) return;
    this.wordExportService.downloadNote(id, `Note_Vocale_${id}.docx`).subscribe({ error: () => { } });
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

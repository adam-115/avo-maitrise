import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConflictCheckResponse, ConflictCheckService, ConflictMatch } from '../../services/conflict-check.service';

@Component({
  selector: 'app-conflict-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div>
            <h2 class="text-base font-black tracking-tight">Vérification rapide des conflits d'intérêts</h2>
            <p class="text-xs text-indigo-100 mt-0.5">
              Recherchez un nom, une société, un dirigeant, un UBO, un e-mail, un CIN ou un RC/NIF avant d'accepter un dossier.
            </p>
          </div>
          <button type="button" (click)="close.emit()" class="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer font-bold">✕</button>
        </div>

        <!-- Search input -->
        <div class="p-5 border-b border-slate-100 bg-slate-50/70">
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="queryText" (keyup.enter)="runSearch()"
              placeholder="Ex. Marc Moreau, Alpha Conseil, 012345678, contact@societe.fr..."
              class="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:outline-none" />
            <button type="button" (click)="runSearch()" [disabled]="isChecking() || !queryText.trim()"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2 shrink-0">
              <svg *ngIf="isChecking()" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>{{ isChecking() ? 'Analyse...' : 'Vérifier' }}</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">
            Astuce : vous pouvez saisir plusieurs noms séparés par une virgule (ex. <code>Moreau SAS, Marc Moreau</code>).
          </p>
        </div>

        <!-- Results -->
        <div class="p-5 overflow-y-auto flex-1 space-y-3">
          <div *ngIf="!result() && !isChecking()" class="py-10 text-center text-xs text-slate-400">
            Saisissez un nom de personne, société, dirigeant ou UBO puis cliquez sur <b>Vérifier</b>.
          </div>

          <ng-container *ngIf="result() as res">
            <!-- Verdict banner -->
            <div *ngIf="!res.hasConflict"
              class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-900">
              <span class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">✓</span>
              <div>
                <div class="text-sm font-extrabold">Aucun conflit d'intérêts détecté</div>
                <div class="text-xs text-emerald-700">Aucune correspondance trouvée parmi les clients, parties adverses, dirigeants ou UBOs du cabinet.</div>
              </div>
            </div>

            <div *ngIf="res.hasConflict"
              class="rounded-xl border p-4 flex items-center justify-between gap-3"
              [ngClass]="res.riskLevel === 'CRITICAL' ? 'border-rose-300 bg-rose-50 text-rose-900' : (res.riskLevel === 'HIGH' ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-amber-300 bg-amber-50 text-amber-900')">
              <div>
                <div class="text-sm font-extrabold">
                  ⚠ {{ res.matches.length }} alerte(s) détectée(s) — Risque {{ labelRisk(res.riskLevel) }}
                </div>
                <div class="text-xs opacity-85 mt-0.5">Vérifiez les liens ci-dessous avant toute acceptation de mandat.</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-white/80 border">
                {{ labelRisk(res.riskLevel) }}
              </span>
            </div>

            <!-- Match list -->
            <div *ngFor="let m of res.matches"
              class="rounded-xl border p-3.5 bg-white space-y-1.5 shadow-2xs"
              [ngClass]="m.severity === 'CRITICAL' ? 'border-rose-200' : (m.severity === 'HIGH' ? 'border-orange-200' : 'border-amber-200')">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase" [ngClass]="severityClass(m.severity)">
                    {{ labelRisk(m.severity) }}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                    {{ labelMatchType(m.matchType) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <a *ngIf="m.matchedClientId" [routerLink]="['/home/client-details']" [queryParams]="{ id: m.matchedClientId }"
                    (click)="close.emit()" class="font-bold text-indigo-600 hover:underline">
                    Fiche client ↗
                  </a>
                  <a *ngIf="m.matchedDossierId" [routerLink]="['/home/dossier-detail', m.matchedDossierId, 'vue-ensemble']"
                    (click)="close.emit()" class="font-bold text-cyan-700 hover:underline">
                    Dossier {{ m.matchedDossierReference }} ↗
                  </a>
                </div>
              </div>
              <p class="text-xs text-slate-800 font-medium leading-relaxed">{{ m.explanation }}</p>
            </div>
          </ng-container>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button type="button" (click)="close.emit()"
            class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConflictSearchDialogComponent {
  @Output() close = new EventEmitter<void>();

  private conflictService = inject(ConflictCheckService);

  queryText = '';
  isChecking = signal(false);
  result = signal<ConflictCheckResponse | null>(null);

  runSearch(): void {
    const queries = this.queryText.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length >= 2);
    if (queries.length === 0) return;

    this.isChecking.set(true);
    this.conflictService.check({ freeTextQueries: queries }).subscribe({
      next: res => {
        this.result.set(res);
        this.isChecking.set(false);
      },
      error: () => this.isChecking.set(false)
    });
  }

  labelRisk(level: string): string {
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
      case 'HOMONYME': return 'Nom proche / Homonyme';
      default: return type;
    }
  }

  severityClass(sev: string): string {
    if (sev === 'CRITICAL') return 'bg-rose-600 text-white';
    if (sev === 'HIGH') return 'bg-orange-500 text-white';
    return 'bg-amber-400 text-amber-950';
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClientStatus } from '../../../appTypes';

@Component({
  selector: 'app-client-status-alert',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div *ngIf="status" class="w-full animate-fade-in-down">
      
      <!-- ==================== 1. BLOCKED (PULSING & FLASHING RED) ==================== -->
      <div *ngIf="status === 'BLOCKED'" 
           class="relative overflow-hidden rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-50 via-rose-50 to-red-100/70 p-4 shadow-md animate-pulse-danger">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <!-- Pulsing Beacon & Danger Icon -->
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30 flex-shrink-0 mt-0.5">
              <svg class="h-5 w-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse flex-shrink-0">
                  <span class="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                  {{ 'CLIENT_STATUS_ALERT.BLOCKED_BADGE' | translate }}
                </span>
                <span class="text-sm font-black text-red-950 tracking-tight animate-flash-red">
                  {{ 'CLIENT_STATUS_ALERT.BLOCKED_TITLE' | translate }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-semibold text-red-800/90 leading-relaxed">
                {{ 'CLIENT_STATUS_ALERT.BLOCKED_DESC' | translate }}
              </p>
            </div>
          </div>

          <!-- Quick Action to AML Review -->
          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start md:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{{ 'CLIENT_STATUS_ALERT.VIEW_AML' | translate }}</span>
              <svg class="h-3.5 w-3.5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== 2. AML_REQUIRED (PULSING AMBER) ==================== -->
      <div *ngIf="status === 'AML_REQUIRED'" 
           class="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50/60 p-4 shadow-sm animate-pulse-amber">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 flex-shrink-0 mt-0.5">
              <svg class="h-5 w-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex-shrink-0">
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping"></span>
                  {{ 'CLIENT_STATUS_ALERT.AML_REQUIRED_BADGE' | translate }}
                </span>
                <span class="text-sm font-bold text-amber-950">
                  {{ 'CLIENT_STATUS_ALERT.AML_REQUIRED_TITLE' | translate }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium text-amber-800/90 leading-relaxed">
                {{ 'CLIENT_STATUS_ALERT.AML_REQUIRED_DESC' | translate }}
              </p>
            </div>
          </div>

          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start md:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap">
              <span>{{ 'CLIENT_STATUS_ALERT.COMPLETE_AML' | translate }}</span>
              <svg class="h-3.5 w-3.5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== 3. VERIFICATION_AML_REQUIRED (PULSING SKY/BLUE) ==================== -->
      <div *ngIf="status === 'VERIFICATION_AML_REQUIRED'" 
           class="relative overflow-hidden rounded-2xl border border-sky-300 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50/60 p-4 shadow-sm animate-pulse-blue">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20 flex-shrink-0 mt-0.5">
              <svg class="h-5 w-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 animate-pulse flex-shrink-0">
                  <span class="h-1.5 w-1.5 rounded-full bg-sky-600 animate-ping"></span>
                  {{ 'CLIENT_STATUS_ALERT.VERIFICATION_BADGE' | translate }}
                </span>
                <span class="text-sm font-bold text-sky-950">
                  {{ 'CLIENT_STATUS_ALERT.VERIFICATION_TITLE' | translate }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium text-sky-800/90 leading-relaxed">
                {{ 'CLIENT_STATUS_ALERT.VERIFICATION_DESC' | translate }}
              </p>
            </div>
          </div>

          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start md:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap">
              <span>{{ 'CLIENT_STATUS_ALERT.CHECK_AML' | translate }}</span>
              <svg class="h-3.5 w-3.5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== 4. INDULGENCE_REQUIRED (PULSING PURPLE) ==================== -->
      <div *ngIf="status === 'INDULGENCE_REQUIRED'" 
           class="relative overflow-hidden rounded-2xl border border-purple-300 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-100/60 p-4 shadow-sm animate-pulse-purple">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 flex-shrink-0 mt-0.5">
              <svg class="h-5 w-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300 animate-pulse flex-shrink-0">
                  <span class="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping"></span>
                  {{ 'CLIENT_STATUS_ALERT.INDULGENCE_BADGE' | translate }}
                </span>
                <span class="text-sm font-bold text-purple-950">
                  {{ 'CLIENT_STATUS_ALERT.INDULGENCE_TITLE' | translate }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium text-purple-800/90 leading-relaxed">
                {{ 'CLIENT_STATUS_ALERT.INDULGENCE_DESC' | translate }}
              </p>
            </div>
          </div>

          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start md:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap">
              <span>{{ 'CLIENT_STATUS_ALERT.REVIEW_INDULGENCE' | translate }}</span>
              <svg class="h-3.5 w-3.5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== 5. AML_VALIDATED or VALIDATED (EMERALD STATUS) ==================== -->
      <div *ngIf="status === 'AML_VALIDATED' || status === 'VALIDATED'" 
           class="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 p-3.5 sm:p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  {{ 'CLIENT_STATUS_ALERT.VALIDATED_BADGE' | translate }}
                </span>
                <span class="text-xs sm:text-sm font-bold text-emerald-950">{{ 'CLIENT_STATUS_ALERT.VALIDATED_TITLE' | translate }}</span>
              </div>
              <p class="text-xs text-emerald-700 font-medium truncate mt-0.5">
                {{ 'CLIENT_STATUS_ALERT.VALIDATED_DESC' | translate }}
              </p>
            </div>
          </div>
          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start sm:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline-offset-2 hover:underline transition-colors whitespace-nowrap">
              {{ 'CLIENT_STATUS_ALERT.VIEW_AML_DETAILS' | translate }}
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== 6. OTHER STATUS (PULSING FALLBACK) ==================== -->
      <div *ngIf="status !== 'BLOCKED' && status !== 'AML_REQUIRED' && status !== 'VERIFICATION_AML_REQUIRED' && status !== 'INDULGENCE_REQUIRED' && status !== 'AML_VALIDATED' && status !== 'VALIDATED'"
           class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 shadow-sm animate-pulse-slate">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="relative flex h-3 w-3 flex-shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            </span>
            <p class="text-xs sm:text-sm font-semibold text-slate-700 truncate">
              <span>{{ 'CLIENT_STATUS_ALERT.STATUS_LABEL' | translate }} : </span>
              <span class="font-bold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded-md">{{ formatStatus(status) }}</span>
            </p>
          </div>
          <div *ngIf="clientId && showLink" class="flex-shrink-0 self-start sm:self-center">
            <a [routerLink]="['/home/client-conformity']" [queryParams]="{ id: clientId }"
               class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">
              {{ 'CLIENT_STATUS_ALERT.VIEW_AML' | translate }}
            </a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeInDown {
      0% { opacity: 0; transform: translateY(-8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-down {
      animation: fadeInDown 0.3s ease-out forwards;
    }

    @keyframes pulseDangerGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45);
        border-color: rgba(239, 68, 68, 0.85);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
        border-color: rgba(239, 68, 68, 0.4);
      }
    }

    @keyframes flashRedText {
      0%, 100% {
        color: #991b1b;
        opacity: 1;
      }
      50% {
        color: #dc2626;
        opacity: 0.7;
      }
    }

    @keyframes pulseAmberGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
      }
    }

    @keyframes pulseBlueGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(14, 165, 233, 0);
      }
    }

    @keyframes pulsePurpleGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(168, 85, 247, 0);
      }
    }

    @keyframes pulseSlateGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(100, 116, 139, 0.3);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(100, 116, 139, 0);
      }
    }

    .animate-pulse-danger {
      animation: pulseDangerGlow 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .animate-pulse-amber {
      animation: pulseAmberGlow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .animate-pulse-blue {
      animation: pulseBlueGlow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .animate-pulse-purple {
      animation: pulsePurpleGlow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .animate-pulse-slate {
      animation: pulseSlateGlow 2.2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .animate-flash-red {
      animation: flashRedText 1.2s infinite ease-in-out;
    }
  `]
})
export class ClientStatusAlertComponent {
  @Input() status?: ClientStatus | string;
  @Input() clientId?: number | string;
  @Input() clientName?: string;
  @Input() showLink: boolean = true;

  formatStatus(statusStr: string): string {
    return statusStr.replace(/_/g, ' ');
  }
}


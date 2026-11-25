import { Component, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { AiStatusService } from '../../services/ai-status.service';
import { MailIntegrationStatusService } from '../../services/mail-integration-status.service';

export interface CommandItem {
  id: string;
  group: 'ACTIONS' | 'DOSSIERS' | 'CLIENTS';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen()"
      (click)="close()"
      class="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-150">
      <div (click)="$event.stopPropagation()"
        class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]">

        <!-- Barre de recherche -->
        <div class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/60">
          <svg class="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input #searchInput
            type="text"
            [ngModel]="query()"
            (ngModelChange)="onQueryChange($event)"
            placeholder="Rechercher un dossier, un client ou une action rapide..."
            class="flex-1 bg-transparent border-none text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
          <span *ngIf="isLoading()" class="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></span>
          <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-500 shadow-2xs">
            ESC
          </kbd>
        </div>

        <!-- Résultats -->
        <div class="overflow-y-auto p-2 space-y-3 flex-1">
          <ng-container *ngIf="filteredItems().length > 0; else emptyState">
            <!-- Actions rapides -->
            <div *ngIf="actionItems().length > 0">
              <div class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Actions rapides
              </div>
              <button *ngFor="let item of actionItems()"
                type="button"
                (click)="execute(item)"
                (mouseenter)="setSelectedById(item.id)"
                [ngClass]="isSelected(item.id) ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200' : 'text-slate-700 hover:bg-slate-50'"
                class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    [ngClass]="isSelected(item.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'">
                    {{ item.icon }}
                  </span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold truncate">{{ item.title }}</div>
                    <div *ngIf="item.subtitle" class="text-[11px] text-slate-500 truncate">{{ item.subtitle }}</div>
                  </div>
                </div>
                <span *ngIf="item.badge" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
                  {{ item.badge }}
                </span>
              </button>
            </div>

            <!-- Dossiers -->
            <div *ngIf="dossierItems().length > 0">
              <div class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Dossiers ({{ dossierItems().length }})
              </div>
              <button *ngFor="let item of dossierItems()"
                type="button"
                (click)="execute(item)"
                (mouseenter)="setSelectedById(item.id)"
                [ngClass]="isSelected(item.id) ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200' : 'text-slate-700 hover:bg-slate-50'"
                class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    [ngClass]="isSelected(item.id) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'">
                    {{ item.icon }}
                  </span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold truncate">{{ item.title }}</div>
                    <div *ngIf="item.subtitle" class="text-[11px] text-slate-500 truncate">{{ item.subtitle }}</div>
                  </div>
                </div>
                <span *ngIf="item.badge" class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold shrink-0">
                  {{ item.badge }}
                </span>
              </button>
            </div>

            <!-- Clients -->
            <div *ngIf="clientItems().length > 0">
              <div class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Clients ({{ clientItems().length }})
              </div>
              <button *ngFor="let item of clientItems()"
                type="button"
                (click)="execute(item)"
                (mouseenter)="setSelectedById(item.id)"
                [ngClass]="isSelected(item.id) ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200' : 'text-slate-700 hover:bg-slate-50'"
                class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    [ngClass]="isSelected(item.id) ? 'bg-indigo-600 text-white' : 'bg-emerald-50 text-emerald-700'">
                    {{ item.icon }}
                  </span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold truncate">{{ item.title }}</div>
                    <div *ngIf="item.subtitle" class="text-[11px] text-slate-500 truncate">{{ item.subtitle }}</div>
                  </div>
                </div>
                <span *ngIf="item.badge" class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold shrink-0">
                  {{ item.badge }}
                </span>
              </button>
            </div>
          </ng-container>

          <ng-template #emptyState>
            <div class="py-10 text-center text-xs text-slate-400 font-medium">
              Aucun résultat pour « <span class="text-slate-700 font-bold">{{ query() }}</span> »
            </div>
          </ng-template>
        </div>

        <!-- Pied de palette avec raccourcis clavier -->
        <div class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold text-[10px]">↑↓</kbd> naviguer</span>
            <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold text-[10px]">↵</kbd> ouvrir</span>
          </div>
          <span class="font-semibold text-slate-400">Recherche rapide Avo-Maîtrise</span>
        </div>
      </div>
    </div>
  `
})
export class CommandPaletteComponent {
  private router = inject(Router);
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private aiStatusService = inject(AiStatusService);
  private mailStatusService = inject(MailIntegrationStatusService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  isLoading = signal(false);
  query = signal('');
  selectedIndex = signal(0);

  private dossiers = signal<any[]>([]);
  private clients = signal<any[]>([]);
  private dataLoaded = false;

  private buildQuickActions(): CommandItem[] {
    const items: CommandItem[] = [
      {
        id: 'act-voice',
        group: 'ACTIONS',
        title: 'Dictée vocale / Note rapide',
        subtitle: 'Dicter un compte-rendu d\'audience ou une tâche',
        badge: '🎙️ Mobile',
        icon: '🎙️',
        action: () => this.router.navigateByUrl('/home/dictee-rapide')
      },
      {
        id: 'act-new-dossier',
        group: 'ACTIONS',
        title: 'Nouveau dossier',
        subtitle: 'Ouvrir un nouveau dossier juridique',
        badge: '+ Dossier',
        icon: '📁',
        action: () => this.router.navigateByUrl('/home/dossier/new')
      },
      {
        id: 'act-dossiers',
        group: 'ACTIONS',
        title: 'Liste des dossiers',
        subtitle: 'Consulter et filtrer tous les dossiers',
        icon: '📂',
        action: () => this.router.navigateByUrl('/home/dossier')
      },
      {
        id: 'act-clients',
        group: 'ACTIONS',
        title: 'Clients (CRM)',
        subtitle: 'Gérer le portefeuille clients',
        icon: '👥',
        action: () => this.router.navigateByUrl('/home/crm')
      },
      {
        id: 'act-calendrier',
        group: 'ACTIONS',
        title: 'Calendrier & Audiences',
        subtitle: 'Agenda du cabinet et synchronisation',
        icon: '📅',
        action: () => this.router.navigateByUrl('/home/calendrier')
      },
      {
        id: 'act-billing',
        group: 'ACTIONS',
        title: 'Facturation',
        subtitle: 'Factures, prestations et suivi des encaissements',
        icon: '🧾',
        action: () => this.router.navigateByUrl('/home/billing')
      },
      {
        id: 'act-admin',
        group: 'ACTIONS',
        title: 'Administration & Configuration',
        subtitle: 'Paramètres du cabinet, IA, utilisateurs',
        icon: '⚙️',
        action: () => this.router.navigateByUrl('/home/administration')
      }
    ];

    if (this.mailStatusService.isEnabled) {
      items.splice(4, 0, {
        id: 'act-mail',
        group: 'ACTIONS',
        title: 'Messagerie',
        subtitle: 'Boîte de réception Gmail / Outlook / IMAP',
        icon: '📧',
        action: () => this.router.navigateByUrl('/home/messagerie')
      });
    }

    if (this.aiStatusService.isAiEnabled) {
      items.splice(2, 0, {
        id: 'act-ai',
        group: 'ACTIONS',
        title: 'Avocat Assistant IA',
        subtitle: 'Poser une question juridique ou analyser un dossier',
        badge: '✨ IA',
        icon: '✨',
        action: () => this.router.navigateByUrl('/home/ai-assistant')
      });
    }

    return items;
  }

  filteredItems = computed<CommandItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    const actions = this.buildQuickActions().filter(a =>
      !q || a.title.toLowerCase().includes(q) || (a.subtitle || '').toLowerCase().includes(q)
    );

    const dossierMatches: CommandItem[] = this.dossiers()
      .filter(d => {
        if (!q) return true;
        const ref = (d.referenceInterne || '').toLowerCase();
        const titre = (d.titre || '').toLowerCase();
        const client = (d.client?.nomCommercial || `${d.client?.prenom || ''} ${d.client?.nom || ''}`).toLowerCase();
        return ref.includes(q) || titre.includes(q) || client.includes(q);
      })
      .slice(0, q ? 8 : 5)
      .map(d => ({
        id: `dos-${d.id}`,
        group: 'DOSSIERS' as const,
        title: d.titre || `Dossier #${d.id}`,
        subtitle: d.client?.nomCommercial || `${d.client?.prenom || ''} ${d.client?.nom || ''}`.trim() || undefined,
        badge: d.referenceInterne || `#${d.id}`,
        icon: '⚖️',
        action: () => this.router.navigate(['/home/dossier-detail', d.id])
      }));

    const clientMatches: CommandItem[] = this.clients()
      .filter(c => {
        if (!q) return true;
        const name = (c.nomCommercial || `${c.prenom || ''} ${c.nom || ''}`).toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, q ? 6 : 4)
      .map(c => {
        const displayName = c.nomCommercial || `${c.prenom || ''} ${c.nom || ''}`.trim() || `Client #${c.id}`;
        return {
          id: `cli-${c.id}`,
          group: 'CLIENTS' as const,
          title: displayName,
          subtitle: c.email || c.telephone || undefined,
          badge: c.type || 'Client',
          icon: '👤',
          action: () => this.router.navigate(['/home/client-details'], { queryParams: { id: c.id } })
        };
      });

    return [...actions.slice(0, q ? 6 : 5), ...dossierMatches, ...clientMatches];
  });

  actionItems = computed(() => this.filteredItems().filter(i => i.group === 'ACTIONS'));
  dossierItems = computed(() => this.filteredItems().filter(i => i.group === 'DOSSIERS'));
  clientItems = computed(() => this.filteredItems().filter(i => i.group === 'CLIENTS'));

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
      return;
    }

    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const total = this.filteredItems().length;
      if (total > 0) this.selectedIndex.set((this.selectedIndex() + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const total = this.filteredItems().length;
      if (total > 0) this.selectedIndex.set((this.selectedIndex() - 1 + total) % total);
    } else if (event.key === 'Enter') {
      const items = this.filteredItems();
      const current = items[this.selectedIndex()];
      if (current) {
        event.preventDefault();
        this.execute(current);
      }
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.selectedIndex.set(0);
    this.loadDataIfNeeded();
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 30);
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  onQueryChange(val: string): void {
    this.query.set(val);
    this.selectedIndex.set(0);
  }

  isSelected(id: string): boolean {
    const items = this.filteredItems();
    return items[this.selectedIndex()]?.id === id;
  }

  setSelectedById(id: string): void {
    const idx = this.filteredItems().findIndex(i => i.id === id);
    if (idx >= 0) this.selectedIndex.set(idx);
  }

  execute(item: CommandItem): void {
    this.close();
    item.action();
  }

  private loadDataIfNeeded(): void {
    if (this.dataLoaded) return;
    this.isLoading.set(true);
    let remaining = 2;
    const done = () => {
      remaining--;
      if (remaining <= 0) {
        this.isLoading.set(false);
        this.dataLoaded = true;
      }
    };

    this.dossierService.search({}, 0, 100).subscribe({
      next: res => {
        this.dossiers.set(res?.content || (Array.isArray(res) ? res : []));
        done();
      },
      error: () => done()
    });

    this.clientService.findAll(0, 100).subscribe({
      next: res => {
        this.clients.set(res?.content || (Array.isArray(res) ? res : []));
        done();
      },
      error: () => done()
    });
  }
}

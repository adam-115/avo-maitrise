import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dossier, User, Client, DomaineJuridique, MatterEvent, Task, MatterActivity } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { MatterEventService } from '../../services/matter-event.service';
import { TaskService } from '../../services/task.service';
import { MatterActivityService } from '../../services/matter-activity.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dossier-vue-ensemble',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './dossier-vue-ensemble.html',
  styleUrl: './dossier-vue-ensemble.css'
})
export class DossierVueEnsemble implements OnInit, OnChanges {
  @Input() dossier: Dossier | null = null;
  @Input() users: User[] = [];

  private clientService = inject(ClientService);
  private domaineService = inject(DomaineJuridiqueService);
  private eventService = inject(MatterEventService);
  private taskService = inject(TaskService);
  private activityService = inject(MatterActivityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  client: Client | null = null;
  domaines: DomaineJuridique[] = [];
  upcomingEvents: MatterEvent[] = [];
  pendingTasks: Task[] = [];
  recentActivities: MatterActivity[] = [];
  loadingData = false;

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
}

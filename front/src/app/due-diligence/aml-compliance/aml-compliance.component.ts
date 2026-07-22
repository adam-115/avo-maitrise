import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../services/client-service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { NavigationService } from '../../services/navigation-service';
import { AlertService } from '../../services/alert-service';
import { Client, ClientStatus, ScreeningMatchDTO, ClientTypeEnum } from '../../appTypes';

@Component({
  selector: 'app-aml-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './aml-compliance.component.html'
})
export class AmlComplianceComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly screeningMatchService = inject(ScreeningMatchService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);

  // Enum and constants mapping
  readonly ClientStatus = ClientStatus;
  readonly clientStatuses = Object.values(ClientStatus);

  statusDisplayMap: Record<ClientStatus, string> = {
    [ClientStatus.AML_REQUIRED]: 'AML Requis',
    [ClientStatus.VERIFICATION_AML_REQUIRED]: 'Vérification AML',
    [ClientStatus.AML_VALIDATED]: 'AML Validé',
    [ClientStatus.INDULGENCE_REQUIRED]: 'Demande d\'Indulgence',
    [ClientStatus.VALIDATED]: 'Validé',
    [ClientStatus.BLOCKED]: 'Bloqué'
  };

  // State properties
  clients: Client[] = [];
  matches: ScreeningMatchDTO[] = [];
  clientMatchesMap = new Map<number, ScreeningMatchDTO[]>();
  loading = true;
  triggeringClients = false;
  triggeringUbos = false;

  // Search & Filter state
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedRisk = ''; // 'ELEVEE' | 'MOYEN' | 'FAIBLE' | ''

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];
  totalElements = 0;

  resetPagination(): void {
    this.currentPage = 1;
    this.loadData();
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  get pages(): number[] {
    const list: number[] = [];
    const total = this.totalPages;
    
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, this.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    const total = this.totalPages;
    if (page >= 1 && page <= total) {
      this.currentPage = page;
      this.loadData();
    }
  }

  // Statistics
  totalClients = 0;
  complianceRate = 0;
  alertCount = 0;
  blockedCount = 0;
  pendingReviewCount = 0;
  amlRequiredCount = 0;
  averageRiskScore = 0;

  // Sector breakdown stats
  sectorRisks: { sector: string; count: number; avgRisk: number }[] = [];
  clientTypeCounts: { type: string; count: number }[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    const tableFilters = {
      searchTerm: this.searchTerm,
      type: this.selectedType,
      status: this.selectedStatus,
      risk: this.selectedRisk
    };

    forkJoin({
      clientsRes: this.clientService.findAll(this.currentPage - 1, this.pageSize, undefined, tableFilters),
      matchesRes: this.screeningMatchService.findAll(0, 1000),
      
      // Fast count queries (size=1) to get system-wide totals for stats cards
      validatedRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.VALIDATED }),
      amlValidatedRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.AML_VALIDATED }),
      blockedRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.BLOCKED }),
      verificationRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.VERIFICATION_AML_REQUIRED }),
      indulgenceRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.INDULGENCE_REQUIRED }),
      amlRequiredRes: this.clientService.findAll(0, 1, undefined, { status: ClientStatus.AML_REQUIRED }),
      totalClientsRes: this.clientService.findAll(0, 1)
    }).subscribe({
      next: (res) => {
        this.clients = res.clientsRes.content || [];
        this.totalElements = res.clientsRes.totalElements;

        this.matches = res.matchesRes.content || [];

        // Build client matches mapping
        this.clientMatchesMap.clear();
        this.matches.forEach(match => {
          const clientId = match.clientEntityDTO?.id;
          if (clientId) {
            const list = this.clientMatchesMap.get(clientId) || [];
            list.push(match);
            this.clientMatchesMap.set(clientId, list);
          }
        });

        // System-wide statistics
        const systemTotalClients = res.totalClientsRes.totalElements;
        const validatedCount = res.validatedRes.totalElements + res.amlValidatedRes.totalElements;

        this.totalClients = systemTotalClients;
        this.complianceRate = systemTotalClients > 0 ? Math.round((validatedCount / systemTotalClients) * 100) : 0;
        this.blockedCount = res.blockedRes.totalElements;
        this.pendingReviewCount = res.verificationRes.totalElements + res.indulgenceRes.totalElements;
        this.amlRequiredCount = res.amlRequiredRes.totalElements;

        // Unresolved alerts (PENDING or TRUE_POSITIVE matches)
        this.alertCount = this.matches.filter(m => m.status === 'PENDING' || m.status === 'TRUE_POSITIVE').length;

        // Average Risk Score (system-wide average based on matches)
        let scoreSum = 0;
        const clientMaxScoreMap = new Map<number, number>();
        this.matches.forEach(m => {
          const clientId = m.clientEntityDTO?.id;
          if (clientId) {
            const currentMax = clientMaxScoreMap.get(clientId) || 0;
            if (m.score && m.score > currentMax) {
              clientMaxScoreMap.set(clientId, m.score);
            }
          }
        });
        clientMaxScoreMap.forEach(score => {
          scoreSum += score;
        });
        this.averageRiskScore = systemTotalClients > 0 ? Math.round((scoreSum / systemTotalClients) * 100) : 0;

        // Compute local charts stats based on current page
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading AML data:', err);
        this.alertService.displayMessage('Erreur', 'Impossible de charger les données AML', 'error');
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    // Calculate stats by sector (based on the current page's clients)
    const sectorMap = new Map<string, { totalScore: number; count: number }>();
    this.clients.forEach(c => {
      const sector = c.secteurActivite || 'Non renseigné';
      const maxScore = this.getHighestScore(c);
      const data = sectorMap.get(sector) || { totalScore: 0, count: 0 };
      data.count++;
      if (maxScore > 0) {
        data.totalScore += maxScore;
      }
      sectorMap.set(sector, data);
    });

    this.sectorRisks = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        count: data.count,
        avgRisk: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) : 0
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 5); // top 5 sectors by risk/volume

    // Calculate Client Type counts (based on the current page's clients)
    const typeMap = new Map<string, number>();
    this.clients.forEach(c => {
      const type = c.type || 'Inconnu';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    this.clientTypeCounts = Array.from(typeMap.entries()).map(([type, count]) => ({
      type: this.translateClientType(type),
      count
    }));
  }

  getHighestScore(client: Client): number {
    if (!client.id) return 0;
    const clientMatches = this.clientMatchesMap.get(client.id) || [];
    if (clientMatches.length === 0) return 0;
    return Math.max(...clientMatches.map(m => m.score || 0));
  }

  getHighestScorePercentage(client: Client): string {
    const score = this.getHighestScore(client);
    return score > 0 ? `${(score * 100).toFixed(0)}%` : '0%';
  }

  getClientMatchesCount(client: Client): number {
    if (!client.id) return 0;
    return (this.clientMatchesMap.get(client.id) || []).length;
  }

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim() || client.email || 'Client Sans Nom';
  }

  translateClientType(type: string): string {
    switch (type) {
      case 'PERSONNE': return 'Personne Physique';
      case 'SOCIETE': return 'Société / Entité';
      case 'ASSOCIATION': return 'Association';
      case 'INSTITUTION': return 'Institution';
      default: return type;
    }
  }

  getFilteredClients(): Client[] {
    return this.clients;
  }

  getPaginatedClients(): Client[] {
    return this.clients;
  }

  onStatusChange(client: Client, newStatus: ClientStatus): void {
    if (!client.id) return;

    this.alertService.confirmMessage(
      'Mettre à jour le statut ?',
      `Êtes-vous sûr de vouloir changer le statut de conformité de ce client pour "${this.statusDisplayMap[newStatus]}" ?`,
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        this.clientService.updateClientStatus(client.id!, newStatus).subscribe({
          next: () => {
            this.loadData();
            this.alertService.success('Le statut de conformité a été mis à jour avec succès.');
          },
          error: (err) => {
            console.error('Error updating status:', err);
            this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour le statut', 'error');
          }
        });
      } else {
        // Trigger select refresh in UI by resetting client status list binding
        this.clients = [...this.clients];
      }
    });
  }

  // Navigation handlers
  viewClientDetails(client: Client): void {
    if (client.id) {
      this.navigationService.navigateToClientDetails(String(client.id));
    }
  }

  viewDiligenceResults(client: Client): void {
    if (client.id) {
      this.navigationService.navigateToClientDiligenceResults(String(client.id));
    }
  }

  triggerManualClientScreening(): void {
    this.triggeringClients = true;
    this.alertService.displayMessage('Lancement', 'Filtrage des clients en cours...', 'info');
    this.screeningMatchService.triggerClientScreening().subscribe({
      next: () => {
        this.triggeringClients = false;
        this.alertService.success('Le filtrage manuel des clients a été complété avec succès.');
        this.loadData();
      },
      error: (err) => {
        console.error('Error triggering client screening:', err);
        this.triggeringClients = false;
        this.alertService.displayMessage('Erreur', 'Impossible de lancer le filtrage des clients', 'error');
      }
    });
  }

  triggerManualUboScreening(): void {
    this.triggeringUbos = true;
    this.alertService.displayMessage('Lancement', 'Filtrage des UBOs en cours...', 'info');
    this.screeningMatchService.triggerUboScreening().subscribe({
      next: () => {
        this.triggeringUbos = false;
        this.alertService.success('Le filtrage manuel des UBOs a été complété avec succès.');
        this.loadData();
      },
      error: (err) => {
        console.error('Error triggering UBO screening:', err);
        this.triggeringUbos = false;
        this.alertService.displayMessage('Erreur', 'Impossible de lancer le filtrage des UBOs', 'error');
      }
    });
  }
}

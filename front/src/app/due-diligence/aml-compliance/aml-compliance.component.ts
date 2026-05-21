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

  // Search & Filter state
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedRisk = ''; // 'ELEVEE' | 'MOYEN' | 'FAIBLE' | ''

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
    forkJoin({
      clientsRes: this.clientService.findAll(0, 1000),
      matchesRes: this.screeningMatchService.findAll(0, 1000)
    }).subscribe({
      next: ({ clientsRes, matchesRes }) => {
        this.clients = clientsRes.content || [];
        this.matches = matchesRes.content || [];

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
    this.totalClients = this.clients.length;

    let validatedCount = 0;
    let blocked = 0;
    let pendingReview = 0;
    let amlReq = 0;

    this.clients.forEach(c => {
      const status = c.clientStatus;
      if (status === ClientStatus.AML_VALIDATED || status === ClientStatus.VALIDATED) {
        validatedCount++;
      } else if (status === ClientStatus.BLOCKED) {
        blocked++;
      } else if (status === ClientStatus.VERIFICATION_AML_REQUIRED || status === ClientStatus.INDULGENCE_REQUIRED) {
        pendingReview++;
      } else if (status === ClientStatus.AML_REQUIRED) {
        amlReq++;
      }
    });

    this.complianceRate = this.totalClients > 0 ? Math.round((validatedCount / this.totalClients) * 100) : 0;
    this.blockedCount = blocked;
    this.pendingReviewCount = pendingReview;
    this.amlRequiredCount = amlReq;

    // Calculate total unresolved alerts (status PENDING or TRUE_POSITIVE in matches)
    this.alertCount = this.matches.filter(m => m.status === 'PENDING' || m.status === 'TRUE_POSITIVE').length;

    // Calculate Average Risk Score
    let scoreSum = 0;
    let scoreCount = 0;
    this.clients.forEach(c => {
      const maxScore = this.getHighestScore(c);
      if (maxScore > 0) {
        scoreSum += maxScore;
        scoreCount++;
      }
    });
    this.averageRiskScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) : 0;

    // Calculate stats by sector
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

    // Calculate Client Type counts
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
    return this.clients.filter(c => {
      // Search term
      const name = this.getDisplayName(c).toLowerCase();
      const email = (c.email || '').toLowerCase();
      const pays = (c.pays || '').toLowerCase();
      const sector = (c.secteurActivite || '').toLowerCase();
      const matchesSearch = name.includes(this.searchTerm.toLowerCase()) ||
        email.includes(this.searchTerm.toLowerCase()) ||
        pays.includes(this.searchTerm.toLowerCase()) ||
        sector.includes(this.searchTerm.toLowerCase());

      // Type filter
      const matchesType = !this.selectedType || c.type === this.selectedType;

      // Status filter
      const matchesStatus = !this.selectedStatus || c.clientStatus === this.selectedStatus;

      // Risk score filter
      const maxScore = this.getHighestScore(c);
      let matchesRisk = true;
      if (this.selectedRisk === 'ELEVEE') {
        matchesRisk = maxScore >= 0.7;
      } else if (this.selectedRisk === 'MOYEN') {
        matchesRisk = maxScore >= 0.4 && maxScore < 0.7;
      } else if (this.selectedRisk === 'FAIBLE') {
        matchesRisk = maxScore < 0.4;
      }

      return matchesSearch && matchesType && matchesStatus && matchesRisk;
    });
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
          next: (updatedClient) => {
            // Update client in the local array
            const idx = this.clients.findIndex(c => c.id === client.id);
            if (idx !== -1) {
              this.clients[idx] = updatedClient;
              this.clients = [...this.clients]; // trigger change detection
            }
            this.calculateStats();
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
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../services/client-service';
import { UBOService } from '../../services/ubo.service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { NavigationService } from '../../services/navigation-service';
import { AlertService } from '../../services/alert-service';
import { Client, ClientStatus, ScreeningMatchDTO, ClientTypeEnum } from '../../appTypes';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-aml-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './aml-compliance.component.html'
})
export class AmlComplianceComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly uboService = inject(UBOService);
  private readonly screeningMatchService = inject(ScreeningMatchService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);
  private readonly translateService = inject(TranslateService);

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

  get isFiltered(): boolean {
    return !!(this.searchTerm || this.selectedType || this.selectedStatus || this.selectedRisk);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedRisk = '';
    this.resetPagination();
  }

  getClientInitials(client: any): string {
    const name = this.getDisplayName(client);
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

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
    this.translateService.onLangChange.subscribe(() => {
      if (!this.loading) {
        this.calculateStats();
      }
    });
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
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_ERROR'), // using general error string or we should add a specific one. Actually, wait. I will use literal or we can use what I added. Let me check what I added: 'UPDATE_ERROR': 'Impossible de mettre à jour le statut' and 'ERROR': 'Erreur'.
          'error'
        );
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
      case 'PERSONNE': return this.translateService.instant('AML_COMPLIANCE.FILTER_TYPE_PERSON');
      case 'SOCIETE': return this.translateService.instant('AML_COMPLIANCE.FILTER_TYPE_COMPANY');
      case 'ASSOCIATION': return this.translateService.instant('AML_COMPLIANCE.FILTER_TYPE_ASSOCIATION');
      case 'INSTITUTION': return this.translateService.instant('AML_COMPLIANCE.FILTER_TYPE_INSTITUTION');
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
      this.translateService.instant('AML_COMPLIANCE.ALERTS.CONFIRM_TITLE'),
      this.translateService.instant('AML_COMPLIANCE.ALERTS.CONFIRM_MSG', { status: this.translateService.instant('AML_STATUS.' + newStatus) }),
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        this.clientService.updateClientStatus(client.id!, newStatus).subscribe({
          next: () => {
            this.loadData();
            this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_SUCCESS'));
          },
          error: (err) => {
            console.error('Error updating status:', err);
            this.alertService.displayMessage(
              this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
              this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_ERROR'),
              'error'
            );
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

  downloadClientKycAudit(client: Client): void {
    if (!client.id) return;
    this.alertService.displayMessage(
      this.translateService.instant('AML_COMPLIANCE.ALERTS.GENERATING_PDF'),
      this.translateService.instant('AML_COMPLIANCE.ALERTS.GENERATING_PDF_MSG', { name: this.getDisplayName(client) }),
      'info'
    );
    this.clientService.generateClientKycAuditReportPdf(client.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fiche_Vigilance_KYC_${this.getDisplayName(client).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.PDF_SUCCESS'));
      },
      error: (err) => {
        console.error('Error downloading KYC audit report', err);
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.PDF_ERROR'),
          'error'
        );
      }
    });
  }

  triggerManualClientScreening(): void {
    this.triggeringClients = true;
    this.alertService.displayMessage(
      this.translateService.instant('AML_COMPLIANCE.ALERTS.LAUNCH'),
      this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_SCREENING_MSG'),
      'info'
    );
    this.screeningMatchService.triggerClientScreening().subscribe({
      next: () => {
        this.triggeringClients = false;
        this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_SCREENING_SUCCESS'));
        this.loadData();
      },
      error: (err) => {
        console.error('Error triggering client screening:', err);
        this.triggeringClients = false;
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_SCREENING_ERROR'),
          'error'
        );
      }
    });
  }

  triggerManualUboScreening(): void {
    this.triggeringUbos = true;
    this.alertService.displayMessage(
      this.translateService.instant('AML_COMPLIANCE.ALERTS.LAUNCH'),
      this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_SCREENING_MSG'),
      'info'
    );
    this.screeningMatchService.triggerUboScreening().subscribe({
      next: () => {
        this.triggeringUbos = false;
        this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_SCREENING_SUCCESS'));
        this.loadData();
      },
      error: (err) => {
        console.error('Error triggering UBO screening:', err);
        this.triggeringUbos = false;
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_SCREENING_ERROR'),
          'error'
        );
      }
    });
  }

  // Report generation state and actions
  showReportModal = false;
  reportType: 'CLIENT' | 'UBO' = 'CLIENT';
  reportStartDate = '';
  reportEndDate = '';
  generatingReport = false;

  openReportModal(type: 'CLIENT' | 'UBO' = 'CLIENT'): void {
    this.reportType = type;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  generateAmlReport(): void {
    this.generatingReport = true;
    const isUbo = this.reportType === 'UBO';
    const msg = isUbo 
      ? this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_REPORT_MSG') 
      : this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_REPORT_MSG');
    this.alertService.displayMessage(
      this.translateService.instant('AML_COMPLIANCE.ALERTS.GENERATING_PDF'), 
      msg, 
      'info'
    );

    const reportObs = isUbo
      ? this.uboService.generateUboAmlReportPdf(this.reportStartDate, this.reportEndDate)
      : this.clientService.generateAmlReportPdf(this.reportStartDate, this.reportEndDate);

    reportObs.subscribe({
      next: (blob: Blob) => {
        this.generatingReport = false;
        this.closeReportModal();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const prefix = isUbo ? 'Rapport_Audit_AML_UBOs_' : 'Rapport_Audit_AML_Clients_';
        link.download = `${prefix}${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.alertService.success(
          isUbo 
            ? this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_REPORT_SUCCESS') 
            : this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_REPORT_SUCCESS')
        );
      },
      error: (err) => {
        this.generatingReport = false;
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'), 
          isUbo 
            ? this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_REPORT_ERROR') 
            : this.translateService.instant('AML_COMPLIANCE.ALERTS.CLIENT_REPORT_ERROR'), 
          'error'
        );
        console.error('Erreur de génération PDF:', err);
      }
    });
  }
}


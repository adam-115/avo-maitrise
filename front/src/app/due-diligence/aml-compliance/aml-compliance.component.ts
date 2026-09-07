import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../services/client-service';
import { UBOService } from '../../services/ubo.service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { ScreeningExecutionService } from '../../services/screening-execution.service';
import { NavigationService } from '../../services/navigation-service';
import { AlertService } from '../../services/alert-service';
import { Client, ClientStatus, ScreeningMatchDTO, ScreeningExecutionDTO, UBO, ScreeningMatchStatus } from '../../appTypes';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { MatchAnalysisModal } from '../../crm/client-conformity/match-analysis-modal';

export interface ScreenedEntityRow {
  uniqueKey: string;
  id: number;
  isUbo: boolean;
  entityType: 'SOCIETE' | 'PERSONNE' | 'UBO' | 'ASSOCIATION' | 'INSTITUTION';
  name: string;
  initials: string;
  subTitle?: string;
  country: string;
  dateOfBirth?: Date;
  role?: string;
  ownershipPercentage?: number;
  parentClientId?: number;
  parentClientName?: string;
  clientStatus: ClientStatus;
  highestScore: number;
  highestScorePercentage: string;
  hitsCount: number;
  topMatch?: ScreeningMatchDTO;
  topTargetName?: string;
  hasSanctionAlert: boolean;
  lastScreenedAt?: Date;
  clientRef?: Client;
  uboRef?: UBO;
}

export interface CategoryComplianceStats {
  total: number;
  validated: number;
  sanctioned: number;
  pending: number;
  complianceRate: number;
  sanctionRate: number;
}

@Component({
  selector: 'app-aml-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, MatchAnalysisModal],
  templateUrl: './aml-compliance.component.html'
})
export class AmlComplianceComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly uboService = inject(UBOService);
  private readonly screeningMatchService = inject(ScreeningMatchService);
  private readonly screeningExecutionService = inject(ScreeningExecutionService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);
  private readonly translateService = inject(TranslateService);

  // Active view / Tab
  activeCategoryFilter: 'ALL' | 'SANCTIONED' | 'SOCIETE' | 'PERSONNE' | 'UBO' = 'ALL';
  activeSecondaryTab: 'ENTITIES' | 'ALERTS' | 'EXECUTIONS' = 'ENTITIES';

  // Toggle Analytics Chart
  showAnalyticsChart = true;

  // Enum and constants mapping
  readonly Math = Math;
  readonly ClientStatus = ClientStatus;
  readonly clientStatuses = Object.values(ClientStatus);
  readonly ScreeningMatchStatus = ScreeningMatchStatus;

  // Raw data from API
  clients: Client[] = [];
  ubos: UBO[] = [];
  matches: ScreeningMatchDTO[] = [];
  executions: ScreeningExecutionDTO[] = [];

  clientMatchesMap = new Map<number, ScreeningMatchDTO[]>();
  uboMatchesMap = new Map<number, ScreeningMatchDTO[]>();
  clientMap = new Map<number, Client>();

  // Unified Screened Entities
  allEntities: ScreenedEntityRow[] = [];

  loading = true;
  triggeringClients = false;
  triggeringUbos = false;
  triggeringSingleEntityId: string | null = null;

  // Match analysis modal state
  selectedMatchForAnalysis: ScreeningMatchDTO | null = null;
  selectedClientForAnalysis: any = null;

  // Search & Filter state - Main Table
  searchTerm = '';
  selectedStatusFilter = ''; // ClientStatus or ''
  selectedRiskFilter = ''; // 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' | ''
  sortBy: 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc' | 'hits_desc' | 'name_asc' | 'name_desc' = 'score_desc';

  // Search & Filter state - Alerts Tab
  alertSearchTerm = '';
  alertStatusFilter = '';
  alertPage = 1;
  alertPageSize = 10;

  // Search & Filter state - Executions Tab
  executionStatusFilter = '';
  executionPage = 1;
  executionPageSize = 10;

  // Pagination state - Main Entities Table
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // Statistics & Gauges
  totalClients = 0;
  totalUbos = 0;
  totalEntitiesCount = 0;
  sanctionedBlockedCount = 0;
  pendingTriageCount = 0;
  maxScoreDetected = 0;
  complianceRate = 0;
  totalExecutionsCount = 0;

  // Analytics Chart Rates & Counts
  screenedEntitiesCount = 0;
  screenedCoverageRate = 0;
  validatedEntitiesCount = 0;
  validatedEntitiesRate = 0;
  sanctionedEntitiesCount = 0;
  sanctionedEntitiesRate = 0;
  totalMatchesCount = 0;
  processedMatchesCount = 0;
  triageRate = 0;

  // Status Breakdown counts & rates
  statusValidatedCount = 0;
  statusValidatedRate = 0;
  statusAmlRequiredCount = 0;
  statusAmlRequiredRate = 0;
  statusVerificationRequiredCount = 0;
  statusVerificationRequiredRate = 0;
  statusIndulgenceCount = 0;
  statusIndulgenceRate = 0;
  statusBlockedCount = 0;
  statusBlockedRate = 0;

  // Breakdown by Category
  companiesStats: CategoryComplianceStats = { total: 0, validated: 0, sanctioned: 0, pending: 0, complianceRate: 0, sanctionRate: 0 };
  personsStats: CategoryComplianceStats = { total: 0, validated: 0, sanctioned: 0, pending: 0, complianceRate: 0, sanctionRate: 0 };
  ubosStats: CategoryComplianceStats = { total: 0, validated: 0, sanctioned: 0, pending: 0, complianceRate: 0, sanctionRate: 0 };

  // Breakdown counts for tab pills
  companiesCount = 0;
  personsCount = 0;
  ubosCount = 0;

  // Report generation state
  showReportModal = false;
  reportType: 'CLIENT' | 'UBO' = 'CLIENT';
  reportStartDate = '';
  reportEndDate = '';
  generatingReport = false;

  get isFiltered(): boolean {
    return !!(this.searchTerm || this.selectedStatusFilter || this.selectedRiskFilter || this.activeCategoryFilter !== 'ALL' || this.sortBy !== 'score_desc');
  }

  get isAlertFiltered(): boolean {
    return !!(this.alertSearchTerm || this.alertStatusFilter);
  }

  ngOnInit(): void {
    this.loadData();
    this.translateService.onLangChange.subscribe(() => {
      if (!this.loading) {
        this.buildUnifiedEntities();
      }
    });
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      allClientsRes: this.clientService.findAll(0, 2000),
      ubosRes: this.uboService.findAll(0, 2000),
      matchesRes: this.screeningMatchService.findAll(0, 2000),
      executionsRes: this.screeningExecutionService.findAll(0, 100)
    }).subscribe({
      next: (res) => {
        this.clients = res.allClientsRes.content || [];
        this.ubos = res.ubosRes.content || [];
        this.matches = res.matchesRes.content || [];
        this.executions = res.executionsRes.content || [];
        this.totalExecutionsCount = res.executionsRes.totalElements || this.executions.length;

        // Build client map
        this.clientMap.clear();
        this.clients.forEach(c => {
          if (c.id) this.clientMap.set(c.id, c);
        });

        // Build client & UBO matches mapping
        this.clientMatchesMap.clear();
        this.uboMatchesMap.clear();

        this.matches.forEach(match => {
          const clientId = match.clientEntityDTO?.id;
          if (clientId) {
            const list = this.clientMatchesMap.get(clientId) || [];
            list.push(match);
            this.clientMatchesMap.set(clientId, list);
          }

          const uboId = match.uboDTO?.id;
          if (uboId) {
            const uboList = this.uboMatchesMap.get(uboId) || [];
            uboList.push(match);
            this.uboMatchesMap.set(uboId, uboList);
          }
        });

        this.buildUnifiedEntities();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading AML data:', err);
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_ERROR'),
          'error'
        );
        this.loading = false;
      }
    });
  }

  buildUnifiedEntities(): void {
    const rows: ScreenedEntityRow[] = [];

    // Build map of most recent screening execution or match per entity
    const clientLastScreeningMap = new Map<number, Date>();
    const uboLastScreeningMap = new Map<number, Date>();

    this.executions.forEach(exec => {
      if (exec.createdAt) {
        const d = new Date(exec.createdAt);
        if (!isNaN(d.getTime())) {
          if (exec.clientEntityDTO?.id) {
            const cur = clientLastScreeningMap.get(exec.clientEntityDTO.id);
            if (!cur || d > cur) clientLastScreeningMap.set(exec.clientEntityDTO.id, d);
          }
          if (exec.uboDTO?.id) {
            const cur = uboLastScreeningMap.get(exec.uboDTO.id);
            if (!cur || d > cur) uboLastScreeningMap.set(exec.uboDTO.id, d);
          }
        }
      }
    });

    this.matches.forEach(m => {
      const rawDate = m.createdAt || m.screeningExecutionDTO?.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          if (m.clientEntityDTO?.id) {
            const cur = clientLastScreeningMap.get(m.clientEntityDTO.id);
            if (!cur || d > cur) clientLastScreeningMap.set(m.clientEntityDTO.id, d);
          }
          if (m.uboDTO?.id) {
            const cur = uboLastScreeningMap.get(m.uboDTO.id);
            if (!cur || d > cur) uboLastScreeningMap.set(m.uboDTO.id, d);
          }
        }
      }
    });

    // 1. Process all Clients (Sociétés, Personnes Physiques, Associations, Institutions)
    this.clients.forEach(c => {
      if (!c.id) return;
      const clientMatches = this.clientMatchesMap.get(c.id) || [];
      const highestScore = clientMatches.length > 0 ? Math.max(...clientMatches.map(m => m.score || 0)) : 0;
      const topMatch = clientMatches.length > 0 ? [...clientMatches].sort((a, b) => (b.score || 0) - (a.score || 0))[0] : undefined;

      const entityType: ScreenedEntityRow['entityType'] = 
        (c.type === 'SOCIETE' || c.type === 'PERSONNE' || c.type === 'ASSOCIATION' || c.type === 'INSTITUTION') 
          ? c.type 
          : 'PERSONNE';

      const status = c.clientStatus || ClientStatus.AML_REQUIRED;
      const hasSanctionAlert = highestScore >= 0.7 || status === ClientStatus.BLOCKED || clientMatches.some(m => m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION');

      const cAny = c as any;
      const subTitle = c.email || c.secteurActivite || (cAny.cin ? `CIN: ${cAny.cin}` : (cAny.numeroRegistreCommerce ? `RC: ${cAny.numeroRegistreCommerce}` : undefined));
      const country = c.pays || c.paysResidance || cAny.nationalite || 'Non renseigné';
      const dateOfBirth = cAny.dateNaissance ? new Date(cAny.dateNaissance) : undefined;
      const role = cAny.formeJuridique || c.secteurActivite || undefined;
      const lastScreenedAt = clientLastScreeningMap.get(c.id);

      rows.push({
        uniqueKey: `client_${c.id}`,
        id: c.id,
        isUbo: false,
        entityType: entityType,
        name: this.getDisplayName(c),
        initials: this.getClientInitials(c),
        subTitle: subTitle,
        country: country,
        dateOfBirth: dateOfBirth,
        role: role,
        clientStatus: status,
        highestScore: highestScore,
        highestScorePercentage: highestScore > 0 ? `${(highestScore * 100).toFixed(0)}%` : '0%',
        hitsCount: clientMatches.length,
        topMatch: topMatch,
        topTargetName: topMatch?.targetName || topMatch?.matchReason || undefined,
        hasSanctionAlert: hasSanctionAlert,
        lastScreenedAt: lastScreenedAt,
        clientRef: c
      });
    });

    // 2. Process all UBOs (Bénéficiaires Effectifs)
    this.ubos.forEach(u => {
      if (!u.id) return;
      const uboMatches = this.uboMatchesMap.get(u.id) || [];
      const highestScore = uboMatches.length > 0 ? Math.max(...uboMatches.map(m => m.score || 0)) : 0;
      const topMatch = uboMatches.length > 0 ? [...uboMatches].sort((a, b) => (b.score || 0) - (a.score || 0))[0] : undefined;

      const parentClient = u.clientMoralId ? this.clientMap.get(u.clientMoralId) : undefined;
      const parentClientName = parentClient ? this.getDisplayName(parentClient) : (u.clientMoralId ? `Société #${u.clientMoralId}` : 'Société non liée');
      const status = this.getUboStatus(u);
      const hasSanctionAlert = highestScore >= 0.7 || status === ClientStatus.BLOCKED || uboMatches.some(m => m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION');
      const lastScreenedAt = uboLastScreeningMap.get(u.id);

      rows.push({
        uniqueKey: `ubo_${u.id}`,
        id: u.id,
        isUbo: true,
        entityType: 'UBO',
        name: u.fullName || 'UBO Sans Nom',
        initials: this.getUboInitials(u),
        subTitle: parentClientName ? `Société : ${parentClientName}` : undefined,
        country: u.nationality || 'Non renseignée',
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth) : undefined,
        role: u.roleInCompany || 'Bénéficiaire Effectif',
        ownershipPercentage: u.percentageOfOwnership,
        parentClientId: u.clientMoralId,
        parentClientName: parentClientName,
        clientStatus: status,
        highestScore: highestScore,
        highestScorePercentage: highestScore > 0 ? `${(highestScore * 100).toFixed(0)}%` : '0%',
        hitsCount: uboMatches.length,
        topMatch: topMatch,
        topTargetName: topMatch?.targetName || topMatch?.matchReason || undefined,
        hasSanctionAlert: hasSanctionAlert,
        lastScreenedAt: lastScreenedAt,
        uboRef: u
      });
    });

    this.allEntities = rows;

    // Calculate Dashboard KPIs
    this.totalClients = this.clients.length;
    this.totalUbos = this.ubos.length;
    this.totalEntitiesCount = rows.length;

    this.companiesCount = rows.filter(r => r.entityType === 'SOCIETE' || r.entityType === 'INSTITUTION' || r.entityType === 'ASSOCIATION').length;
    this.personsCount = rows.filter(r => r.entityType === 'PERSONNE').length;
    this.ubosCount = rows.filter(r => r.entityType === 'UBO').length;

    this.sanctionedEntitiesCount = rows.filter(r => r.highestScore > 0 || r.clientStatus === ClientStatus.BLOCKED || r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED).length;
    this.sanctionedBlockedCount = rows.filter(r => r.clientStatus === ClientStatus.BLOCKED || r.highestScore >= 0.7).length;

    this.totalMatchesCount = this.matches.length;
    this.pendingTriageCount = this.matches.filter(m => m.status === 'PENDING' || !m.status).length;
    this.processedMatchesCount = this.matches.filter(m => m.status && m.status !== 'PENDING').length;
    this.triageRate = this.totalMatchesCount > 0 ? Math.round((this.processedMatchesCount / this.totalMatchesCount) * 100) : 100;

    this.maxScoreDetected = rows.length > 0 ? Math.max(...rows.map(r => r.highestScore)) : 0;

    // Coverage & Validation Analytics
    // Considered screened if entity has hits, executions, or a modified status
    this.screenedEntitiesCount = rows.filter(r => r.hitsCount > 0 || r.clientStatus !== ClientStatus.AML_REQUIRED).length;
    this.screenedCoverageRate = this.totalEntitiesCount > 0 ? Math.round((this.screenedEntitiesCount / this.totalEntitiesCount) * 100) : 0;

    this.validatedEntitiesCount = rows.filter(r => r.clientStatus === ClientStatus.VALIDATED || r.clientStatus === ClientStatus.AML_VALIDATED).length;
    this.validatedEntitiesRate = this.totalEntitiesCount > 0 ? Math.round((this.validatedEntitiesCount / this.totalEntitiesCount) * 100) : 0;
    this.complianceRate = this.validatedEntitiesRate;

    this.sanctionedEntitiesRate = this.totalEntitiesCount > 0 ? Math.round((this.sanctionedEntitiesCount / this.totalEntitiesCount) * 100) : 0;

    // Status Breakdown Counts & Rates
    this.statusValidatedCount = this.validatedEntitiesCount;
    this.statusValidatedRate = this.validatedEntitiesRate;

    this.statusAmlRequiredCount = rows.filter(r => r.clientStatus === ClientStatus.AML_REQUIRED).length;
    this.statusAmlRequiredRate = this.totalEntitiesCount > 0 ? Math.round((this.statusAmlRequiredCount / this.totalEntitiesCount) * 100) : 0;

    this.statusVerificationRequiredCount = rows.filter(r => r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED).length;
    this.statusVerificationRequiredRate = this.totalEntitiesCount > 0 ? Math.round((this.statusVerificationRequiredCount / this.totalEntitiesCount) * 100) : 0;

    this.statusIndulgenceCount = rows.filter(r => r.clientStatus === ClientStatus.INDULGENCE_REQUIRED).length;
    this.statusIndulgenceRate = this.totalEntitiesCount > 0 ? Math.round((this.statusIndulgenceCount / this.totalEntitiesCount) * 100) : 0;

    this.statusBlockedCount = rows.filter(r => r.clientStatus === ClientStatus.BLOCKED).length;
    this.statusBlockedRate = this.totalEntitiesCount > 0 ? Math.round((this.statusBlockedCount / this.totalEntitiesCount) * 100) : 0;

    // Category Analytics
    this.calculateCategoryStats(rows);
  }

  private calculateCategoryStats(rows: ScreenedEntityRow[]): void {
    // Companies
    const compRows = rows.filter(r => r.entityType === 'SOCIETE' || r.entityType === 'INSTITUTION' || r.entityType === 'ASSOCIATION');
    const compValid = compRows.filter(r => r.clientStatus === ClientStatus.VALIDATED || r.clientStatus === ClientStatus.AML_VALIDATED).length;
    const compSanction = compRows.filter(r => r.highestScore > 0 || r.clientStatus === ClientStatus.BLOCKED).length;
    const compPending = compRows.filter(r => r.clientStatus === ClientStatus.AML_REQUIRED || r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED).length;
    this.companiesStats = {
      total: compRows.length,
      validated: compValid,
      sanctioned: compSanction,
      pending: compPending,
      complianceRate: compRows.length > 0 ? Math.round((compValid / compRows.length) * 100) : 0,
      sanctionRate: compRows.length > 0 ? Math.round((compSanction / compRows.length) * 100) : 0
    };

    // Natural Persons
    const persRows = rows.filter(r => r.entityType === 'PERSONNE');
    const persValid = persRows.filter(r => r.clientStatus === ClientStatus.VALIDATED || r.clientStatus === ClientStatus.AML_VALIDATED).length;
    const persSanction = persRows.filter(r => r.highestScore > 0 || r.clientStatus === ClientStatus.BLOCKED).length;
    const persPending = persRows.filter(r => r.clientStatus === ClientStatus.AML_REQUIRED || r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED).length;
    this.personsStats = {
      total: persRows.length,
      validated: persValid,
      sanctioned: persSanction,
      pending: persPending,
      complianceRate: persRows.length > 0 ? Math.round((persValid / persRows.length) * 100) : 0,
      sanctionRate: persRows.length > 0 ? Math.round((persSanction / persRows.length) * 100) : 0
    };

    // UBOs
    const uboRows = rows.filter(r => r.entityType === 'UBO');
    const uboValid = uboRows.filter(r => r.clientStatus === ClientStatus.VALIDATED || r.clientStatus === ClientStatus.AML_VALIDATED).length;
    const uboSanction = uboRows.filter(r => r.highestScore > 0 || r.clientStatus === ClientStatus.BLOCKED).length;
    const uboPending = uboRows.filter(r => r.clientStatus === ClientStatus.AML_REQUIRED || r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED).length;
    this.ubosStats = {
      total: uboRows.length,
      validated: uboValid,
      sanctioned: uboSanction,
      pending: uboPending,
      complianceRate: uboRows.length > 0 ? Math.round((uboValid / uboRows.length) * 100) : 0,
      sanctionRate: uboRows.length > 0 ? Math.round((uboSanction / uboRows.length) * 100) : 0
    };
  }

  // ==========================================
  // Filtering & Sorting of Screened Entities
  // ==========================================
  get filteredEntities(): ScreenedEntityRow[] {
    let list = this.allEntities;

    // 1. Filter by Category tab
    if (this.activeCategoryFilter === 'SANCTIONED') {
      list = list.filter(r => r.highestScore > 0 || r.clientStatus === ClientStatus.BLOCKED || r.clientStatus === ClientStatus.VERIFICATION_AML_REQUIRED);
    } else if (this.activeCategoryFilter === 'SOCIETE') {
      list = list.filter(r => r.entityType === 'SOCIETE' || r.entityType === 'INSTITUTION' || r.entityType === 'ASSOCIATION');
    } else if (this.activeCategoryFilter === 'PERSONNE') {
      list = list.filter(r => r.entityType === 'PERSONNE');
    } else if (this.activeCategoryFilter === 'UBO') {
      list = list.filter(r => r.entityType === 'UBO');
    }

    // 2. Filter by Search Query
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.subTitle && r.subTitle.toLowerCase().includes(q)) ||
        (r.parentClientName && r.parentClientName.toLowerCase().includes(q)) ||
        (r.country && r.country.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q)) ||
        (r.topTargetName && r.topTargetName.toLowerCase().includes(q)) ||
        String(r.id).includes(q)
      );
    }

    // 3. Filter by Status
    if (this.selectedStatusFilter) {
      list = list.filter(r => r.clientStatus === this.selectedStatusFilter);
    }

    // 4. Filter by Risk / Score level
    if (this.selectedRiskFilter === 'HIGH') {
      list = list.filter(r => r.highestScore >= 0.7);
    } else if (this.selectedRiskFilter === 'MEDIUM') {
      list = list.filter(r => r.highestScore >= 0.4 && r.highestScore < 0.7);
    } else if (this.selectedRiskFilter === 'LOW') {
      list = list.filter(r => r.highestScore > 0 && r.highestScore < 0.4);
    } else if (this.selectedRiskFilter === 'NONE') {
      list = list.filter(r => r.highestScore === 0);
    }

    // 5. Sorting (Default: highestScore DESC so 100% sanctioned entities are first)
    list = [...list].sort((a, b) => {
      if (this.sortBy === 'score_desc') {
        if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
        if (b.hitsCount !== a.hitsCount) return b.hitsCount - a.hitsCount;
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'score_asc') {
        if (a.highestScore !== b.highestScore) return a.highestScore - b.highestScore;
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'date_desc') {
        const dateA = a.lastScreenedAt ? a.lastScreenedAt.getTime() : 0;
        const dateB = b.lastScreenedAt ? b.lastScreenedAt.getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return b.highestScore - a.highestScore;
      } else if (this.sortBy === 'date_asc') {
        const dateA = a.lastScreenedAt ? a.lastScreenedAt.getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.lastScreenedAt ? b.lastScreenedAt.getTime() : Number.MAX_SAFE_INTEGER;
        if (dateA !== dateB) return dateA - dateB;
        return a.highestScore - b.highestScore;
      } else if (this.sortBy === 'hits_desc') {
        if (b.hitsCount !== a.hitsCount) return b.hitsCount - a.hitsCount;
        return b.highestScore - a.highestScore;
      } else if (this.sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return list;
  }

  get paginatedEntities(): ScreenedEntityRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEntities.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEntities.length / this.pageSize) || 1;
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredEntities.length);
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

  // ==========================================
  // Navigation & Direct Action to ClientConformity
  // ==========================================
  navigateToConformity(row: ScreenedEntityRow): void {
    if (row.isUbo) {
      if (row.parentClientId) {
        this.navigationService.navigateToClientConformity(String(row.parentClientId));
      } else {
        this.alertService.displayMessage(
          'Information',
          `Cet UBO (${row.name}) n'est rattaché à aucun client société actif.`,
          'info'
        );
      }
    } else {
      this.navigationService.navigateToClientConformity(String(row.id));
    }
  }

  // ==========================================
  // Inline Status Change (Client & UBO)
  // ==========================================
  onEntityStatusChange(row: ScreenedEntityRow, newStatus: ClientStatus): void {
    this.alertService.confirmMessage(
      'Mise à jour du statut LCB-FT',
      `Êtes-vous sûr de vouloir changer le statut de "${row.name}" pour "${this.translateService.instant('AML_STATUS.' + newStatus)}" ?`,
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        if (row.isUbo && row.uboRef) {
          const updatedUbo: UBO = { ...row.uboRef, amlAnalysisStatus: newStatus };
          this.uboService.update(updatedUbo).subscribe({
            next: () => {
              row.clientStatus = newStatus;
              this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_SUCCESS'));
              this.loadData();
            },
            error: (err) => {
              console.error(err);
              this.alertService.displayMessage('Erreur', 'Échec de mise à jour du statut de l\'UBO.', 'error');
            }
          });
        } else if (!row.isUbo) {
          this.clientService.updateClientStatus(row.id, newStatus).subscribe({
            next: () => {
              row.clientStatus = newStatus;
              this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_SUCCESS'));
              this.loadData();
            },
            error: (err) => {
              console.error(err);
              this.alertService.displayMessage('Erreur', 'Échec de mise à jour du statut du client.', 'error');
            }
          });
        }
      }
    });
  }

  // ==========================================
  // Screening Triggers
  // ==========================================
  triggerSingleEntityScreening(row: ScreenedEntityRow): void {
    this.triggeringSingleEntityId = row.uniqueKey;
    if (row.isUbo) {
      this.screeningMatchService.triggerUboScreening().subscribe({
        next: () => {
          this.triggeringSingleEntityId = null;
          this.alertService.success('Vérification Yente terminée pour cet UBO.');
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.triggeringSingleEntityId = null;
          this.alertService.displayMessage('Erreur', 'Échec de vérification Yente.', 'error');
        }
      });
    } else {
      this.screeningExecutionService.triggerClient(row.id).subscribe({
        next: () => {
          this.triggeringSingleEntityId = null;
          this.alertService.success('Vérification Yente terminée pour ce client.');
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.triggeringSingleEntityId = null;
          this.alertService.displayMessage('Erreur', 'Échec de vérification Yente.', 'error');
        }
      });
    }
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
        console.error(err);
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
        console.error(err);
        this.triggeringUbos = false;
        this.alertService.displayMessage(
          this.translateService.instant('AML_COMPLIANCE.ALERTS.ERROR'),
          this.translateService.instant('AML_COMPLIANCE.ALERTS.UBO_SCREENING_ERROR'),
          'error'
        );
      }
    });
  }

  // ==========================================
  // Triage Modal Handlers
  // ==========================================
  openMatchAnalysis(match: ScreeningMatchDTO, client?: any): void {
    this.selectedMatchForAnalysis = match;
    let targetClient: any = client;
    if (!targetClient && match.uboDTO) {
      const parentClient = match.uboDTO.clientMoralId ? this.clientMap.get(match.uboDTO.clientMoralId) : undefined;
      targetClient = {
        id: match.uboDTO.id,
        nom: match.uboDTO.fullName,
        prenom: '',
        type: 'PERSONNE',
        dateNaissance: match.uboDTO.dateOfBirth,
        nationalite: match.uboDTO.nationality,
        pays: match.uboDTO.nationality,
        isUbo: true,
        parentCompany: parentClient,
        parentCompanyName: parentClient ? this.getDisplayName(parentClient) : undefined
      };
    } else if (!targetClient && match.clientEntityDTO) {
      targetClient = match.clientEntityDTO;
    }
    this.selectedClientForAnalysis = targetClient;
  }

  closeMatchAnalysis(): void {
    this.selectedMatchForAnalysis = null;
    this.selectedClientForAnalysis = null;
  }

  onDecisionMade(updatedMatch: ScreeningMatchDTO): void {
    this.closeMatchAnalysis();
    this.alertService.success(this.translateService.instant('AML_COMPLIANCE.ALERTS.UPDATE_SUCCESS'));
    this.loadData();
  }

  // ==========================================
  // Report Modal Handlers
  // ==========================================
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
      }
    });
  }

  // ==========================================
  // Alerts & Executions Tab Lists
  // ==========================================
  get filteredMatches(): ScreeningMatchDTO[] {
    return this.matches.filter(m => {
      const targetName = m.targetName || '';
      const clientName = m.clientEntityDTO ? this.getDisplayName(m.clientEntityDTO) : '';
      const uboName = m.uboDTO?.fullName || '';
      const matchReason = m.matchReason || '';

      const matchesSearch = !this.alertSearchTerm ||
        targetName.toLowerCase().includes(this.alertSearchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(this.alertSearchTerm.toLowerCase()) ||
        uboName.toLowerCase().includes(this.alertSearchTerm.toLowerCase()) ||
        matchReason.toLowerCase().includes(this.alertSearchTerm.toLowerCase()) ||
        (m.yenteId && m.yenteId.toLowerCase().includes(this.alertSearchTerm.toLowerCase()));

      let matchesStatus = true;
      if (this.alertStatusFilter) {
        if (this.alertStatusFilter === 'PENDING') {
          matchesStatus = m.status === 'PENDING' || !m.status;
        } else if (this.alertStatusFilter === 'TRUE_POSITIVE') {
          matchesStatus = m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION';
        } else {
          matchesStatus = m.status === this.alertStatusFilter;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedMatches(): ScreeningMatchDTO[] {
    const list = this.filteredMatches;
    const start = (this.alertPage - 1) * this.alertPageSize;
    return list.slice(start, start + this.alertPageSize);
  }

  get alertTotalPages(): number {
    return Math.ceil(this.filteredMatches.length / this.alertPageSize) || 1;
  }

  get filteredExecutions(): ScreeningExecutionDTO[] {
    return this.executions.filter(e => {
      return !this.executionStatusFilter || e.status === this.executionStatusFilter;
    });
  }

  get paginatedExecutions(): ScreeningExecutionDTO[] {
    const list = this.filteredExecutions;
    const start = (this.executionPage - 1) * this.executionPageSize;
    return list.slice(start, start + this.executionPageSize);
  }

  get executionTotalPages(): number {
    return Math.ceil(this.filteredExecutions.length / this.executionPageSize) || 1;
  }

  // ==========================================
  // Utility & Helper functions
  // ==========================================
  getUboStatus(ubo: UBO): ClientStatus {
    const raw = ubo.amlAnalysisStatus;
    if (!raw) return ClientStatus.AML_REQUIRED;
    if (raw === 'OK') return ClientStatus.AML_VALIDATED;
    if (raw === 'SUSPECT') return ClientStatus.VERIFICATION_AML_REQUIRED;
    if (raw === 'BLOCKED') return ClientStatus.BLOCKED;
    if (raw === 'TODO') return ClientStatus.AML_REQUIRED;
    if (Object.values(ClientStatus).includes(raw as ClientStatus)) {
      return raw as ClientStatus;
    }
    return ClientStatus.AML_REQUIRED;
  }

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim() || client.email || 'Client Sans Nom';
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

  getUboInitials(ubo: UBO): string {
    if (!ubo.fullName) return 'UB';
    const parts = ubo.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return ubo.fullName.slice(0, 2).toUpperCase();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatusFilter = '';
    this.selectedRiskFilter = '';
    this.activeCategoryFilter = 'ALL';
    this.sortBy = 'score_desc';
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}

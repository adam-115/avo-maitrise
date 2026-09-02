import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientDiligenceStatus } from '../../appTypes';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-diligence-status-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './diligence-status-list.component.html',
  styleUrl: './diligence-status-list.component.css'
})
export class DiligenceStatusListComponent implements OnInit {
  private statusService = inject(ClientDiligenceStatusService);
  private alertService = inject(AlertService);
  navigationService = inject(NavigationService);

  allStatuses: ClientDiligenceStatus[] = [];
  filteredStatuses: ClientDiligenceStatus[] = [];
  paginatedStatuses: ClientDiligenceStatus[] = [];
  loading = true;

  // Search & Filters
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  pages: number[] = [];

  statusDisplayMap: Record<string, string> = {
    'PENDING': 'En attente',
    'SUBMITTED': 'Soumis',
    'VALIDATED': 'Validé'
  };

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.loading = true;
    this.statusService.findAll(0, 10000, 'lastUpdateDate,desc').subscribe({
      next: (response) => {
        this.allStatuses = response.content || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading diligence statuses', err);
        this.alertService.displayMessage('Erreur', 'Impossible de charger le suivi des diligences', 'error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredStatuses = this.allStatuses.filter(s => {
      // Search text filter
      const clientName = (s.clientName || '').toLowerCase();
      const formTitle = (s.formTitle || '').toLowerCase();
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = clientName.includes(searchLower) || formTitle.includes(searchLower);

      // Status filter
      const matchesStatus = !this.selectedStatus || s.status === this.selectedStatus;

      // Client type filter
      const matchesType = !this.selectedType || s.clientType === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const totalItems = this.filteredStatuses.length;
    this.totalPages = Math.ceil(totalItems / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginate();
  }

  paginate(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStatuses = this.filteredStatuses.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.paginate();
  }

  get startIndex(): number {
    if (this.filteredStatuses.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredStatuses.length);
  }

  translateClientType(type: string): string {
    switch (type) {
      case 'PERSONNE': return 'Personne Physique';
      case 'SOCIETE': return 'Société / Entité';
      case 'ASSOCIATION': return 'Association';
      case 'INSTITUTION': return 'Institution';
      default: return type || 'Inconnu';
    }
  }

  onAction(status: ClientDiligenceStatus): void {
    if (status.status === 'PENDING') {
      this.navigationService.navigateToDiligenceFormViewer(status.formConfigId, String(status.clientId));
    } else if (status.status === 'SUBMITTED' || status.status === 'VALIDATED') {
      if (status.resultId) {
        this.navigationService.navigateToDiligenceFormResultViewer(status.resultId);
      } else {
        this.alertService.displayMessage('Info', 'Aucune réponse enregistrée trouvée', 'info');
      }
    }
  }
}

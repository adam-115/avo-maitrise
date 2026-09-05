import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationService } from '../../services/navigation-service';
import { FormConfig } from '../../appTypes';
import { FormConfigService } from '../../services/form-config-service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'app-diligence-form-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, RouterLink],
    templateUrl: './diligence-form-list.component.html',
    styleUrl: './diligence-form-list.component.css',
})
export class DiligenceFormListComponent implements OnInit {
    formConfigService = inject(FormConfigService);
    navigationService = inject(NavigationService);
    alertService = inject(AlertService);

    formConfigs: FormConfig[] = [];
    isLoading = false;
    
    // Pagination and Sorting
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;
    totalPages = 0;
    sortField = 'name';
    sortDirection = 'asc';

    // Search & Filter
    searchTerm = '';
    selectedTypeFilter = 'ALL';
    private searchSubject = new Subject<string>();

    // Delete Modal State
    deleteModalOpen = false;
    itemToDelete: FormConfig | null = null;
    isDeleting = false;

    ngOnInit(): void {
        this.loadFormsConfig();

        // Setup debounced search
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe(() => {
            this.currentPage = 0; // Reset to first page on search
            this.loadFormsConfig();
        });
    }

    loadFormsConfig(): void {
        this.isLoading = true;
        const sortParam = `${this.sortField},${this.sortDirection}`;
        const filters: any = { name: this.searchTerm };
        
        if (this.selectedTypeFilter !== 'ALL') {
            filters.type = this.selectedTypeFilter;
        }
        
        this.formConfigService.findAll(this.currentPage, this.pageSize, sortParam, filters).subscribe({
            next: (data: PaginatedResponse<FormConfig>) => {
                this.isLoading = false;
                if (data && data.content) {
                    this.formConfigs = data.content;
                    this.totalElements = data.totalElements;
                    this.totalPages = data.totalPages;
                } else {
                    this.formConfigs = [];
                    this.totalElements = 0;
                    this.totalPages = 0;
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.alertService.displayMessage('Erreur', 'Impossible de charger les formulaires', 'error');
                console.error('Error loading forms', err);
            }
        });
    }

    onSearch(): void {
        this.searchSubject.next(this.searchTerm);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.currentPage = 0;
        this.loadFormsConfig();
    }

    onTypeFilterChange(type: string): void {
        this.selectedTypeFilter = type;
        this.currentPage = 0;
        this.loadFormsConfig();
    }

    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.pageSize = Number(select.value);
        this.currentPage = 0;
        this.loadFormsConfig();
    }

    onPageChange(page: number): void {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadFormsConfig();
    }

    onSort(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.loadFormsConfig();
    }

    getPages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    protected readonly Math = Math;

    get startIndex(): number {
        if (this.totalElements === 0) return 0;
        return this.currentPage * this.pageSize + 1;
    }

    get endIndex(): number {
        return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
    }

    get uniqueTypesCount(): number {
        const types = new Set(this.formConfigs.map(c => c.type).filter(Boolean));
        return types.size || (this.totalElements > 0 ? 1 : 0);
    }

    navigateBack(): void {
        this.navigationService.navigateToClientDiligenceStatusList();
    }

    navigateToTracking(): void {
        this.navigationService.navigateToClientDiligenceStatusList();
    }

    onAdd(): void {
        this.navigationService.navigateToDiligenceFormBuilder();
    }

    onEdit(id: string): void {
        this.navigationService.navigateToDiligenceFormBuilderEdit(id);
    }

    onView(id: string): void {
        this.navigationService.navigateToDiligenceFormViewer(id);
    }

    openDeleteModal(config: FormConfig): void {
        this.itemToDelete = config;
        this.deleteModalOpen = true;
    }

    closeDeleteModal(): void {
        this.deleteModalOpen = false;
        this.itemToDelete = null;
        this.isDeleting = false;
    }

    confirmDelete(): void {
        if (!this.itemToDelete || !this.itemToDelete.id) return;
        this.isDeleting = true;

        this.formConfigService.delete(this.itemToDelete.id).subscribe({
            next: () => {
                this.isDeleting = false;
                this.closeDeleteModal();
                this.alertService.displayMessage('Succès', 'Modèle de formulaire supprimé', 'success');
                this.loadFormsConfig();
            },
            error: (err) => {
                this.isDeleting = false;
                this.alertService.displayMessage('Erreur', 'Impossible de supprimer le formulaire', 'error');
                console.error('Error deleting form', err);
            }
        });
    }

    onDelete(id: string): void {
        const config = this.formConfigs.find(c => c.id === id);
        if (config) {
            this.openDeleteModal(config);
        } else {
            this.openDeleteModal({ id, name: 'Formulaire #' + id } as FormConfig);
        }
    }
}

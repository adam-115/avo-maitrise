import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationService } from '../../services/navigation-service';
import { FormConfig } from '../../appTypes';
import { FormConfigService } from '../../services/form-config-service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'app-diligence-form-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './diligence-form-list.component.html',
    styleUrl: './diligence-form-list.component.css',
})
export class DiligenceFormListComponent implements OnInit {
    formConfigService = inject(FormConfigService);
    navigationService = inject(NavigationService);
    alertService = inject(AlertService);

    formConfigs: FormConfig[] = [];
    
    // Pagination and Sorting
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;
    totalPages = 0;
    sortField = 'name';
    sortDirection = 'asc';

    // Search
    searchTerm = '';
    private searchSubject = new Subject<string>();

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
        const sortParam = `${this.sortField},${this.sortDirection}`;
        const filters = { name: this.searchTerm }; // QueryDSL will match name
        
        this.formConfigService.findAll(this.currentPage, this.pageSize, sortParam, filters).subscribe({
            next: (data: PaginatedResponse<FormConfig>) => {
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
                this.alertService.displayMessage('Erreur', 'Impossible de charger les formulaires', 'error');
                console.error('Error loading forms', err);
            }
        });
    }

    onSearch(): void {
        this.searchSubject.next(this.searchTerm);
    }

    onPageChange(page: number): void {
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
        return this.currentPage * this.pageSize + 1;
    }

    get endIndex(): number {
        return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
    }

    onAdd(): void {
        this.navigationService.navigateToDiligenceFormBuilder();
    }

    onEdit(id: string): void {
        // Assuming the builder can handle edit mode via query param or route param. 
        // The current builder seems to generate a new ID on init, so it might need adjustment for edit mode.
        // For now, I'll navigate to the builder.
        // Checking NavigationService for proper edit method.
        // NavigationService has navigateToDiligenceFormBuilder() which creates new.
        // I need to check if there is an edit route or if I should pass an ID.
        // NavigationService.DILIGENCE_FORM_BUILDER is "diligence-form-builder/:id".
        // So I should pass the ID.
        this.navigationService.navigateToDiligenceFormBuilderEdit(id);
    }

    onDelete(id: string): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
            this.formConfigService.delete(id).subscribe({
                next: () => {
                    this.alertService.displayMessage('Succès', 'Formulaire supprimé', 'success');
                    this.loadFormsConfig();
                },
                error: (err) => {
                    this.alertService.displayMessage('Erreur', 'Impossible de supprimer le formulaire', 'error');
                    console.error('Error deleting form', err);
                }
            });
        }
    }

    onView(id: string): void {
        // Navigate to viewer (preview)
        this.navigationService.navigateToDiligenceFormViewer(id);
    }
}

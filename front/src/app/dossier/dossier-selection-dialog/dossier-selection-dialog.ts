import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dossier } from '../../appTypes';

@Component({
    selector: 'app-dossier-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dossier-selection-dialog.html',
    styleUrl: './dossier-selection-dialog.css'
})
export class DossierSelectionDialog implements OnInit {
    @Input() dossiers: Dossier[] = [];
    @Input() initialSelection: string | number | null = null;
    @Output() confirmSelection = new EventEmitter<string | number>();
    @Output() closeDialog = new EventEmitter<void>();

    filteredDossiers: Dossier[] = [];
    selectedDossierId: string | number | null = null;
    searchTerm: string = '';

    // Pagination
    currentPage = 1;
    pageSize = 5;

    ngOnInit(): void {
        this.filteredDossiers = [...this.dossiers];
        this.selectedDossierId = this.initialSelection;
        this.currentPage = 1;
    }

    filterDossiers(): void {
        this.currentPage = 1;
        if (!this.searchTerm) {
            this.filteredDossiers = [...this.dossiers];
        } else {
            const lowerTerm = this.searchTerm.toLowerCase();
            this.filteredDossiers = this.dossiers.filter(dossier => {
                return (dossier.titre && dossier.titre.toLowerCase().includes(lowerTerm)) ||
                    (dossier.referenceInterne && dossier.referenceInterne.toLowerCase().includes(lowerTerm)) ||
                    (dossier.description && dossier.description.toLowerCase().includes(lowerTerm));
            });
        }
    }

    get totalPages(): number {
        return Math.ceil(this.filteredDossiers.length / this.pageSize);
    }

    get paginatedDossiers(): Dossier[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredDossiers.slice(startIndex, startIndex + this.pageSize);
    }

    get currentEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.filteredDossiers.length);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    selectDossier(dossierId: string | number): void {
        this.selectedDossierId = dossierId;
    }

    isSelected(dossierId: string | number): boolean {
        return String(this.selectedDossierId) === String(dossierId);
    }

    onConfirm(): void {
        if (this.selectedDossierId) {
            this.confirmSelection.emit(this.selectedDossierId);
        }
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}

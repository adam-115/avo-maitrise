import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomaineJuridique } from '../../appTypes';

@Component({
    selector: 'app-domaine-juridique-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './domaine-juridique-selection-dialog.html',
    styleUrl: './domaine-juridique-selection-dialog.css'
})
export class DomaineJuridiqueSelectionDialog implements OnInit {
    @Input() domaines: DomaineJuridique[] = [];
    @Input() initialSelection: string | null = null;
    @Output() confirmSelection = new EventEmitter<string>();
    @Output() closeDialog = new EventEmitter<void>();

    filteredDomaines: DomaineJuridique[] = [];
    selectedDomaineId: string | null = null;
    searchTerm: string = '';

    ngOnInit(): void {
        this.filteredDomaines = [...this.domaines];
        this.selectedDomaineId = this.initialSelection;
    }

    filterDomaines(): void {
        if (!this.searchTerm) {
            this.filteredDomaines = [...this.domaines];
        } else {
            const lowerTerm = this.searchTerm.toLowerCase();
            this.filteredDomaines = this.domaines.filter(domaine =>
                (domaine.label && domaine.label.toLowerCase().includes(lowerTerm)) ||
                (domaine.code && domaine.code.toLowerCase().includes(lowerTerm))
            );
        }
    }

    selectDomaine(domaineId: string): void {
        this.selectedDomaineId = domaineId;
    }

    isSelected(domaineId: string): boolean {
        return this.selectedDomaineId === domaineId;
    }

    onConfirm(): void {
        if (this.selectedDomaineId) {
            this.confirmSelection.emit(this.selectedDomaineId);
        }
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}

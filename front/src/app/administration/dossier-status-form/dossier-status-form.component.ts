import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatterStatusService } from '../../services/statut-dossier.service';
import { StatutDossier } from '../../appTypes';

@Component({
    selector: 'app-dossier-status-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './dossier-status-form.component.html',
    styleUrls: ['./dossier-status-form.component.css']
})
export class DossierStatusFormComponent implements OnInit {
    statuses: StatutDossier[] = [];
    statusForm: FormGroup;
    isEditing = false;
    selectedStatusId: string | null = null;
    errorMessage: string = '';

    constructor(
        private statutDossierService: MatterStatusService,
        private fb: FormBuilder
    ) {
        this.statusForm = this.fb.group({
            label: ['', Validators.required],
            code: ['', Validators.required],
            color: ['#000000'],
            order: [0, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadStatuses();
    }

    loadStatuses(): void {
        this.statutDossierService.getAll().subscribe({
            next: (data) => {
                this.statuses = data.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading statuses', err);
                this.errorMessage = 'Erreur lors du chargement des statuts.';
            }
        });
    }

    onSubmit(): void {
        if (this.statusForm.valid) {
            const formValue = this.statusForm.value;
            const statusData: StatutDossier = {
                ...formValue,
                id: this.selectedStatusId ? this.selectedStatusId : this.generateId()
            };

            if (this.isEditing && this.selectedStatusId) {
                this.statutDossierService.update(this.selectedStatusId, statusData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => console.error('Error updating status', err)
                });
            } else {
                // Remove ID for creation if backend generates it, but for json-server we usually generate or let it handle.
                // If we want to simulate ID generation:
                this.statutDossierService.create(statusData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => console.error('Error creating status', err)
                });
            }
        }
    }

    editStatus(status: StatutDossier): void {
        this.isEditing = true;
        this.selectedStatusId = status.id;
        this.statusForm.patchValue({
            label: status.label,
            code: status.code,
            color: status.color,
            order: status.order,
            active: status.active
        });
    }

    deleteStatus(id: string): void {
        const status = this.statuses.find(s => s.id === id);
        if (status && confirm('Êtes-vous sûr de vouloir désactiver ce statut ?')) {
            const updatedStatus: StatutDossier = { ...status, active: false };
            this.statutDossierService.update(id, updatedStatus).subscribe({
                next: () => this.loadStatuses(),
                error: (err) => console.error('Error updating status', err)
            });
        }
    }

    cancelEdit(): void {
        this.resetForm();
    }

    resetForm(): void {
        this.isEditing = false;
        this.selectedStatusId = null;
        this.statusForm.reset({
            active: true,
            color: '#000000',
            order: 0
        });
    }

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

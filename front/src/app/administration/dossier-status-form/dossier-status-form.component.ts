import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { StatutDossier } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';

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

    private statutDossierService = inject(StatutDossierService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
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
            next: (data: PaginatedResponse<StatutDossier>) => {
                this.statuses = data.content.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading statuses', err);
                this.errorMessage = 'Erreur lors du chargement des statuts.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.statusForm.valid) {
            const formValue = this.statusForm.value;
            const statusData: any = {
                ...formValue
            };

            if (this.isEditing && this.selectedStatusId) {
                statusData.id = this.selectedStatusId;
                this.statutDossierService.update(statusData).subscribe({
                    next: () => {
                        this.alertService.success('Statut mis à jour avec succès');
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => {
                        console.error('Error updating status', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
                    }
                });
            } else {
                this.statutDossierService.create(statusData).subscribe({
                    next: () => {
                        this.alertService.success('Statut créé avec succès');
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => {
                        console.error('Error creating status', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
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

    async deleteStatus(id: string): Promise<void> {
        const status = this.statuses.find(s => s.id === id);
        if (status) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver ce statut ?', 'warning');
            if (isConfirmed) {
                const updatedStatus: StatutDossier = { ...status, active: false };
                this.statutDossierService.update(updatedStatus).subscribe({
                    next: () => {
                        this.alertService.success('Statut désactivé avec succès');
                        this.loadStatuses();
                    },
                    error: (err) => {
                        console.error('Error updating status', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la désactivation.', 'error');
                    }
                });
            }
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
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceDossierServieStatusService } from '../../services/invoice-dossier-servie-status.service';
import { InvoiceDossierServieStatus } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';

@Component({
    selector: 'app-invoice-dossier-servie-status-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './invoice-dossier-servie-status-form.component.html',
    styleUrls: ['./invoice-dossier-servie-status-form.component.css']
})
export class InvoiceDossierServieStatusFormComponent implements OnInit {
    statuses: InvoiceDossierServieStatus[] = [];
    statusForm: FormGroup;
    isEditing = false;
    selectedStatusId: number | null = null;
    errorMessage: string = '';

    private statusService = inject(InvoiceDossierServieStatusService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.statusForm = this.fb.group({
            code: ['', Validators.required],
            name: ['', Validators.required],
            description: [''],
            color: ['#000000'],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadStatuses();
    }

    loadStatuses(): void {
        this.statusService.getAll().subscribe({
            next: (data: PaginatedResponse<InvoiceDossierServieStatus>) => {
                this.statuses = data.content;
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
                this.statusService.update(statusData).subscribe({
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
                this.statusService.create(statusData).subscribe({
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

    editStatus(status: InvoiceDossierServieStatus): void {
        this.isEditing = true;
        this.selectedStatusId = status.id || null;
        this.statusForm.patchValue({
            code: status.code,
            name: status.name,
            description: status.description,
            color: status.color,
            active: status.active
        });
    }

    async deleteStatus(id: number): Promise<void> {
        const status = this.statuses.find(s => s.id === id);
        if (status) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver ce statut ?', 'warning');
            if (isConfirmed) {
                const updatedStatus: InvoiceDossierServieStatus = { ...status, active: false };
                this.statusService.update(updatedStatus).subscribe({
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
            color: '#000000'
        });
    }
}

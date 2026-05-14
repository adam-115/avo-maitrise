import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskStatusService } from '../../services/task-status.service';
import { TaskStatus } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';

@Component({
    selector: 'app-task-status-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './task-status-form.component.html',
    styleUrls: ['./task-status-form.component.css']
})
export class TaskStatusFormComponent implements OnInit {
    statuses: TaskStatus[] = [];
    statusForm: FormGroup;
    isEditing = false;
    selectedStatusId: string | null = null;
    errorMessage: string = '';

    private taskStatusService = inject(TaskStatusService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.statusForm = this.fb.group({
            libelle: ['', Validators.required],
            code: ['', Validators.required],
            ordre_affichage: [0, Validators.required],
            isClosingStatus: [false]
        });
    }

    ngOnInit(): void {
        this.loadStatuses();
    }

    loadStatuses(): void {
        this.taskStatusService.getAll().subscribe({
            next: (data: PaginatedResponse<TaskStatus>) => {
                this.statuses = data.content.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
            },
            error: (err) => {
                console.error('Error loading task statuses', err);
                this.errorMessage = 'Erreur lors du chargement des statuts de tâches.';
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
                this.taskStatusService.update(statusData).subscribe({
                    next: () => {
                        this.alertService.success('Statut mis à jour avec succès');
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => {
                        console.error('Error updating task status', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
                    }
                });
            } else {
                this.taskStatusService.create(statusData).subscribe({
                    next: () => {
                        this.alertService.success('Statut créé avec succès');
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => {
                        console.error('Error creating task status', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
                });
            }
        }
    }

    editStatus(status: TaskStatus): void {
        this.isEditing = true;
        this.selectedStatusId = status.id.toString();
        this.statusForm.patchValue({
            libelle: status.libelle,
            code: status.code,
            ordre_affichage: status.ordre_affichage,
            isClosingStatus: status.isClosingStatus ?? false
        });
    }

    async deleteStatus(id: string | number): Promise<void> {
        const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir supprimer ce statut ?', 'warning');
        if (isConfirmed) {
            this.taskStatusService.delete(id.toString()).subscribe({
                next: () => {
                    this.alertService.success('Statut supprimé avec succès');
                    this.loadStatuses();
                },
                error: (err) => {
                    console.error('Error deleting task status', err);
                    this.alertService.displayMessage('Erreur', 'Erreur lors de la suppression.', 'error');
                }
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
            ordre_affichage: 0,
            isClosingStatus: false
        });
    }
}

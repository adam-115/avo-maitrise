import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DossierPriorite } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';

@Component({
    selector: 'app-dossier-priorite',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './dossier-priorite.component.html',
    styleUrls: ['./dossier-priorite.component.css']
})
export class DossierPrioriteComponent implements OnInit {
    priorities: DossierPriorite[] = [];
    priorityForm: FormGroup;
    isEditing = false;
    selectedPriorityId: string | null = null;
    errorMessage: string = '';

    private dossierPrioriteService = inject(DossierPrioriteService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.priorityForm = this.fb.group({
            label: ['', Validators.required],
            code: ['', Validators.required],
            color: ['#000000'],
            order: [0, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadPriorities();
    }

    loadPriorities(): void {
        this.dossierPrioriteService.getAll().subscribe({
            next: (data: PaginatedResponse<DossierPriorite>) => {
                this.priorities = data.content.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading priorities', err);
                this.errorMessage = 'Erreur lors du chargement des priorités.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.priorityForm.valid) {
            const formValue = this.priorityForm.value;
            const priorityData: any = {
                ...formValue
            };

            if (this.isEditing && this.selectedPriorityId) {
                priorityData.id = this.selectedPriorityId;
                this.dossierPrioriteService.update(priorityData).subscribe({
                    next: () => {
                        this.alertService.success('Priorité mise à jour avec succès');
                        this.resetForm();
                        this.loadPriorities();
                    },
                    error: (err) => {
                        console.error('Error updating priority', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
                    }
                });
            } else {
                this.dossierPrioriteService.create(priorityData).subscribe({
                    next: () => {
                        this.alertService.success('Priorité créée avec succès');
                        this.resetForm();
                        this.loadPriorities();
                    },
                    error: (err) => {
                        console.error('Error creating priority', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
                });
            }
        }
    }

    editPriority(priority: DossierPriorite): void {
        this.isEditing = true;
        this.selectedPriorityId = priority.id;
        this.priorityForm.patchValue({
            label: priority.label,
            code: priority.code,
            color: priority.color,
            order: priority.order,
            active: priority.active
        });
    }

    async deletePriority(id: string): Promise<void> {
        const priority = this.priorities.find(p => p.id === id);
        if (priority) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver cette priorité ?', 'warning');
            if (isConfirmed) {
                const updatedPriority: DossierPriorite = { ...priority, active: false };
                this.dossierPrioriteService.update(updatedPriority).subscribe({
                    next: () => {
                        this.alertService.success('Priorité désactivée avec succès');
                        this.loadPriorities();
                    },
                    error: (err) => {
                        console.error('Error updating priority', err);
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
        this.selectedPriorityId = null;
        this.priorityForm.reset({
            active: true,
            color: '#000000',
            order: 0
        });
    }
}

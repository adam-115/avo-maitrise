import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DossierPriorite } from '../../appTypes';

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

    constructor(
        private dossierPrioriteService: DossierPrioriteService,
        private fb: FormBuilder
    ) {
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
            next: (data) => {
                this.priorities = data.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading priorities', err);
                this.errorMessage = 'Erreur lors du chargement des priorités.';
            }
        });
    }

    onSubmit(): void {
        if (this.priorityForm.valid) {
            const formValue = this.priorityForm.value;
            const priorityData: DossierPriorite = {
                ...formValue,
                id: this.selectedPriorityId ? this.selectedPriorityId : this.generateId()
            };

            if (this.isEditing && this.selectedPriorityId) {
                this.dossierPrioriteService.update(this.selectedPriorityId, priorityData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadPriorities();
                    },
                    error: (err) => console.error('Error updating priority', err)
                });
            } else {
                this.dossierPrioriteService.create(priorityData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadPriorities();
                    },
                    error: (err) => console.error('Error creating priority', err)
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

    deletePriority(id: string): void {
        const priority = this.priorities.find(p => p.id === id);
        if (priority && confirm('Êtes-vous sûr de vouloir désactiver cette priorité ?')) {
            const updatedPriority: DossierPriorite = { ...priority, active: false };
            this.dossierPrioriteService.update(id, updatedPriority).subscribe({
                next: () => this.loadPriorities(),
                error: (err) => console.error('Error updating priority', err)
            });
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

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

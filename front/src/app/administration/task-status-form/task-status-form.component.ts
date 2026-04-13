import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskStatusService } from '../../services/task-status.service';
import { TaskStatus } from '../../appTypes';

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

    constructor(
        private taskStatusService: TaskStatusService,
        private fb: FormBuilder
    ) {
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
            next: (data) => {
                this.statuses = data.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
            },
            error: (err) => {
                console.error('Error loading task statuses', err);
                this.errorMessage = 'Erreur lors du chargement des statuts de tâches.';
            }
        });
    }

    onSubmit(): void {
        if (this.statusForm.valid) {
            const formValue = this.statusForm.value;
            const statusData: TaskStatus = {
                ...formValue,
                id: this.selectedStatusId ? this.selectedStatusId : this.generateId()
            };

            if (this.isEditing && this.selectedStatusId) {
                this.taskStatusService.update(this.selectedStatusId, statusData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => console.error('Error updating task status', err)
                });
            } else {
                this.taskStatusService.create(statusData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadStatuses();
                    },
                    error: (err) => console.error('Error creating task status', err)
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

    deleteStatus(id: string | number): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce statut ?')) {
            this.taskStatusService.delete(id.toString()).subscribe({
                next: () => this.loadStatuses(),
                error: (err) => console.error('Error deleting task status', err)
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

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

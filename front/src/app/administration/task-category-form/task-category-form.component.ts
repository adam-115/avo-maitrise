import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskCategory } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
    selector: 'app-task-category-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe, TranslateDirective],
    templateUrl: './task-category-form.component.html',
    styleUrls: ['./task-category-form.component.css']
})
export class TaskCategoryFormComponent implements OnInit {
    categories: TaskCategory[] = [];
    categoryForm: FormGroup;
    isEditing = false;
    selectedCategoryId: string | null = null;
    errorMessage: string = '';

    private taskCategoryService = inject(TaskCategoryService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.categoryForm = this.fb.group({
            libelle: ['', Validators.required],
            code: ['', Validators.required],
            couleur: ['#000000', Validators.required],
            icone: [''],
            actif: [true]
        });
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.taskCategoryService.getAll().subscribe({
            next: (data: PaginatedResponse<TaskCategory>) => {
                this.categories = data.content;
            },
            error: (err) => {
                console.error('Error loading categories', err);
                this.errorMessage = 'Erreur lors du chargement des catégories.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.categoryForm.valid) {
            const formValue = this.categoryForm.value;
            const categoryData: any = {
                ...formValue
            };

            if (this.isEditing && this.selectedCategoryId) {
                categoryData.id = this.selectedCategoryId;
                this.taskCategoryService.update(categoryData).subscribe({
                    next: () => {
                        this.alertService.success('Catégorie mise à jour avec succès');
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => {
                        console.error('Error updating category', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
                    }
                });
            } else {
                this.taskCategoryService.create(categoryData).subscribe({
                    next: () => {
                        this.alertService.success('Catégorie créée avec succès');
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => {
                        console.error('Error creating category', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
                });
            }
        }
    }

    editCategory(category: TaskCategory): void {
        this.isEditing = true;
        this.selectedCategoryId = category.id.toString();
        this.categoryForm.patchValue({
            libelle: category.libelle,
            code: category.code,
            couleur: category.couleur,
            icone: category.icone,
            actif: category.actif
        });
    }

    async deleteCategory(id: string | number): Promise<void> {
        const category = this.categories.find(c => c.id.toString() === id.toString());
        if (category) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver cette catégorie ?', 'warning');
            if (isConfirmed) {
                const updatedCategory: TaskCategory = { ...category, actif: false };
                this.taskCategoryService.update(updatedCategory).subscribe({
                    next: () => {
                        this.alertService.success('Catégorie désactivée avec succès');
                        this.loadCategories();
                    },
                    error: (err) => {
                        console.error('Error updating category', err);
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
        this.selectedCategoryId = null;
        this.categoryForm.reset({
            actif: true,
            couleur: '#000000'
        });
    }
}

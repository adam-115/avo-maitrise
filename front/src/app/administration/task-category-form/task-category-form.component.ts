import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskCategory } from '../../appTypes';

@Component({
    selector: 'app-task-category-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './task-category-form.component.html',
    styleUrls: ['./task-category-form.component.css']
})
export class TaskCategoryFormComponent implements OnInit {
    categories: TaskCategory[] = [];
    categoryForm: FormGroup;
    isEditing = false;
    selectedCategoryId: string | null = null;
    errorMessage: string = '';

    constructor(
        private taskCategoryService: TaskCategoryService,
        private fb: FormBuilder
    ) {
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
            next: (data) => {
                this.categories = data; // Assuming order is not defined in model, or sort by id/libelle
            },
            error: (err) => {
                console.error('Error loading tasks categories', err);
                this.errorMessage = 'Erreur lors du chargement des catégories de tâches.';
            }
        });
    }

    onSubmit(): void {
        if (this.categoryForm.valid) {
            const formValue = this.categoryForm.value;
            const categoryData: TaskCategory = {
                ...formValue,
                id: this.selectedCategoryId ? this.selectedCategoryId : this.generateId()
            };

            if (this.isEditing && this.selectedCategoryId) {
                this.taskCategoryService.update(this.selectedCategoryId, categoryData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => console.error('Error updating task category', err)
                });
            } else {
                this.taskCategoryService.create(categoryData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => console.error('Error creating task category', err)
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
            actif: category.actif ?? true
        });
    }

    deleteCategory(id: string | number): void {
        const category = this.categories.find(c => c.id === id);
        if (category && confirm('Êtes-vous sûr de vouloir désactiver cette catégorie de tâche ?')) {
            const updatedCategory: TaskCategory = { ...category, actif: false };
            this.taskCategoryService.update(id.toString(), updatedCategory).subscribe({
                next: () => this.loadCategories(),
                error: (err) => console.error('Error updating task category', err)
            });
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

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

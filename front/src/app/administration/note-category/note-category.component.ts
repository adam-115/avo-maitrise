import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoteCategoryService } from '../../services/note-category.service';
import { NoteCategory } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
    selector: 'app-note-category',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe, TranslateDirective],
    templateUrl: './note-category.component.html',
    styleUrls: ['./note-category.component.css']
})
export class NoteCategoryComponent implements OnInit {
    categories: NoteCategory[] = [];
    categoryForm: FormGroup;
    isEditing = false;
    selectedCategoryId: string | number | null = null;
    errorMessage: string = '';

    private noteCategoryService = inject(NoteCategoryService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.categoryForm = this.fb.group({
            label: ['', Validators.required],
            code: ['', Validators.required],
            color: ['#000000'],
            order: [0, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.noteCategoryService.getAll().subscribe({
            next: (data: PaginatedResponse<NoteCategory>) => {
                this.categories = data.content.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading categories', err);
                this.errorMessage = 'Erreur lors du chargement des catégories de notes.';
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
                this.noteCategoryService.update(categoryData).subscribe({
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
                this.noteCategoryService.create(categoryData).subscribe({
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

    editCategory(category: NoteCategory): void {
        this.isEditing = true;
        this.selectedCategoryId = category.id;
        this.categoryForm.patchValue({
            label: category.label,
            code: category.code,
            color: category.color,
            order: category.order,
            active: category.active
        });
    }

    async deleteCategory(id: string | number): Promise<void> {
        const category = this.categories.find(c => String(c.id) === String(id));
        if (category) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver cette catégorie ?', 'warning');
            if (isConfirmed) {
                const updatedCategory: NoteCategory = { ...category, active: false };
                this.noteCategoryService.update(updatedCategory).subscribe({
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
            active: true,
            color: '#000000',
            order: 0
        });
    }
}

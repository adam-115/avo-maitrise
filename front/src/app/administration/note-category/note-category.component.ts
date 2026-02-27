import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoteCategoryService } from '../../services/note-category.service';
import { NoteCategory } from '../../appTypes';

@Component({
    selector: 'app-note-category',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './note-category.component.html',
    styleUrls: ['./note-category.component.css']
})
export class NoteCategoryComponent implements OnInit {
    categories: NoteCategory[] = [];
    categoryForm: FormGroup;
    isEditing = false;
    selectedCategoryId: string | number | null = null;
    errorMessage: string = '';

    constructor(
        private noteCategoryService: NoteCategoryService,
        private fb: FormBuilder
    ) {
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
            next: (data) => {
                this.categories = data.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading categories', err);
                this.errorMessage = 'Erreur lors du chargement des catégories de notes.';
            }
        });
    }

    onSubmit(): void {
        if (this.categoryForm.valid) {
            const formValue = this.categoryForm.value;
            const categoryData: NoteCategory = {
                ...formValue,
                id: this.selectedCategoryId ? this.selectedCategoryId : this.generateId()
            };

            if (this.isEditing && this.selectedCategoryId) {
                this.noteCategoryService.update(this.selectedCategoryId.toString(), categoryData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => console.error('Error updating category', err)
                });
            } else {
                this.noteCategoryService.create(categoryData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadCategories();
                    },
                    error: (err) => console.error('Error creating category', err)
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

    deleteCategory(id: string | number): void {
        const category = this.categories.find(c => String(c.id) === String(id));
        if (category && confirm('Êtes-vous sûr de vouloir désactiver cette catégorie ?')) {
            const updatedCategory: NoteCategory = { ...category, active: false };
            this.noteCategoryService.update(id.toString(), updatedCategory).subscribe({
                next: () => this.loadCategories(),
                error: (err) => console.error('Error updating category', err)
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
            active: true,
            color: '#000000',
            order: 0
        });
    }

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

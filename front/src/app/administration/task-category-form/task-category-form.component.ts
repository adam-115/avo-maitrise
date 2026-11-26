import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskCategory } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-task-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './task-category-form.component.html',
  styleUrls: ['./task-category-form.component.css']
})
export class TaskCategoryFormComponent implements OnInit {
  categories: TaskCategory[] = [];
  categoryForm: FormGroup;
  isEditing = false;
  selectedCategoryId: string | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', 
    '#14b8a6', '#f59e0b', '#f97316', '#ef4444', 
    '#ec4899', '#8b5cf6', '#64748b', '#0f172a'
  ];

  private taskCategoryService = inject(TaskCategoryService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.categoryForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      couleur: ['#6366f1', Validators.required],
      icone: [''],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadCategories(): void {
    this.taskCategoryService.getAll().subscribe({
      next: (data: PaginatedResponse<TaskCategory>) => {
        this.categories = data.content || (Array.isArray(data) ? data : []);
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.errorMessage = 'Erreur lors du chargement des catégories.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.categories?.length || 0;
  }

  get activeCount(): number {
    return (this.categories || []).filter(c => c.actif).length;
  }

  get inactiveCount(): number {
    return (this.categories || []).filter(c => !c.actif).length;
  }

  get filteredCategories(): TaskCategory[] {
    return (this.categories || []).filter(cat => {
      const matchSearch = this.searchTerm
        ? ((cat.libelle || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (cat.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!cat.actif
          : !cat.actif;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.categoryForm.patchValue({ couleur: color });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const categoryData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim()
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
    } else {
      this.categoryForm.markAllAsTouched();
    }
  }

  editCategory(category: TaskCategory): void {
    this.isEditing = true;
    this.selectedCategoryId = category.id.toString();
    this.categoryForm.patchValue({
      libelle: category.libelle,
      code: category.code,
      couleur: category.couleur || '#6366f1',
      icone: category.icone || '',
      actif: category.actif
    });

    // Scroll to form smoothly
    const formElement = document.getElementById('categoryFormCard');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleCategoryStatus(category: TaskCategory): Promise<void> {
    if (!category.id) return;
    const newStatus = !category.actif;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver cette catégorie de tâches ?'
      : 'Êtes-vous sûr de vouloir désactiver cette catégorie de tâches ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedCategory: TaskCategory = { ...category, actif: newStatus };
      this.taskCategoryService.update(updatedCategory).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Catégorie réactivée avec succès' : 'Catégorie désactivée avec succès');
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error toggling category status', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut de la catégorie.', 'error');
        }
      });
    }
  }

  async deleteCategory(id: string | number): Promise<void> {
    const category = this.categories.find(c => c.id.toString() === id.toString());
    if (category) {
      await this.toggleCategoryStatus(category);
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
      couleur: '#6366f1',
      icone: ''
    });
  }
}

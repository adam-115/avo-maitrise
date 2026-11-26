import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoteCategoryService } from '../../services/note-category.service';
import { NoteCategory } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-note-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './note-category.component.html',
  styleUrls: ['./note-category.component.css']
})
export class NoteCategoryComponent implements OnInit {
  categories: NoteCategory[] = [];
  categoryForm: FormGroup;
  isEditing = false;
  selectedCategoryId: string | number | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#f43f5e', '#e11d48', '#ec4899', '#d946ef', 
    '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', 
    '#14b8a6', '#10b981', '#f59e0b', '#f97316'
  ];

  private noteCategoryService = inject(NoteCategoryService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.categoryForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#f43f5e', Validators.required],
      order: [1, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadCategories(): void {
    this.noteCategoryService.getAll().subscribe({
      next: (data: PaginatedResponse<NoteCategory>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.categories = raw.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.errorMessage = 'Erreur lors du chargement des catégories de notes.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.categories?.length || 0;
  }

  get activeCount(): number {
    return (this.categories || []).filter(c => c.active).length;
  }

  get inactiveCount(): number {
    return (this.categories || []).filter(c => !c.active).length;
  }

  get filteredCategories(): NoteCategory[] {
    return (this.categories || []).filter(c => {
      const matchSearch = this.searchTerm
        ? ((c.label || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (c.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!c.active
          : !c.active;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.categoryForm.patchValue({ color: color });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const categoryData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        order: Number(formValue.order) || 0
      };

      if (this.isEditing && this.selectedCategoryId) {
        categoryData.id = this.selectedCategoryId;
        this.noteCategoryService.update(categoryData).subscribe({
          next: () => {
            this.alertService.success('Catégorie de note mise à jour avec succès');
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
            this.alertService.success('Catégorie de note créée avec succès');
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

  editCategory(category: NoteCategory): void {
    this.isEditing = true;
    this.selectedCategoryId = category.id;
    this.categoryForm.patchValue({
      label: category.label,
      code: category.code,
      color: category.color || '#f43f5e',
      order: category.order || 0,
      active: category.active
    });

    const formCard = document.getElementById('categoryFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleCategoryActive(category: NoteCategory): Promise<void> {
    if (!category.id) return;
    const newStatus = !category.active;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver cette catégorie de note ?'
      : 'Êtes-vous sûr de vouloir désactiver cette catégorie de note ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedCategory: NoteCategory = { ...category, active: newStatus };
      this.noteCategoryService.update(updatedCategory).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Catégorie réactivée avec succès' : 'Catégorie désactivée avec succès');
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error toggling category active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deleteCategory(id: string | number): Promise<void> {
    const category = this.categories.find(c => String(c.id) === String(id));
    if (category) {
      await this.toggleCategoryActive(category);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedCategoryId = null;
    const nextOrder = (this.categories.length > 0 ? Math.max(...this.categories.map(c => c.order || 0)) + 1 : 1);
    this.categoryForm.reset({
      active: true,
      color: '#f43f5e',
      order: nextOrder
    });
  }
}

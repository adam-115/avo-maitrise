import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DossierPriorite } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dossier-priorite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './dossier-priorite.component.html',
  styleUrls: ['./dossier-priorite.component.css']
})
export class DossierPrioriteComponent implements OnInit {
  priorities: DossierPriorite[] = [];
  priorityForm: FormGroup;
  isEditing = false;
  selectedPriorityId: string | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#f43f5e', '#f97316', '#f59e0b', '#10b981', 
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
    '#d946ef', '#64748b', '#0f172a'
  ];

  private dossierPrioriteService = inject(DossierPrioriteService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.priorityForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#f59e0b', Validators.required],
      order: [1, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadPriorities();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadPriorities(): void {
    this.dossierPrioriteService.getAll().subscribe({
      next: (data: PaginatedResponse<DossierPriorite>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.priorities = raw.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (err) => {
        console.error('Error loading priorities', err);
        this.errorMessage = 'Erreur lors du chargement des priorités.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.priorities?.length || 0;
  }

  get activeCount(): number {
    return (this.priorities || []).filter(p => p.active).length;
  }

  get inactiveCount(): number {
    return (this.priorities || []).filter(p => !p.active).length;
  }

  get filteredPriorities(): DossierPriorite[] {
    return (this.priorities || []).filter(p => {
      const matchSearch = this.searchTerm
        ? ((p.label || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (p.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!p.active
          : !p.active;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.priorityForm.patchValue({ color: color });
  }

  onSubmit(): void {
    if (this.priorityForm.valid) {
      const formValue = this.priorityForm.value;
      const priorityData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        order: Number(formValue.order) || 0
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
    } else {
      this.priorityForm.markAllAsTouched();
    }
  }

  editPriority(priority: DossierPriorite): void {
    this.isEditing = true;
    this.selectedPriorityId = priority.id;
    this.priorityForm.patchValue({
      label: priority.label,
      code: priority.code,
      color: priority.color || '#f59e0b',
      order: priority.order || 0,
      active: priority.active
    });

    const formCard = document.getElementById('priorityFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async togglePriorityActive(priority: DossierPriorite): Promise<void> {
    if (!priority.id) return;
    const newStatus = !priority.active;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver cette priorité de dossier ?'
      : 'Êtes-vous sûr de vouloir désactiver cette priorité de dossier ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedPriority: DossierPriorite = { ...priority, active: newStatus };
      this.dossierPrioriteService.update(updatedPriority).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Priorité réactivée avec succès' : 'Priorité désactivée avec succès');
          this.loadPriorities();
        },
        error: (err) => {
          console.error('Error toggling priority active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deletePriority(id: string): Promise<void> {
    const priority = this.priorities.find(p => p.id === id);
    if (priority) {
      await this.togglePriorityActive(priority);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedPriorityId = null;
    const nextOrder = (this.priorities.length > 0 ? Math.max(...this.priorities.map(p => p.order || 0)) + 1 : 1);
    this.priorityForm.reset({
      active: true,
      color: '#f59e0b',
      order: nextOrder
    });
  }
}

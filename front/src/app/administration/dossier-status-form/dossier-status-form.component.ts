import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { StatutDossier } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dossier-status-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './dossier-status-form.component.html',
  styleUrls: ['./dossier-status-form.component.css']
})
export class DossierStatusFormComponent implements OnInit {
  statuses: StatutDossier[] = [];
  statusForm: FormGroup;
  isEditing = false;
  selectedStatusId: string | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#10b981', 
    '#14b8a6', '#f59e0b', '#f97316', '#ef4444', 
    '#ec4899', '#64748b', '#0f172a'
  ];

  private statutDossierService = inject(StatutDossierService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.statusForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#3b82f6', Validators.required],
      order: [1, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadStatuses();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadStatuses(): void {
    this.statutDossierService.getAll().subscribe({
      next: (data: PaginatedResponse<StatutDossier>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.statuses = raw.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (err) => {
        console.error('Error loading statuses', err);
        this.errorMessage = 'Erreur lors du chargement des statuts.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.statuses?.length || 0;
  }

  get activeCount(): number {
    return (this.statuses || []).filter(s => s.active).length;
  }

  get inactiveCount(): number {
    return (this.statuses || []).filter(s => !s.active).length;
  }

  get filteredStatuses(): StatutDossier[] {
    return (this.statuses || []).filter(s => {
      const matchSearch = this.searchTerm
        ? ((s.label || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (s.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!s.active
          : !s.active;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.statusForm.patchValue({ color: color });
  }

  onSubmit(): void {
    if (this.statusForm.valid) {
      const formValue = this.statusForm.value;
      const statusData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        order: Number(formValue.order) || 0
      };

      if (this.isEditing && this.selectedStatusId) {
        statusData.id = this.selectedStatusId;
        this.statutDossierService.update(statusData).subscribe({
          next: () => {
            this.alertService.success('Statut mis à jour avec succès');
            this.resetForm();
            this.loadStatuses();
          },
          error: (err) => {
            console.error('Error updating status', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
          }
        });
      } else {
        this.statutDossierService.create(statusData).subscribe({
          next: () => {
            this.alertService.success('Statut créé avec succès');
            this.resetForm();
            this.loadStatuses();
          },
          error: (err) => {
            console.error('Error creating status', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
          }
        });
      }
    } else {
      this.statusForm.markAllAsTouched();
    }
  }

  editStatus(status: StatutDossier): void {
    this.isEditing = true;
    this.selectedStatusId = status.id;
    this.statusForm.patchValue({
      label: status.label,
      code: status.code,
      color: status.color || '#3b82f6',
      order: status.order || 0,
      active: status.active
    });

    const formCard = document.getElementById('statusFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleStatusActive(status: StatutDossier): Promise<void> {
    if (!status.id) return;
    const newStatus = !status.active;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver ce statut de dossier ?'
      : 'Êtes-vous sûr de vouloir désactiver ce statut de dossier ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedStatus: StatutDossier = { ...status, active: newStatus };
      this.statutDossierService.update(updatedStatus).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Statut réactivé avec succès' : 'Statut désactivé avec succès');
          this.loadStatuses();
        },
        error: (err) => {
          console.error('Error toggling status active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deleteStatus(id: string): Promise<void> {
    const status = this.statuses.find(s => s.id === id);
    if (status) {
      await this.toggleStatusActive(status);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedStatusId = null;
    const nextOrder = (this.statuses.length > 0 ? Math.max(...this.statuses.map(s => s.order || 0)) + 1 : 1);
    this.statusForm.reset({
      active: true,
      color: '#3b82f6',
      order: nextOrder
    });
  }
}

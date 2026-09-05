import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { DomaineJuridique } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-domaine-juridique-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './domaine-juridique-form.component.html',
  styleUrls: ['./domaine-juridique-form.component.css']
})
export class DomaineJuridiqueFormComponent implements OnInit {
  domaines: DomaineJuridique[] = [];
  domaineForm: FormGroup;
  isEditing = false;
  selectedDomaineId: string | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', 
    '#10b981', '#14b8a6', '#f59e0b', '#f97316', 
    '#ef4444', '#ec4899', '#64748b', '#0f172a'
  ];

  private domaineJuridiqueService = inject(DomaineJuridiqueService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.domaineForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#8b5cf6', Validators.required],
      order: [1, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadDomaines();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadDomaines(): void {
    this.domaineJuridiqueService.getAll().subscribe({
      next: (data: PaginatedResponse<DomaineJuridique>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.domaines = raw.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (err) => {
        console.error('Error loading domaines', err);
        this.errorMessage = 'Erreur lors du chargement des domaines juridiques.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.domaines?.length || 0;
  }

  get activeCount(): number {
    return (this.domaines || []).filter(d => d.active).length;
  }

  get inactiveCount(): number {
    return (this.domaines || []).filter(d => !d.active).length;
  }

  get filteredDomaines(): DomaineJuridique[] {
    return (this.domaines || []).filter(d => {
      const matchSearch = this.searchTerm
        ? ((d.label || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (d.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!d.active
          : !d.active;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.domaineForm.patchValue({ color: color });
  }

  onSubmit(): void {
    if (this.domaineForm.valid) {
      const formValue = this.domaineForm.value;
      const domaineData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        order: Number(formValue.order) || 0
      };

      if (this.isEditing && this.selectedDomaineId) {
        domaineData.id = this.selectedDomaineId;
        this.domaineJuridiqueService.update(domaineData).subscribe({
          next: () => {
            this.alertService.success('Domaine juridique mis à jour avec succès');
            this.resetForm();
            this.loadDomaines();
          },
          error: (err) => {
            console.error('Error updating domaine', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
          }
        });
      } else {
        this.domaineJuridiqueService.create(domaineData).subscribe({
          next: () => {
            this.alertService.success('Domaine juridique créé avec succès');
            this.resetForm();
            this.loadDomaines();
          },
          error: (err) => {
            console.error('Error creating domaine', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
          }
        });
      }
    } else {
      this.domaineForm.markAllAsTouched();
    }
  }

  editDomaine(domaine: DomaineJuridique): void {
    this.isEditing = true;
    this.selectedDomaineId = domaine.id;
    this.domaineForm.patchValue({
      label: domaine.label,
      code: domaine.code,
      color: domaine.color || '#8b5cf6',
      order: domaine.order || 0,
      active: domaine.active
    });

    const formCard = document.getElementById('domaineFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleDomaineActive(domaine: DomaineJuridique): Promise<void> {
    if (!domaine.id) return;
    const newStatus = !domaine.active;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver ce domaine juridique ?'
      : 'Êtes-vous sûr de vouloir désactiver ce domaine juridique ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedDomaine: DomaineJuridique = { ...domaine, active: newStatus };
      this.domaineJuridiqueService.update(updatedDomaine).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Domaine juridique réactivé avec succès' : 'Domaine juridique désactivé avec succès');
          this.loadDomaines();
        },
        error: (err) => {
          console.error('Error toggling domaine active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deleteDomaine(id: string): Promise<void> {
    const domaine = this.domaines.find(d => d.id === id);
    if (domaine) {
      await this.toggleDomaineActive(domaine);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedDomaineId = null;
    const nextOrder = (this.domaines.length > 0 ? Math.max(...this.domaines.map(d => d.order || 0)) + 1 : 1);
    this.domaineForm.reset({
      active: true,
      color: '#8b5cf6',
      order: nextOrder
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceTypeOfServiceService } from '../../services/invoice-type-of-service.service';
import { InvoiceTypeOfService } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-invoice-type-of-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './invoice-type-of-service-form.component.html',
  styleUrls: ['./invoice-type-of-service-form.component.css']
})
export class InvoiceTypeOfServiceFormComponent implements OnInit {
  typesOfService: InvoiceTypeOfService[] = [];
  serviceForm: FormGroup;
  isEditing = false;
  selectedServiceId: number | null = null;
  errorMessage: string = '';

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  private invoiceService = inject(InvoiceTypeOfServiceService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.serviceForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(2)]],
      price5min: [0, [Validators.required, Validators.min(0)]],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadServices(): void {
    this.invoiceService.getAll().subscribe({
      next: (data: PaginatedResponse<InvoiceTypeOfService>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.typesOfService = raw.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      },
      error: (err) => {
        console.error('Error loading types of service', err);
        this.errorMessage = 'Erreur lors du chargement des types de services.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.typesOfService?.length || 0;
  }

  get activeCount(): number {
    return (this.typesOfService || []).filter(s => s.actif).length;
  }

  get inactiveCount(): number {
    return (this.typesOfService || []).filter(s => !s.actif).length;
  }

  get averagePrice5min(): number {
    const list = this.typesOfService || [];
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + (curr.price5min || 0), 0);
    return Math.round((sum / list.length) * 100) / 100;
  }

  get filteredServices(): InvoiceTypeOfService[] {
    return (this.typesOfService || []).filter(s => {
      const matchSearch = this.searchTerm
        ? ((s.description || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (s.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!s.actif
          : !s.actif;
      return matchSearch && matchStatus;
    });
  }

  getHourlyEquivalent(price5min: number | undefined): number {
    return (price5min || 0) * 12;
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      const formValue = this.serviceForm.value;
      const serviceData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        price5min: Number(formValue.price5min) || 0,
        actif: Boolean(formValue.actif)
      };

      if (this.isEditing && this.selectedServiceId) {
        serviceData.id = this.selectedServiceId;
        this.invoiceService.update(serviceData).subscribe({
          next: () => {
            this.alertService.success('Type de prestation mis à jour avec succès');
            this.resetForm();
            this.loadServices();
          },
          error: (err) => {
            console.error('Error updating service', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
          }
        });
      } else {
        this.invoiceService.create(serviceData).subscribe({
          next: () => {
            this.alertService.success('Type de prestation créé avec succès');
            this.resetForm();
            this.loadServices();
          },
          error: (err) => {
            console.error('Error creating service', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
          }
        });
      }
    } else {
      this.serviceForm.markAllAsTouched();
    }
  }

  editService(service: InvoiceTypeOfService): void {
    this.isEditing = true;
    this.selectedServiceId = service.id || null;
    this.serviceForm.patchValue({
      code: service.code,
      description: service.description,
      price5min: service.price5min,
      actif: service.actif
    });

    const formCard = document.getElementById('serviceFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleServiceActive(service: InvoiceTypeOfService): Promise<void> {
    if (!service.id) return;
    const newStatus = !service.actif;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver ce type de prestation ?'
      : 'Êtes-vous sûr de vouloir désactiver ce type de prestation ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedService: InvoiceTypeOfService = { ...service, actif: newStatus };
      this.invoiceService.update(updatedService).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Prestation réactivée avec succès' : 'Prestation désactivée avec succès');
          this.loadServices();
        },
        error: (err) => {
          console.error('Error updating service', err);
          this.alertService.displayMessage('Erreur', 'Erreur lors de la désactivation.', 'error');
        }
      });
    }
  }

  async deleteService(id: number): Promise<void> {
    const service = this.typesOfService.find(s => s.id === id);
    if (service) {
      await this.toggleServiceActive(service);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedServiceId = null;
    this.serviceForm.reset({
      code: '',
      description: '',
      actif: true,
      price5min: 0
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceTypeOfServiceService } from '../../services/invoice-type-of-service.service';
import { InvoiceTypeOfService } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
    selector: 'app-invoice-type-of-service-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe, TranslateDirective],
    templateUrl: './invoice-type-of-service-form.component.html',
    styleUrls: ['./invoice-type-of-service-form.component.css']
})
export class InvoiceTypeOfServiceFormComponent implements OnInit {
    typesOfService: InvoiceTypeOfService[] = [];
    serviceForm: FormGroup;
    isEditing = false;
    selectedServiceId: number | null = null;
    errorMessage: string = '';

    private invoiceService = inject(InvoiceTypeOfServiceService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.serviceForm = this.fb.group({
            code: ['', Validators.required],
            description: ['', Validators.required],
            price5min: [0, [Validators.required, Validators.min(0)]],
            actif: [true]
        });
    }

    ngOnInit(): void {
        this.loadServices();
    }

    loadServices(): void {
        this.invoiceService.getAll().subscribe({
            next: (data: PaginatedResponse<InvoiceTypeOfService>) => {
                this.typesOfService = data.content; // optionally sort
            },
            error: (err) => {
                console.error('Error loading types of service', err);
                this.errorMessage = 'Erreur lors du chargement des types de services.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.serviceForm.valid) {
            const formValue = this.serviceForm.value;
            const serviceData: any = {
                ...formValue
            };

            if (this.isEditing && this.selectedServiceId) {
                serviceData.id = this.selectedServiceId;
                this.invoiceService.update(serviceData).subscribe({
                    next: () => {
                        this.alertService.success('Type de service mis à jour avec succès');
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
                        this.alertService.success('Type de service créé avec succès');
                        this.resetForm();
                        this.loadServices();
                    },
                    error: (err) => {
                        console.error('Error creating service', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
                });
            }
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
    }

    async deleteService(id: number): Promise<void> {
        const service = this.typesOfService.find(s => s.id === id);
        if (service) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver ce type de service ?', 'warning');
            if (isConfirmed) {
                const updatedService: InvoiceTypeOfService = { ...service, actif: false };
                this.invoiceService.update(updatedService).subscribe({
                    next: () => {
                        this.alertService.success('Type de service désactivé avec succès');
                        this.loadServices();
                    },
                    error: (err) => {
                        console.error('Error updating service', err);
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
        this.selectedServiceId = null;
        this.serviceForm.reset({
            actif: true,
            price5min: 0
        });
    }
}

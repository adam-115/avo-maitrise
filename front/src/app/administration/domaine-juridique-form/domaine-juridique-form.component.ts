import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { DomaineJuridique } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
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

    private domaineJuridiqueService = inject(DomaineJuridiqueService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
        this.domaineForm = this.fb.group({
            label: ['', Validators.required],
            code: ['', Validators.required],
            color: ['#000000'],
            order: [0, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadDomaines();
    }

    loadDomaines(): void {
        this.domaineJuridiqueService.getAll().subscribe({
            next: (data: PaginatedResponse<DomaineJuridique>) => {
                this.domaines = data.content.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading domaines', err);
                this.errorMessage = 'Erreur lors du chargement des domaines juridiques.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.domaineForm.valid) {
            const formValue = this.domaineForm.value;
            const domaineData: any = {
                ...formValue
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
        }
    }

    editDomaine(domaine: DomaineJuridique): void {
        this.isEditing = true;
        this.selectedDomaineId = domaine.id;
        this.domaineForm.patchValue({
            label: domaine.label,
            code: domaine.code,
            color: domaine.color,
            order: domaine.order,
            active: domaine.active
        });
    }

    async deleteDomaine(id: string): Promise<void> {
        const domaine = this.domaines.find(d => d.id === id);
        if (domaine) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver ce domaine juridique ?', 'warning');
            if (isConfirmed) {
                const updatedDomaine: DomaineJuridique = { ...domaine, active: false };
                this.domaineJuridiqueService.update(updatedDomaine).subscribe({
                    next: () => {
                        this.alertService.success('Domaine juridique désactivé avec succès');
                        this.loadDomaines();
                    },
                    error: (err) => {
                        console.error('Error updating domaine', err);
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
        this.selectedDomaineId = null;
        this.domaineForm.reset({
            active: true,
            color: '#000000',
            order: 0
        });
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { DomaineJuridique } from '../../appTypes';

@Component({
    selector: 'app-domaine-juridique-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './domaine-juridique-form.component.html',
    styleUrls: ['./domaine-juridique-form.component.css']
})
export class DomaineJuridiqueFormComponent implements OnInit {
    domaines: DomaineJuridique[] = [];
    domaineForm: FormGroup;
    isEditing = false;
    selectedDomaineId: string | null = null;
    errorMessage: string = '';

    constructor(
        private domaineJuridiqueService: DomaineJuridiqueService,
        private fb: FormBuilder
    ) {
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
            next: (data) => {
                this.domaines = data.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading domaines', err);
                this.errorMessage = 'Erreur lors du chargement des domaines juridiques.';
            }
        });
    }

    onSubmit(): void {
        if (this.domaineForm.valid) {
            const formValue = this.domaineForm.value;
            const domaineData: DomaineJuridique = {
                ...formValue,
                id: this.selectedDomaineId ? this.selectedDomaineId : this.generateId()
            };

            if (this.isEditing && this.selectedDomaineId) {
                this.domaineJuridiqueService.update(this.selectedDomaineId, domaineData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadDomaines();
                    },
                    error: (err) => console.error('Error updating domaine', err)
                });
            } else {
                this.domaineJuridiqueService.create(domaineData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadDomaines();
                    },
                    error: (err) => console.error('Error creating domaine', err)
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

    deleteDomaine(id: string): void {
        const domaine = this.domaines.find(d => d.id === id);
        if (domaine && confirm('Êtes-vous sûr de vouloir désactiver ce domaine juridique ?')) {
            const updatedDomaine: DomaineJuridique = { ...domaine, active: false };
            this.domaineJuridiqueService.update(id, updatedDomaine).subscribe({
                next: () => this.loadDomaines(),
                error: (err) => console.error('Error updating domaine', err)
            });
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

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientTypeEnum, Document, SecteurActivite } from '../../appTypes';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { AlertService } from '../../services/alert-service';
import { ClientService } from '../../services/client-service';
import { SecteurActiviteService } from '../../services/secteur-activite-service';

@Component({
    selector: 'app-client-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DocumentDialog],
    templateUrl: './client-form.component.html',
    styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private clientService = inject(ClientService);
    private secteurService = inject(SecteurActiviteService);
    private router = inject(Router);
    private alertService = inject(AlertService);

    clientForm: FormGroup;
    secteurs: SecteurActivite[] = [];
    ClientTypeEnum = ClientTypeEnum;

    documents: Document[] = [];
    showAddDocumentDialog: boolean = false;

    // Helper for template access
    get clientTypes(): string[] {
        return Object.values(ClientTypeEnum);
    }

    constructor() {
        this.clientForm = this.fb.group({
            type: [ClientTypeEnum.PERSONNE, Validators.required],
            nom: ['', Validators.required], // Nom ou Raison Sociale
            prenom: [''], // Only for PERSONNE
            email: ['', [Validators.required, Validators.email]],
            telephone: ['', Validators.required],
            paysResidance: ['', Validators.required],
            secteurActivite: ['', Validators.required],
            riskScore: [0], // Auto-calculated or manual override
            ubos: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadSecteurs();

        // React to type changes
        this.clientForm.get('type')?.valueChanges.subscribe(type => {
            this.updateValidators(type);
        });
    }

    get ubos(): FormArray {
        return this.clientForm.get('ubos') as FormArray;
    }

    addUbo(): void {
        const uboGroup = this.fb.group({
            nom: ['', Validators.required],
            partDetention: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            isPPE: [false]
        });
        this.ubos.push(uboGroup);
    }

    removeUbo(index: number): void {
        this.ubos.removeAt(index);
    }

    // Document Management
    openAddDocumentDialog() {
        this.showAddDocumentDialog = true;
    }

    closeAddDocumentDialog() {
        this.showAddDocumentDialog = false;
    }

    onAddDocument(doc: Document) {
        // Assign a temporary ID if missing (for tracking in UI)
        if (!doc.id) {
            doc.id = new Date().getTime();
        }
        this.documents.push(doc);
        this.closeAddDocumentDialog();
    }

    deleteDocument(id: number | undefined) {
        if (!id) return;
        this.documents = this.documents.filter(d => d.id !== id);
    }

    downloadDoc(doc: Document) {
        console.log('Downloading document:', doc.name);
        // Implement actual download logic or mock
        this.alertService.success(`Téléchargement de ${doc.name} lancé`);
    }



    private loadSecteurs(): void {
        this.secteurService.getAll().subscribe(data => {
            this.secteurs = data.filter(s => s.actif);
        });
    }

    private updateValidators(type: ClientTypeEnum): void {
        const prenomControl = this.clientForm.get('prenom');
        const ubosArray = this.clientForm.get('ubos') as FormArray;

        if (type === ClientTypeEnum.PERSONNE) {
            prenomControl?.setValidators(Validators.required);
            ubosArray.clear(); // No UBOs for natural persons usually, or logic differs
        } else {
            prenomControl?.clearValidators();
            // For societies, we might want to enforce at least one UBO or just leave it optional
        }
        prenomControl?.updateValueAndValidity();
    }

    onSubmit(): void {
        if (this.clientForm.valid) {
            // Logic to calculate initial risk score based on sector could go here
            const formValue = this.clientForm.getRawValue();

            this.clientService.create(formValue).subscribe({
                next: () => {
                    this.alertService.success('Client créé avec succès');
                    this.router.navigate(['/home/crm']);
                },
                error: (err: any) => {
                    console.error(err);
                    this.alertService.displayMessage('Erreur', 'Impossible de créer le client', 'error');
                }
            });
        } else {
            this.clientForm.markAllAsTouched();
        }
    }

    cancel(): void {
        this.router.navigate(['/home/crm']);
    }
}

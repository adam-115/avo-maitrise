import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, ClientStatus, ClientTypeEnum, ContactPoint, Document, SecteurActivite, UBO } from '../../appTypes';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { AlertService } from '../../services/alert-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
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
    private route = inject(ActivatedRoute);
    private navigationService = inject(NavigationService);

    selectedClient: Client | null = null;
    isEditMode = false;

    clientForm: FormGroup;
    secteurs: SecteurActivite[] = [];
    ClientTypeEnum = ClientTypeEnum;

    documents: Document[] = [];
    showAddDocumentDialog: boolean = false;

    get ubos(): FormArray {
        return this.clientForm.get('ubos') as FormArray;
    }

    get contacts(): FormArray {
        return this.clientForm.get('contacts') as FormArray;
    }

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
            ubos: this.fb.array([]),
            contacts: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadSecteurs();
        // React to type changes
        this.clientForm.get('type')?.valueChanges.subscribe(type => {
            this.updateValidators(type);
        });

        // in edit mode load existing client 
        this.isInEditMode();
    }

    private isInEditMode() {
        this.route.params.subscribe(params => {
            let id = params['id'];
            this.isEditMode = !!params['id'];
            if (this.isEditMode) {
                this.clientForm.get('type')?.disable();
                this.clientService.findById(id as number).subscribe(client => {
                    this.selectedClient = client;
                    this.clientForm.patchValue(client);
                    this.documents = client.documents ?? [];
                    this.ubos.clear();
                    client.ubos?.forEach(ubo => {
                        this.ubos.push(this.createUboGroup(ubo));
                    });
                    this.contacts.clear();
                    client.contacts?.forEach(contact => {
                        this.contacts.push(this.createContactGroup(contact));
                    });

                })
            }
        });
    }

    isClientTypeDisabled(type: any): boolean {
        return this.isEditMode;
    }

    private createUboGroup(data?: UBO): FormGroup {
        return this.fb.group({
            nom: [data?.nom || '', Validators.required],
            partDetention: [data?.partDetention || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
            isPPE: [data?.isPPE || false]
        });
    }

    private createContactGroup(data?: ContactPoint): FormGroup {
        return this.fb.group({
            id: [data?.id || null],
            nom: [data?.nom || '', Validators.required],
            prenom: [data?.prenom || '', Validators.required],
            email: [data?.email || '', [Validators.required, Validators.email]],
            telephone: [data?.telephone || '', Validators.required],
            occupation: [data?.occupation || '', Validators.required]
        });
    }



    addUbo(): void {
        this.ubos.push(this.createUboGroup());
    }

    removeUbo(index: number): void {
        this.ubos.removeAt(index);
    }

    addContact(): void {
        this.contacts.push(this.createContactGroup());
    }

    removeContact(index: number): void {
        this.contacts.removeAt(index);
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
            formValue.clientStatus = ClientStatus.AML_REQUIRED;
            formValue.documents = this.documents;

            this.clientService.create(formValue).subscribe({
                next: (newClient: Client) => {
                    this.navigationService.navigateToClientDetails(newClient.id);
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

    editClient(): void {
        if (this.clientForm.valid) {
            const formValue = this.clientForm.getRawValue();
            formValue.clientStatus = ClientStatus.AML_REQUIRED;
            formValue.documents = this.documents;
            this.clientService.update(this.selectedClient?.id, formValue).subscribe({
                next: () => {
                    this.alertService.success('Client modifié avec succès');
                    this.navigationService.navigateToClientDetails(this.selectedClient?.id ?? '');
                },
                error: (err: any) => {
                    console.error(err);
                    this.alertService.displayMessage('Erreur', 'Impossible de modifier le client', 'error');
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

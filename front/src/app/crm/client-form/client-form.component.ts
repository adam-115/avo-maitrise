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
import { ClientMoralService } from '../../services/client-moral.service';
import { PersonnePhysiqueService } from '../../services/personne-physique.service';
import { AssociationService } from '../../services/association.service';
import { InstitutionService } from '../../services/institution.service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

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
    private clientMoralService = inject(ClientMoralService);
    private personnePhysiqueService = inject(PersonnePhysiqueService);
    private associationService = inject(AssociationService);
    private institutionService = inject(InstitutionService);
    private secteurService = inject(SecteurActiviteService);
    private router = inject(Router);
    private alertService = inject(AlertService);
    private route = inject(ActivatedRoute);
    private navigationService = inject(NavigationService);

    selectedClient: any = null;
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

    get clientTypes(): string[] {
        return Object.values(ClientTypeEnum);
    }

    constructor() {
        this.clientForm = this.fb.group({
            type: [ClientTypeEnum.PERSONNE, Validators.required],
            email: ['', [Validators.required, Validators.email]],
            telephone: ['', Validators.required],
            adresse: [''],
            pays: ['', Validators.required],
            secteurActivite: ['', Validators.required],
            
            // Personne Physique fields
            nom: [''],
            prenom: [''],
            nationalite: [''],
            cin: [''],
            dateNaissance: [''],

            // Client Moral / Societe fields
            nomCommercial: [''],
            formeJuridique: [''],
            numeroRegistreCommerce: [''],
            numeroIdFiscal: [''],
            
            // Representant Legal fields (Shared by Moral, Association, Institution)
            nomRepresentantLegal: [''],
            prenomRepresentantLegal: [''],
            nationaliteRepresentantLegal: [''],
            cinRepresentantLegal: [''],
            dateNaissanceRepresentantLegal: [''],

            // Association / Institution specific
            numeroRegistreNational: [''],

            ubos: this.fb.array([]),
            contacts: this.fb.array([])
        });

        this.clientForm.valueChanges.subscribe(() => {
            if (this.clientForm.dirty) {
                this.clientForm.markAllAsTouched();
            }
        });
    }

    ngOnInit(): void {
        this.loadSecteurs();
        this.clientForm.get('type')?.valueChanges.subscribe(type => {
            this.updateValidators(type);
        });

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.isEditMode = true;
                this.loadClient(id);
            }
        });

        this.updateValidators(this.clientForm.get('type')?.value);
    }

    private loadClient(id: string) {
        this.clientService.findById(id).subscribe(client => {
            this.selectedClient = client;
            this.clientForm.patchValue(client);
            this.clientForm.get('type')?.disable();
            
            if (client.documents) this.documents = client.documents;
            
            if (client.ubos) {
                this.ubos.clear();
                client.ubos.forEach((ubo: UBO) => this.ubos.push(this.createUboGroup(ubo)));
            }

            if (client.contacts) {
                this.contacts.clear();
                client.contacts.forEach((contact: ContactPoint) => this.contacts.push(this.createContactGroup(contact)));
            }
        });
    }

    private updateValidators(type: ClientTypeEnum) {
        // Reset validators first
        const fields = [
            'nom', 'prenom', 'nationalite', 'cin', 'dateNaissance',
            'nomCommercial', 'formeJuridique', 'numeroRegistreCommerce', 'numeroIdFiscal',
            'nomRepresentantLegal', 'prenomRepresentantLegal', 'numeroRegistreNational'
        ];
        fields.forEach(f => this.clientForm.get(f)?.clearValidators());

        if (type === ClientTypeEnum.PERSONNE) {
            this.clientForm.get('nom')?.setValidators(Validators.required);
            this.clientForm.get('prenom')?.setValidators(Validators.required);
        } else if (type === ClientTypeEnum.SOCIETE) {
            this.clientForm.get('nomCommercial')?.setValidators(Validators.required);
            this.clientForm.get('numeroRegistreCommerce')?.setValidators(Validators.required);
        } else if (type === ClientTypeEnum.ASSOCIATION || type === ClientTypeEnum.INSTITUTION) {
            this.clientForm.get('nom')?.setValidators(Validators.required);
            this.clientForm.get('numeroRegistreNational')?.setValidators(Validators.required);
        }

        fields.forEach(f => this.clientForm.get(f)?.updateValueAndValidity());
    }

    private loadSecteurs(): void {
        this.secteurService.getAll().subscribe((data: PaginatedResponse<SecteurActivite>) => {
            this.secteurs = data.content.filter(s => s.actif);
        });
    }

    createUboGroup(data?: UBO): FormGroup {
        return this.fb.group({
            fullName: [data?.fullName || '', Validators.required],
            percentageOfOwnership: [data?.percentageOfOwnership || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
            roleInCompany: [data?.roleInCompany || ''],
            nationality: [data?.nationality || ''],
            dateOfBirth: [data?.dateOfBirth || '']
        });
    }

    createContactGroup(data?: ContactPoint): FormGroup {
        return this.fb.group({
            id: [data?.id || null],
            nom: [data?.nom || '', Validators.required],
            prenom: [data?.prenom || '', Validators.required],
            email: [data?.email || '', [Validators.required, Validators.email]],
            telephone: [data?.telephone || '', Validators.required],
            occupation: [data?.occupation || '', Validators.required],
            adresse: [data?.adresse || '']
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

    openAddDocumentDialog() {
        this.showAddDocumentDialog = true;
    }

    closeAddDocumentDialog() {
        this.showAddDocumentDialog = false;
    }

    onAddDocument(doc: Document) {
        console.log(doc);
        // Do not generate a fake ID here, it causes "detached entity" errors on backend
        this.documents.push(doc);
        this.closeAddDocumentDialog();
    }

    deleteDocument(id: number | undefined) {
        if (!id) return;
        this.documents = this.documents.filter(d => d.id !== id);
    }

    async onSubmit(): Promise<void> {
        if (this.clientForm.invalid) {
            this.clientForm.markAllAsTouched();
            return;
        }

        const type = this.clientForm.get('type')?.value;

        if (this.isEditMode) {
            let title = 'Modifier le client';
            let message = 'Êtes-vous sûr de vouloir enregistrer les modifications apportées à ce client ?';
            if (type === ClientTypeEnum.SOCIETE) {
                title = 'Modifier la société';
                message = 'Êtes-vous sûr de vouloir enregistrer les modifications apportées à cette société ?';
            } else if (type === ClientTypeEnum.ASSOCIATION) {
                title = 'Modifier l\'association';
                message = 'Êtes-vous sûr de vouloir enregistrer les modifications apportées à cette association ?';
            } else if (type === ClientTypeEnum.INSTITUTION) {
                title = 'Modifier l\'institution';
                message = 'Êtes-vous sûr de vouloir enregistrer les modifications apportées à cette institution ?';
            }

            const confirmed = await this.alertService.confirmMessage(title, message, 'warning');
            if (!confirmed) {
                return;
            }
        }
        const formValue = this.clientForm.getRawValue();
        formValue.documents = this.documents;
        formValue.clientStatus = ClientStatus.AML_REQUIRED;
        console.log(formValue);

        // Convert files to base64 for BLOB storage if needed
        const uploadPromises = this.documents.map(async (doc) => {
            if (doc.file && !doc.fileData) {
                doc.fileData = await this.fileToBase64(doc.file);
            }
            if (!doc.nomFichier) doc.nomFichier = doc.name;
            return doc;
        });

        Promise.all(uploadPromises).then(() => {
            let request$;
            if (this.isEditMode) {
                formValue.id = this.selectedClient.id;
                request$ = this.getServiceByType(type).update(formValue);
            } else {
                request$ = this.getServiceByType(type).create(formValue);
            }

            request$.subscribe({
                next: (client: any) => {
                    this.alertService.success(this.isEditMode ? 'Client modifié' : 'Client créé');
                    this.navigationService.navigateToClientDetails(String(client.id));
                },
                error: (err: any) => {
                    console.error(err);
                    this.alertService.displayMessage('Erreur', 'Opération échouée', 'error');
                }
            });
        });
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Remove the data:image/png;base64, part
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = error => reject(error);
        });
    }

    private getServiceByType(type: ClientTypeEnum): any {
        switch (type) {
            case ClientTypeEnum.PERSONNE: return this.personnePhysiqueService;
            case ClientTypeEnum.SOCIETE: return this.clientMoralService;
            case ClientTypeEnum.ASSOCIATION: return this.associationService;
            case ClientTypeEnum.INSTITUTION: return this.institutionService;
            default: return this.clientService;
        }
    }

    cancel(): void {
        this.router.navigate(['/home/crm']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.clientForm.get(fieldName);
        return !!(control && control.invalid && control.touched);
    }
}


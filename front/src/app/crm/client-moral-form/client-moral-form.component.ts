import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientStatus, ClientTypeEnum, ContactPoint, Document, SecteurActivite, UBO, ClientMoral } from '../../appTypes';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { AlertService } from '../../services/alert-service';
import { ClientMoralService } from '../../services/client-moral.service';
import { NavigationService } from '../../services/navigation-service';
import { SecteurActiviteService } from '../../services/secteur-activite-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
    selector: 'app-client-moral-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DocumentDialog],
    templateUrl: './client-moral-form.component.html',
    styleUrls: ['./client-moral-form.component.css']
})
export class ClientMoralFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(ClientMoralService);
    private secteurService = inject(SecteurActiviteService);
    private router = inject(Router);
    private alertService = inject(AlertService);
    private route = inject(ActivatedRoute);
    private navigationService = inject(NavigationService);

    isEditMode = false;
    clientForm: FormGroup;
    secteurs: SecteurActivite[] = [];
    documents: Document[] = [];
    showAddDocumentDialog = false;

    get ubos(): FormArray { return this.clientForm.get('ubos') as FormArray; }
    get contacts(): FormArray { return this.clientForm.get('contacts') as FormArray; }

    constructor() {
        this.clientForm = this.fb.group({
            id: [null],
            type: [ClientTypeEnum.SOCIETE],
            email: ['', [Validators.required, Validators.email]],
            telephone: ['', Validators.required],
            adresse: [''],
            pays: ['', Validators.required],
            secteurActivite: ['', Validators.required],
            nomCommercial: ['', Validators.required],
            formeJuridique: [''],
            numeroRegistreCommerce: ['', Validators.required],
            numeroIdFiscal: [''],
            nomRepresentantLegal: [''],
            prenomRepresentantLegal: [''],
            nationaliteRepresentantLegal: [''],
            cinRepresentantLegal: [''],
            dateNaissanceRepresentantLegal: [''],
            ubos: this.fb.array([]),
            contacts: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadSecteurs();
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.isEditMode = true;
                this.loadClient(id);
            }
        });
    }

    private loadClient(id: string) {
        this.service.findById(id).subscribe(client => {
            this.clientForm.patchValue(client);
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

    addUbo(): void { this.ubos.push(this.createUboGroup()); }
    removeUbo(index: number): void { this.ubos.removeAt(index); }
    addContact(): void { this.contacts.push(this.createContactGroup()); }
    removeContact(index: number): void { this.contacts.removeAt(index); }

    openAddDocumentDialog() { this.showAddDocumentDialog = true; }
    closeAddDocumentDialog() { this.showAddDocumentDialog = false; }
    onAddDocument(doc: Document) {
        if (!doc.id) doc.id = Date.now();
        this.documents.push(doc);
        this.closeAddDocumentDialog();
    }
    deleteDocument(id: number | undefined) {
        if (!id) return;
        this.documents = this.documents.filter(d => d.id !== id);
    }

    onSubmit(): void {
        if (this.clientForm.invalid) {
            this.clientForm.markAllAsTouched();
            return;
        }

        const formValue = this.clientForm.getRawValue();
        formValue.documents = this.documents;
        formValue.clientStatus = ClientStatus.AML_REQUIRED;

        const request$ = this.isEditMode ? this.service.update(formValue.id, formValue) : this.service.create(formValue);

        request$.subscribe({
            next: (client: any) => {
                this.alertService.success(this.isEditMode ? 'Société modifiée' : 'Société créée');
                this.navigationService.navigateToClientDetails(String(client.id));
            },
            error: (err: any) => {
                console.error(err);
                this.alertService.displayMessage('Erreur', 'Opération échouée', 'error');
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/home/crm']);
    }
}


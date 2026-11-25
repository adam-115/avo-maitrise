import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientStatus, ClientTypeEnum, ContactPoint, Document, SecteurActivite } from '../../appTypes';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { AlertService } from '../../services/alert-service';
import { PersonnePhysiqueService } from '../../services/personne-physique.service';
import { NavigationService } from '../../services/navigation-service';
import { SecteurActiviteService } from '../../services/secteur-activite-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-personne-physique-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, DocumentDialog, TranslatePipe],
    templateUrl: './personne-physique-form.component.html',
    styleUrls: ['./personne-physique-form.component.css']
})
export class PersonnePhysiqueFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(PersonnePhysiqueService);
    private secteurService = inject(SecteurActiviteService);
    private router = inject(Router);
    private alertService = inject(AlertService);
    private route = inject(ActivatedRoute);
    private navigationService = inject(NavigationService);

    isEditMode = false;
    isSubmitting = false;
    validationSummary: string | null = null;
    clientForm: FormGroup;
    secteurs: SecteurActivite[] = [];
    documents: Document[] = [];
    showAddDocumentDialog = false;

    get contacts(): FormArray {
        return this.clientForm.get('contacts') as FormArray;
    }

    constructor() {
        this.clientForm = this.fb.group({
            id: [null],
            type: [ClientTypeEnum.PERSONNE],
            email: ['', [Validators.required, Validators.email]],
            telephone: ['', Validators.required],
            adresse: [''],
            pays: ['', Validators.required],
            secteurActivite: ['', Validators.required],
            nom: ['', Validators.required],
            prenom: ['', Validators.required],
            nationalite: [''],
            cin: [''],
            dateNaissance: [''],
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

    addContact(): void {
        this.contacts.push(this.createContactGroup());
    }

    removeContact(index: number): void {
        this.contacts.removeAt(index);
    }

    openAddDocumentDialog() { this.showAddDocumentDialog = true; }
    closeAddDocumentDialog() { this.showAddDocumentDialog = false; }

    onAddDocument(doc: Document) {
        this.documents.push(doc);
        this.closeAddDocumentDialog();
    }

    deleteDocumentAt(index: number) {
        this.documents.splice(index, 1);
    }

    private getInvalidFieldLabels(): string[] {
        const labels: Record<string, string> = {
            nom: 'Nom',
            prenom: 'Prénom',
            email: this.clientForm.get('email')?.errors?.['email'] ? 'Email (format invalide)' : 'Email',
            telephone: 'Téléphone',
            pays: 'Pays',
            secteurActivite: 'Secteur d\'activité'
        };
        return Object.keys(labels)
            .filter(key => this.clientForm.get(key)?.invalid)
            .map(key => labels[key]);
    }

    async onSubmit(): Promise<void> {
        this.validationSummary = null;
        if (this.clientForm.invalid) {
            this.clientForm.markAllAsTouched();
            const missing = this.getInvalidFieldLabels();
            this.validationSummary = missing.length > 0
                ? `Champs obligatoires ou invalides : ${missing.join(', ')}.`
                : 'Veuillez vérifier les champs obligatoires du formulaire.';
            this.alertService.displayMessage('Formulaire incomplet', this.validationSummary, 'warning');
            setTimeout(() => {
                const firstInvalid = document.querySelector('form .ng-invalid[formControlName]') as HTMLElement | null;
                firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid?.focus();
            });
            return;
        }

        if (this.isEditMode) {
            const confirmed = await this.alertService.confirmMessage(
                'Modifier le client',
                'Êtes-vous sûr de vouloir enregistrer les modifications apportées à ce client ?',
                'warning'
            );
            if (!confirmed) {
                return;
            }
        }

        this.isSubmitting = true;
        const formValue = this.clientForm.getRawValue();
        formValue.clientStatus = ClientStatus.AML_REQUIRED;

        const uploadPromises = this.documents.map(async (doc) => {
            if (doc.file && !doc.fileData) {
                doc.fileData = await this.fileToBase64(doc.file);
            }
            if (!doc.nomFichier) doc.nomFichier = doc.name;
            return doc;
        });

        Promise.all(uploadPromises).then(() => {
            formValue.documents = this.documents;
            const request$ = this.isEditMode ? this.service.update(formValue) : this.service.create(formValue);

            request$.subscribe({
                next: (client: any) => {
                    this.isSubmitting = false;
                    this.alertService.success(this.isEditMode ? 'Client modifié' : 'Client créé');
                    this.navigationService.navigateToClientDetails(String(client.id));
                },
                error: (err: any) => {
                    console.error(err);
                    this.isSubmitting = false;
                    this.alertService.displayMessage('Erreur', 'Opération échouée', 'error');
                }
            });
        }).catch(() => {
            this.isSubmitting = false;
            this.alertService.displayMessage('Erreur', 'Impossible de traiter les documents joints', 'error');
        });
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = error => reject(error);
        });
    }

    cancel(): void {
        this.router.navigate(['/home/crm']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.clientForm.get(fieldName);
        return !!(control && control.invalid && control.touched);
    }
}

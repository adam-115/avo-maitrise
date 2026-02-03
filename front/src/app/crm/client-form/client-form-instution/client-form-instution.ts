import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClientDetail, ClientInstitution, Document, TypeOrganisme } from '../../../appTypes';
import { ClientDocumentsComponent } from '../../client-documents/client-documents';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeOrganismeService } from '../../../services/type-organisme-service';
import { ClientService } from '../../../services/client-service';
import { MappingFormService } from '../../../services/mapping-form-service';
import { NavigationService } from '../../../services/navigation-service';

@Component({
  selector: 'app-client-form-instution',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClientDocumentsComponent],
  templateUrl: './client-form-instution.html',
  styleUrl: './client-form-instution.css',
})
export class ClientFormInstution {
  fb = inject(FormBuilder);
  clientService = inject(ClientService);
  mappingFormService = inject(MappingFormService);
  navigationService = inject(NavigationService);

  typeOrganismeService = inject(TypeOrganismeService);

  clientInstitutionForm: FormGroup = new FormGroup({});
  typeOrganismes: TypeOrganisme[] = [];
  documents: Document[] = [];

  contacts: any[] = [
    { nom: '', fonction: '', email: '', telephone: '' }
  ];

  ngOnInit(): void {
    this.clientInstitutionForm = this.fb.group({
      selectedTypeOrganisme: [null, Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });

    this.typeOrganismeService.getAll().subscribe(data => {
      this.typeOrganismes = data;
    });
  }

  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', telephone: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }

  saveClient() {
    if (this.clientInstitutionForm.invalid) {
      this.clientInstitutionForm.markAllAsTouched();
      return;
    }

    const formValues = this.clientInstitutionForm.value;
    const clientData: ClientInstitution = {
      type: 'INSTITUTION',
      name: formValues.name, // Nom de l'institution
      typeOrganisme: formValues.selectedTypeOrganisme?.libelle,
      role: 'Client',
      amlRisk: 'FAIBLE',
      complianceStatus: 'OK',
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      country: 'Luxembourg',
      contacts: this.contacts,
      totalFiles: 0,
      activeCases: 0,
      internalContactsCount: 0,
      clientContactsCount: this.contacts.length,
      documentsToReview: 0,
      isPEP: false,
      fundsOrigin: '',
      complianceNotes: '',
      validationDate: new Date().toISOString(),
      archivingStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      notes: '',
      history: []
    } as ClientInstitution;

    this.clientService.create(clientData).subscribe({
      next: (createdClient: ClientDetail) => {
        console.log('Client saved', createdClient);
        if (createdClient.id) {
          this.navigateToAmlForm(createdClient.id.toString());
        }
      },
      error: (err) => console.error('Error saving client', err)
    });
  }

  navigateToAmlForm(clientId: string) {
    this.navigationService.navigateToViewFormConfig_2(clientId);
  }

  goBack() {
    // Logique pour retourner à la liste des clients
  }

}

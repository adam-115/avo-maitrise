import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientPhysique, Document, SecteurActivite } from '../../../appTypes';
import { ClientService } from '../../../services/client-service';
import { MappingFormService } from '../../../services/mapping-form-service';
import { NavigationService } from '../../../services/navigation-service';
import { ClientDocumentsComponent } from '../../client-documents/client-documents';
import { SecteurActiviteService } from '../../../services/secteur-activite-service';

@Component({
  selector: 'app-client-form-physique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClientDocumentsComponent],
  templateUrl: './client-form-physique.html',
  styleUrl: './client-form-physique.css',
})
export class ClientFormPhysique implements OnInit {
  fb = inject(FormBuilder);
  clientService = inject(ClientService);
  mappingFormService = inject(MappingFormService);
  navigationService = inject(NavigationService);
  secteurActiviteService = inject(SecteurActiviteService);

  physiqueForm: FormGroup = this.fb.group({
    identityNumber: ['', Validators.required],
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    birthDate: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    selectedSecteurActivite: [null] // Optional for Personne Physique
  });

  SecteurActivites: SecteurActivite[] = [];
  documents: Document[] = [];


  contacts = [
    { nom: 'adam', fonction: 'manager', email: 'adam.laftimi@company.com', tel: '+352691209800' }
  ];

  ngOnInit(): void {
    this.secteurActiviteService.getAll().subscribe(data => {
      this.SecteurActivites = data;
    });
  }

  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', tel: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }

  async saveClient() {
    if (this.physiqueForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.physiqueForm.markAllAsTouched();
      return;
    }

    const formValues = this.physiqueForm.value;
    const clientData: ClientPhysique = {
      type: 'PERSONNE',
      name: `${formValues.lastName} ${formValues.firstName}`,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      identityNumber: formValues.identityNumber,
      birthDate: formValues.birthDate,
      role: 'Client', // Default role
      amlRisk: 'FAIBLE', // Default risk
      complianceStatus: 'OK',
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      country: 'Luxembourg', // Default or add field
      contacts: this.contacts, // Add contacts array
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
      history: [],
      sector: formValues.selectedSecteurActivite?.libelle
    } as ClientPhysique;

    this.clientService.create(clientData).subscribe({
      next: (createdClient) => {
        console.log('Client saved', createdClient);
        this.navigateToAmlForm(formValues.selectedSecteurActivite);
      },
      error: (err) => console.error('Error saving client', err)
    });
  }

  navigateToAmlForm(secteur?: any) {
    this.mappingFormService.getAll().subscribe(mappings => {
      // Find mapping for PERSONNE and specific sector if available
      const mapping = mappings.find(m => m.typeClient === 'PERSONNE' &&
        (secteur ? m.secteurActivite === secteur.code : (m.secteurActivite === 'TOUT' || !m.secteurActivite)));

      if (mapping) {
        console.log('Navigating to form', mapping.amlFormConfigID);
        // this.router.navigate(['/aml-form', mapping.amlFormConfigID]);
      } else {
        console.warn('No AML form mapping found for PERSONNE' + (secteur ? ' - ' + secteur.code : ''));
      }
    });
  }
}

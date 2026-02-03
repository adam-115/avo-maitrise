import { Component, inject, OnInit } from '@angular/core';
import { ClientDetail, ClientSociete, Document, SecteurActivite } from '../../../appTypes';
import { ClientDocumentsComponent } from '../../client-documents/client-documents';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecteurActiviteService } from '../../../services/secteur-activite-service';
import { ClientService } from '../../../services/client-service';
import { MappingFormService } from '../../../services/mapping-form-service';
import { NavigationService } from '../../../services/navigation-service';

@Component({
  selector: 'app-client-form-morale',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClientDocumentsComponent],
  templateUrl: './client-form-morale.html',
  styleUrl: './client-form-morale.css'
})
export class ClientFormMorale implements OnInit {
  fb = inject(FormBuilder);
  clientService = inject(ClientService);
  mappingFormService = inject(MappingFormService);
  navigationService = inject(NavigationService);
  secteurActiviteService = inject(SecteurActiviteService);

  clientMoralForm: FormGroup = new FormGroup({});
  SecteurActivites: SecteurActivite[] = [];

  contacts: any[] = [
    { nom: '', fonction: '', email: '', telephone: '' }
  ];
  documents: Document[] = [];

  ngOnInit(): void {

    this.clientMoralForm = this.fb.group({
      denomination: ['', Validators.required],
      selectedSecteurActivite: [null, Validators.required],
      siret: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });

    this.secteurActiviteService.getAll().subscribe(data => {
      this.SecteurActivites = data;
    })
  }





  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', telephone: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }

  async saveClient() {
    if (this.clientMoralForm.invalid) {
      this.clientMoralForm.markAllAsTouched();
      return;
    }

    const formValues = this.clientMoralForm.value;
    const clientData: ClientSociete = {
      type: 'SOCIETE',
      name: formValues.denomination,
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      siren: formValues.siret,
      sector: formValues.selectedSecteurActivite?.libelle,
      role: 'Client',
      amlRisk: 'MOYEN',
      complianceStatus: 'OK',
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
    } as ClientSociete;

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
}

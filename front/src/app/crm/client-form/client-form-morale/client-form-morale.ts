import { Component, inject, OnInit } from '@angular/core';
import { Document, SecteurActivite } from '../../../appTypes';
import { ClientDocumentsComponent } from '../../client-documents/client-documents';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SecteurActiviteService } from '../../../services/secteur-activite-service';

@Component({
  selector: 'app-client-form-morale',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClientDocumentsComponent],
  templateUrl: './client-form-morale.html',
  styleUrl: './client-form-morale.css'
})
export class ClientFormMorale implements OnInit {
  fb = inject(FormBuilder);
  clientMoralForm: FormGroup = new FormGroup({});
  secteurActiviteService = inject(SecteurActiviteService);
  SecteurActivites: SecteurActivite[] = [];

  contacts: any[] = [
    { nom: '', fonction: '', email: '', telephone: '' }
  ];
  documents: Document[] = [];

  ngOnInit(): void {

    this.clientMoralForm = this.fb.group({
      selectedSecteurActivite: null,
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

  goBack() {
    // Logique pour retourner à la liste des clients
  }

}

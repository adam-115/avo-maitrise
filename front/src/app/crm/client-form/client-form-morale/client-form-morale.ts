import { SecteurActivite } from './../../../appTypes';
import { SecteurActiviteService } from './../../../services/secteur-activite-service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-form-morale',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client-form-morale.html',
  styleUrl: './client-form-morale.css',
})
export class ClientFormMorale implements OnInit {
  fb = inject(FormBuilder);
  clientMoralForm: FormGroup = new FormGroup({});
  secteurActiviteService = inject(SecteurActiviteService);
  SecteurActivites: SecteurActivite[] = [];

  contacts: any[] = [
    { nom: '', fonction: '', email: '', telephone: '' }
  ];

  ngOnInit(): void {

    this.clientMoralForm = this.fb.group({
        selectedSecteurActivite : null ,
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

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientFormPhysique } from "../crm/client-form/client-form-physique/client-form-physique";
import { ClientFormMorale } from "../crm/client-form/client-form-morale/client-form-morale";
import { ClientForm } from "../crm/client-form/client-form";


@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule,
    RouterModule, ClientFormPhysique, ClientFormMorale, ClientForm],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  clientType: string = 'physique';

  constructor() { }


  goBack() {
    // Logique pour retourner à la liste des clients
  }

  // Liste dynamique des contacts pour les personnes morales
  contacts: any[] = [
    { nom: '', fonction: '', email: '', telephone: '' }
  ];

  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', telephone: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }


}

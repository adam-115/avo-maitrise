import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-form-morale',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './client-form-morale.html',
  styleUrl: './client-form-morale.css',
})
export class ClientFormMorale {

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

  goBack() {
    // Logique pour retourner à la liste des clients
  }

}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-form-instution',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './client-form-instution.html',
  styleUrl: './client-form-instution.css',
})
export class ClientFormInstution {



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

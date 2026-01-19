import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-form-physique',
  imports: [CommonModule,FormsModule,ReactiveFormsModule ],
  templateUrl: './client-form-physique.html',
  styleUrl: './client-form-physique.css',
})
export class ClientFormPhysique {

  clientType: string = 'physique';
  contacts = [
    { nom: '', fonction: '', email: '', tel: '' }
  ];

  goBack() {
    // Logique pour retourner à la liste des clients
  }


addContact() {
  this.contacts.push({ nom: '', fonction: '', email: '', tel: '' });
}

removeContact(index: number) {
  if (this.contacts.length > 1) {
    this.contacts.splice(index, 1);
  }
}


}

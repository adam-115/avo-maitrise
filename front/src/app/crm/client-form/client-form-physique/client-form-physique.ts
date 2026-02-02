import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Document } from '../../../appTypes';
import { ClientDocumentsComponent } from '../../client-documents/client-documents';

@Component({
  selector: 'app-client-form-physique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClientDocumentsComponent],
  templateUrl: './client-form-physique.html',
  styleUrl: './client-form-physique.css',
})
export class ClientFormPhysique {

  documents: Document[] = [];


  contacts = [
    { nom: 'adam', fonction: 'manager', email: 'adam.laftimi@company.com', tel: '+352691209800' }
  ];

  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', tel: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }









}

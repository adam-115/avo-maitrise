import { Component } from '@angular/core';
import { ClientType } from '../../appTypes';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientFormPhysique } from "./client-form-physique/client-form-physique";
import { ClientFormMorale } from "./client-form-morale/client-form-morale";
import { ClientFormInstution } from "./client-form-instution/client-form-instution";

@Component({
  selector: 'app-client-form',
  imports: [CommonModule, FormsModule, ClientFormPhysique, ClientFormMorale, ClientFormInstution],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css'
})
export class ClientForm {

  clientType: string = 'physique';

  goBack() {
    // Logique pour retourner à la liste des clients
  }
  addContact() {
    // Logique pour ajouter un contact
  }

  removeContact(index: number) {
    // Logique pour supprimer un contact
  }
}

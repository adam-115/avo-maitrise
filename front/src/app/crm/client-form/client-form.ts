import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TypeClient } from './../../appTypes';
import { TypeClientService } from './../../services/type-client-service';
import { ClientFormInstution } from "./client-form-instution/client-form-instution";
import { ClientFormMorale } from "./client-form-morale/client-form-morale";
import { ClientFormPhysique } from "./client-form-physique/client-form-physique";

@Component({
  selector: 'app-client-form',
  imports: [CommonModule, FormsModule, ClientFormPhysique, ClientFormMorale, ClientFormInstution],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css'
})
export class ClientForm implements OnInit {
  clientForm: any;


  typeClientService = inject(TypeClientService);
  clientTypes: TypeClient[] = [];
  selectedClientType: TypeClient | null = null;


  ngOnInit(): void {
    this.lodAllClientType();
  }



  private lodAllClientType() {
    this.typeClientService.getAll().subscribe(data => {
      this.clientTypes = data;
      this.selectPhysiqueAsDefaultClientType();
    });
  }

  private selectPhysiqueAsDefaultClientType() {
    this.clientTypes.forEach(ct => {
      if (ct.code === "physique") {
        this.selectedClientType = ct;
      }
    });

  }

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

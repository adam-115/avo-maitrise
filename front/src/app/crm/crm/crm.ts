import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Paths } from '../../paths';
import { Contact } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crm',
  imports: [RouterModule,CommonModule,FormsModule],
  templateUrl: './crm.html',
  styleUrl: './crm.css'
})
export class Crm {
  // Liste de contacts simulée pour l'exemple
  contacts: Contact[] = [
    { id: 101, type: 'PERSONNE', name: 'Dupont, Jean', role: 'Client', amlRisk: 'MOYEN', complianceStatus: 'PENDING', country: 'FRANCE', lastUpdated: '2024-05-10' },
    { id: 102, type: 'SOCIETE', name: 'ALPHA Finance SA', role: 'Client', amlRisk: 'ELEVEE', complianceStatus: 'ALERT', country: 'LUXEMBOURG', lastUpdated: '2024-05-01' },
    { id: 103, type: 'INSTITUTION', name: 'Tribunal de Paris', role: 'Juridiction', amlRisk: 'NUL', complianceStatus: 'OK', country: 'FRANCE', lastUpdated: '2023-11-15' },
    { id: 104, type: 'PERSONNE', name: 'Smith, Alice', role: 'Avocat Tiers', amlRisk: 'FAIBLE', complianceStatus: 'OK', country: 'USA', lastUpdated: '2024-04-20' },
    // ... plus de contacts
  ];
  searchTerm: string = '';

constructor(private readonly router: Router) {

  }

  filterContacts() {

  }


  viewAmlDetails(contact: Contact) {
    // Logique pour afficher les détails AML du contact
    // console.log('Afficher les détails AML pour:', contact);
    this.router.navigate([Paths.HOME, Paths.CLIENT_DETAILS]);
  }




  navigateToClientForm() {
    this.router.navigate([Paths.HOME, Paths.CLIENT_FORM]);
  }

  navigateToClientDetails(contact: Contact) {
    this.router.navigate([Paths.HOME, Paths.CLIENT_DETAILS]);
  }

  navigateToReviewsAml() {
    this.router.navigate([Paths.HOME, Paths.CLIENT_REVIEWS_AML]);
  }
}

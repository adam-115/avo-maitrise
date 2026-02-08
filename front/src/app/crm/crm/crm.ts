import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavigationService } from './../../services/navigation-service';
import { Client, ClientStatus } from '../../appTypes';
import { ClientService } from '../../services/client-service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-crm',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './crm.html',
  styleUrl: './crm.css'
})
export class Crm implements OnInit {

  private readonly navigationService = inject(NavigationService);
  private readonly clientService = inject(ClientService);


  // Liste de contacts récupérée depuis le service
  clients: Client[] = [];
  filteredClients: Client[] = [];

  searchTerm: string = '';
  selectedType: string = '';
  selectedRisk: string = '';

  get alertCount(): number {
    return this.clients.filter(c => c.clientStatus === ClientStatus.AML_REQUIRED).length;
  }

  constructor(private readonly router: Router) {

  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
        this.filterClients();
      },
      error: (err) => {
        console.error('Error loading clients', err);
      }
    });
  }

  filterClients() {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm ||
        (client.contacts && client.contacts.some(c => (c.nom + ' ' + c.prenom).toLowerCase().includes(this.searchTerm.toLowerCase()))) ||
        (client.paysResidance && client.paysResidance.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesType = !this.selectedType || client.type === this.selectedType;

      // TODO: Implement risk filter once mapping is clear. Currently riskScore is a number.
      // const matchesRisk = !this.selectedRisk || client.riskScore === this.selectedRisk;

      return matchesSearch && matchesType;
    });
  }


  viewAmlDetails(client: any) {
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS], { queryParams: { id: client.id } });
  }



  navigateToClientDetails(client: any) {
    // Assuming simple navigation for now, passing ID via state or query params might be better in real app
    // For now keeping existing pattern but usually we'd pass ID
    // this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS]);
    // Better implementation:
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS], { queryParams: { id: client.id } });
  }

  navigateToReviewsAml() {
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_REVIEWS_AML]);
  }

  navigateToNewClient() {
    this.navigationService.navigateToNewClient();
  }
}

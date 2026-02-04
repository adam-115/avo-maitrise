import { NavigationService } from './../../services/navigation-service';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Contact } from '../../appTypes';
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



  // Liste de contacts récupérée depuis le service
  clients: any[] = [];
  filteredClients: any[] = [];

  searchTerm: string = '';
  selectedType: string = '';
  selectedRisk: string = '';

  get alertCount(): number {
    return this.clients.filter(c => c.complianceStatus === 'ALERT').length;
  }

  constructor(private readonly router: Router) {

  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    // ClientService removed
    this.clients = [];
    this.filteredClients = [];
  }

  filterClients() {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm ||
        (client.name && client.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (client.country && client.country.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesType = !this.selectedType || client.type === this.selectedType;

      const matchesRisk = !this.selectedRisk || client.amlRisk === this.selectedRisk;

      return matchesSearch && matchesType && matchesRisk;
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
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InstitutionService } from '../../../services/institution.service';
import { Institution, ClientStatus } from '../../../appTypes';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { NavigationService } from '../../../services/navigation-service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-institution-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './institution-list.component.html',
  styleUrl: './institution-list.component.css'
})
export class InstitutionListComponent implements OnInit {
  private service = inject(InstitutionService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  
  clients: Institution[] = [];
  filteredClients: Institution[] = [];
  searchTerm: string = '';

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<Institution>) => {
      this.clients = data.content;
      this.filteredClients = data.content;
    });
  }

  filterClients() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredClients = this.clients;
      return;
    }
    this.filteredClients = this.clients.filter(c => 
      this.getDisplayName(c).toLowerCase().includes(term) ||
      (c.numeroRegistreNational && c.numeroRegistreNational.toLowerCase().includes(term)) ||
      String(c.id).includes(term)
    );
  }

  getDisplayName(client: Institution): string {
    return client.nom || '---';
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case ClientStatus.AML_REQUIRED: return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.VERIFICATION_AML_REQUIRED: return 'bg-amber-100 text-amber-800';
      case ClientStatus.AML_VALIDATED: return 'bg-blue-100 text-blue-800';
      case ClientStatus.INDULGENCE_REQUIRED: return 'bg-orange-100 text-orange-800';
      case ClientStatus.VALIDATED: return 'bg-green-100 text-green-800';
      case ClientStatus.BLOCKED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  navigateToDetails(client: Institution) {
    this.navigationService.navigateToClientDetails(String(client.id));
  }

  navigateToEdit(client: Institution) {
    this.navigationService.navigateToClientEdit(String(client.id));
  }

  navigateToDiligence(client: Institution) {
    this.navigationService.navigateToClientDiligenceResults(String(client.id));
  }
}

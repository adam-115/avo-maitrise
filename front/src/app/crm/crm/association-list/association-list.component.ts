import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssociationService } from '../../../services/association.service';
import { Association, ClientStatus } from '../../../appTypes';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { NavigationService } from '../../../services/navigation-service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-association-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './association-list.component.html',
  styleUrl: './association-list.component.css'
})
export class AssociationListComponent implements OnInit {
  private service = inject(AssociationService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  
  clients: Association[] = [];
  filteredClients: Association[] = [];
  searchTerm: string = '';

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<Association>) => {
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

  getDisplayName(client: Association): string {
    return client.nom || '---';
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case ClientStatus.AML_REQUIRED: return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.VERIFICATION_AML_REQUIRED: return 'bg-amber-100 text-amber-800';
      case ClientStatus.AML_VALIDATED: return 'bg-blue-100 text-blue-800';
      case ClientStatus.INDULGENCE_REQUIRED: return 'bg-orange-100 text-orange-800';
      case ClientStatus.INDULGENCE_VALIDATED: return 'bg-indigo-100 text-indigo-800';
      case ClientStatus.VALIDATED: return 'bg-green-100 text-green-800';
      case ClientStatus.BLOCKED: return 'bg-red-100 text-red-800';
      case ClientStatus.SUSPICIOUS: return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  navigateToDetails(client: Association) {
    this.navigationService.navigateToClientDetails(String(client.id));
  }

  navigateToEdit(client: Association) {
    this.navigationService.navigateToClientEdit(String(client.id));
  }

  navigateToDiligence(client: Association) {
    this.navigationService.navigateToClientDiligenceResults(String(client.id));
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavigationService } from './../../services/navigation-service';
import { Client, ClientStatus } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { forkJoin } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { ClientPhysiqueListComponent } from './client-physique-list/client-physique-list.component';
import { ClientMoralListComponent } from './client-moral-list/client-moral-list.component';
import { AssociationListComponent } from './association-list/association-list.component';
import { InstitutionListComponent } from './institution-list/institution-list.component';
import { ClientCardComponent } from './client-card/client-card.component';


@Component({
  selector: 'app-crm',
  imports: [
    RouterModule, 
    CommonModule, 
    FormsModule, 
    ClientPhysiqueListComponent, 
    ClientMoralListComponent, 
    AssociationListComponent, 
    InstitutionListComponent,
    ClientCardComponent
  ],
  templateUrl: './crm.html',
  styleUrl: './crm.css'
})
export class Crm implements OnInit {
  
  activeTab: 'ALL' | 'PERSONNE' | 'SOCIETE' | 'ASSOCIATION' | 'INSTITUTION' = 'ALL';

  private readonly navigationService = inject(NavigationService);
  private readonly clientService = inject(ClientService);
  private readonly screeningMatchService = inject(ScreeningMatchService);

  private clientMatchesMap = new Map<number, any[]>();

  // Liste de contacts récupérée depuis le service
  clients: Client[] = [];
  filteredClients: Client[] = [];

  searchTerm: string = '';
  selectedType: string = '';
  selectedRisk: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 6;

  get totalPages(): number {
    return Math.ceil(this.filteredClients.length / this.pageSize);
  }

  get paginatedClients(): Client[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(startIndex, startIndex + this.pageSize);
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredClients.length);
  }

  get pages(): number[] {
    const list: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      list.push(i);
    }
    return list;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
  }

  get alertCount(): number {
    return this.clients.filter(c => c.clientStatus === ClientStatus.AML_REQUIRED).length;
  }

  constructor(private readonly router: Router) {

  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    forkJoin({
      clientsRes: this.clientService.findAll(0, 1000, 'createdAt,desc'),
      matchesRes: this.screeningMatchService.findAll(0, 1000)
    }).subscribe({
      next: ({ clientsRes, matchesRes }) => {
        this.clients = clientsRes.content || [];
        
        this.clientMatchesMap.clear();
        const matches = matchesRes.content || [];
        matches.forEach(match => {
          const clientId = match.clientEntityDTO?.id;
          if (clientId) {
            const list = this.clientMatchesMap.get(clientId) || [];
            list.push(match);
            this.clientMatchesMap.set(clientId, list);
          }
        });

        this.filteredClients = [...this.clients];
        this.filterClients();
      },
      error: (err) => {
        console.error('Error loading clients/matches', err);
      }
    });
  }

  getHighestScore(client: Client): number {
    if (!client.id) return 0;
    const clientMatches = this.clientMatchesMap.get(client.id) || [];
    if (clientMatches.length === 0) return 0;
    return Math.max(...clientMatches.map(m => m.score || 0));
  }

  filterClients() {
    this.currentPage = 1;
    const term = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';

    this.filteredClients = this.clients.filter(client => {
      let matchesSearch = true;
      if (term) {
        const displayName = this.getDisplayName(client).toLowerCase();
        const cin = ((client as any).cin || '').toLowerCase();
        const rc = ((client as any).numeroRegistreCommerce || '').toLowerCase();
        const rn = ((client as any).numeroRegistreNational || '').toLowerCase();
        const pays = (client.pays || '').toLowerCase();
        const paysResidance = (client.paysResidance || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const telephone = (client.telephone || '').toLowerCase();
        
        const matchesContacts = client.contacts && client.contacts.some(c => 
          (c.nom + ' ' + c.prenom).toLowerCase().includes(term) ||
          (c.email || '').toLowerCase().includes(term) ||
          (c.telephone || '').toLowerCase().includes(term)
        );

        matchesSearch = displayName.includes(term) ||
          cin.includes(term) ||
          rc.includes(term) ||
          rn.includes(term) ||
          pays.includes(term) ||
          paysResidance.includes(term) ||
          email.includes(term) ||
          telephone.includes(term) ||
          !!matchesContacts;
      }

      const matchesType = !this.selectedType || client.type === this.selectedType;

      let matchesRisk = true;
      if (this.selectedRisk) {
        const maxScore = this.getHighestScore(client);
        if (this.selectedRisk === 'ELEVEE') {
          matchesRisk = maxScore >= 0.7;
        } else if (this.selectedRisk === 'MOYEN') {
          matchesRisk = maxScore >= 0.4 && maxScore < 0.7;
        } else if (this.selectedRisk === 'FAIBLE') {
          matchesRisk = maxScore < 0.4;
        }
      }

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
    this.navigationService.navigateToClientDetails(String(client.id));
    // this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS], { queryParams: { id: client.id } });
  }

  navigateToReviewsAml() {
    // this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_REVIEWS_AML]);
  }

  navigateToNewClient() {
    switch (this.activeTab) {
      case 'PERSONNE':
        this.router.navigate(['/home/', ...NavigationService.NEW_PERSONNE.split('/')]);
        break;
      case 'SOCIETE':
        this.router.navigate(['/home/', ...NavigationService.NEW_SOCIETE.split('/')]);
        break;
      case 'ASSOCIATION':
        this.router.navigate(['/home/', ...NavigationService.NEW_ASSOCIATION.split('/')]);
        break;
      case 'INSTITUTION':
        this.router.navigate(['/home/', ...NavigationService.NEW_INSTITUTION.split('/')]);
        break;
      default:
        // Default to global or Personne
        this.router.navigate(['/home/', ...NavigationService.NEW_PERSONNE.split('/')]);
    }
  }


  navigateToClientDiligenceResults(clientId: number) {
    this.navigationService.navigateToClientDiligenceResults(String(clientId));
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case ClientStatus.AML_REQUIRED:
        return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.VERIFICATION_AML_REQUIRED:
        return 'bg-amber-100 text-amber-800';
      case ClientStatus.AML_VALIDATED:
        return 'bg-blue-100 text-blue-800';
      case ClientStatus.INDULGENCE_REQUIRED:
        return 'bg-orange-100 text-orange-800';
      case ClientStatus.VALIDATED:
        return 'bg-green-100 text-green-800';
      case ClientStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getClientTypeIcon(type: string | undefined): string {
    switch (type) {
      case 'PERSONNE': return 'user';
      case 'SOCIETE': return 'briefcase';
      case 'ASSOCIATION': return 'users';
      case 'INSTITUTION': return 'landmark';
      default: return 'help-circle';
    }
  }

  getClientSpecificInfo(client: any): string {
    if (client.type === 'PERSONNE') return client.cin ? `CIN: ${client.cin}` : '';
    if (client.type === 'SOCIETE') return client.numeroRegistreCommerce ? `RC: ${client.numeroRegistreCommerce}` : '';
    if (client.type === 'ASSOCIATION' || client.type === 'INSTITUTION') return client.numeroRegistreNational ? `RN: ${client.numeroRegistreNational}` : '';
    return '';
  }
}


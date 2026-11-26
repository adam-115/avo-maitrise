import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavigationService } from './../../services/navigation-service';
import { Client, ClientStatus } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { PersonnePhysiqueService } from '../../services/personne-physique.service';
import { ClientMoralService } from '../../services/client-moral.service';
import { AssociationService } from '../../services/association.service';
import { InstitutionService } from '../../services/institution.service';
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
import { TranslatePipe } from '@ngx-translate/core';


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
    ClientCardComponent,
    TranslatePipe
  ],
  templateUrl: './crm.html',
  styleUrl: './crm.css'
})
export class Crm implements OnInit {
  
  activeTab: 'ALL' | 'PERSONNE' | 'SOCIETE' | 'ASSOCIATION' | 'INSTITUTION' = 'ALL';
  loading = true;
  viewMode: 'grid' | 'table' = 'grid';

  private readonly navigationService = inject(NavigationService);
  private readonly clientService = inject(ClientService);
  private readonly personneService = inject(PersonnePhysiqueService);
  private readonly clientMoralService = inject(ClientMoralService);
  private readonly associationService = inject(AssociationService);
  private readonly institutionService = inject(InstitutionService);
  private readonly screeningMatchService = inject(ScreeningMatchService);

  private clientMatchesMap = new Map<number, any[]>();

  // Liste de contacts récupérée depuis le service
  clients: Client[] = [];
  totalElements = 0;
  personneCount = 0;
  societeCount = 0;
  associationCount = 0;
  institutionCount = 0;

  searchTerm: string = '';
  selectedType: string = '';
  selectedRisk: string = '';

  get isFiltered(): boolean {
    return !!(this.searchTerm || this.selectedType || this.selectedRisk);
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedRisk = '';
    this.filterClients();
  }

  // Pagination
  currentPage = 1;
  pageSize = 6;

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  get paginatedClients(): Client[] {
    return this.clients;
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  get pages(): number[] {
    const list: number[] = [];
    const total = this.totalPages;
    
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, this.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadClients();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadClients();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadClients();
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
    this.loadCounts();
  }

  loadCounts() {
    forkJoin({
      personnes: this.personneService.findAll(0, 1),
      societes: this.clientMoralService.findAll(0, 1),
      associations: this.associationService.findAll(0, 1),
      institutions: this.institutionService.findAll(0, 1)
    }).subscribe({
      next: ({ personnes, societes, associations, institutions }) => {
        this.personneCount = personnes?.totalElements || 0;
        this.societeCount = societes?.totalElements || 0;
        this.associationCount = associations?.totalElements || 0;
        this.institutionCount = institutions?.totalElements || 0;
      },
      error: (err) => console.error('Error loading type counts', err)
    });
  }

  navigateToConformity(client: Client) {
    if (client && client.id) {
      this.navigationService.navigateToClientConformity(String(client.id));
    }
  }

  navigateToEdit(client: Client) {
    if (client && client.id) {
      this.navigationService.navigateToClientEdit(String(client.id));
    }
  }

  loadClients() {
    this.loading = true;

    const tableFilters = {
      searchTerm: this.searchTerm,
      type: this.selectedType,
      risk: this.selectedRisk
    };

    forkJoin({
      clientsRes: this.clientService.findAll(this.currentPage - 1, this.pageSize, 'createdAt,desc', tableFilters),
      matchesRes: this.screeningMatchService.findAll(0, 1000)
    }).subscribe({
      next: ({ clientsRes, matchesRes }) => {
        this.clients = clientsRes.content || [];
        this.totalElements = clientsRes.totalElements;
        
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

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clients', err);
        this.loading = false;
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
    this.loadClients();
  }


  viewAmlDetails(client: any) {
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_CONFORMITY], { queryParams: { id: client.id } });
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


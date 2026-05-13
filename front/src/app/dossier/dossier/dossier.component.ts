import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { UserService } from '../../services/user.service';
import { Dossier as DossierModel, Client, StatutDossier, DossierPriorite, User } from '../../appTypes';
import { forkJoin } from 'rxjs';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.css'
})
export class DossierComponent implements OnInit {
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private priorityService = inject(DossierPrioriteService);
  private statusService = inject(StatutDossierService);
  private userService = inject(UserService);
  private router = inject(Router);

  dossiers: DossierModel[] = [];
  clients: Client[] = [];
  statuses: StatutDossier[] = [];
  priorities: DossierPriorite[] = [];
  users: User[] = [];

  navigationService = inject(NavigationService);



  activeDossiersCount = 0;
  urgentDossiersCount = 0;

  // TODO: Add services for time tracking and billing to calculate these
  unbilledHours = 124;
  successRate = 11;

  searchTerm: string = '';
  statusFilter: string = 'Tous';
  lawyerFilter: string = 'Tous';

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      dossiers: this.dossierService.getAll(),
      clients: this.clientService.getAll(),
      statuses: this.statusService.getAll(),
      priorities: this.priorityService.getAll(),
      users: this.userService.getAll()
    }).subscribe(({ dossiers, clients, statuses, priorities, users }) => {
      this.dossiers = (dossiers as PaginatedResponse<DossierModel>).content;
      this.clients = (clients as PaginatedResponse<Client>).content;
      this.statuses = (statuses as PaginatedResponse<StatutDossier>).content;
      this.priorities = (priorities as PaginatedResponse<DossierPriorite>).content;
      this.users = (users as PaginatedResponse<User>).content;

      this.calculateKPIs();
    });
  }

  calculateKPIs(): void {
    // Assuming 'OUVERT' and 'EN_COURS' are active statuses code or we can check active boolean if available and mapped
    // specialized logic might be needed depending on how "Active" is defined in StatutDossier
    // For now, let's assume active dossiers are those that are not 'CLOS' or 'ARCHIVE'
    this.activeDossiersCount = this.dossiers.length; // Placeholder logic, refine based on actual status codes

    // Count urgent dossiers
    this.urgentDossiersCount = this.dossiers.filter(d => {
      const priority = this.getPriority(d.prioriteID);
      return priority && (priority.code === 'URGENT' || priority.label.toUpperCase() === 'URGENT');
    }).length;
  }

  getClientName(clientId: string | number): string {
    const client = this.clients.find(c => c.id == clientId) as any;
    return client ? (client.nom || client.nomCommercial || client.prenom || 'Client Inconnu') : 'Client Inconnu';
  }

  getResponsableName(userId: string): string {
    const user = this.users.find(u => u.id == userId);
    return user ? user.username : 'Non assigné';
  }

  getStatus(statusId: string | number): StatutDossier | undefined {
    return this.statuses.find(s => s.id == statusId);
  }

  getPriority(priorityId: string | number): DossierPriorite | undefined {
    return this.priorities.find(p => p.id == priorityId);
  }

  nviagteToDossierForm() {
    this.router.navigateByUrl('/home/dossier-form');
  }

  navigateToDossierDetail(id: string) {

    this.navigationService.navigateToDossierDetails(id);
  }
}

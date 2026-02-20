import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { MatterStatusService } from '../../services/statut-dossier.service';
import { UserService } from '../../services/user.service';
import { Dossier as DossierModel, Client, StatutDossier, DossierPriorite, User } from '../../appTypes';
import { forkJoin } from 'rxjs';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier.html',
  styleUrl: './dossier.css'
})
export class Dossier implements OnInit {
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

  constructor(
    private readonly router: Router,
    private dossierService: DossierService,
    private clientService: ClientService,
    private priorityService: DossierPrioriteService,
    private statusService: MatterStatusService,
    private userService: UserService
  ) { }

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
      this.dossiers = dossiers;
      this.clients = clients;
      this.statuses = statuses;
      this.priorities = priorities;
      this.users = users;

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
    const client = this.clients.find(c => c.id == clientId);
    return client ? (client.nom || client.prenom || 'Client Inconnu') : 'Client Inconnu';
  }

  getResponsableName(userId: string): string {
    const user = this.users.find(u => u.id == userId);
    return user ? user.username : 'Non assigné';
  }

  getStatus(statusId: string): StatutDossier | undefined {
    return this.statuses.find(s => s.id == statusId);
  }

  getPriority(priorityId: string): DossierPriorite | undefined {
    return this.priorities.find(p => p.id == priorityId);
  }

  nviagteToDossierForm() {
    this.router.navigateByUrl('/home/dossier-form');
  }

  navigateToDossierDetail(id: string) {

    this.navigationService.navigateToDossierDetails(id);
  }
}

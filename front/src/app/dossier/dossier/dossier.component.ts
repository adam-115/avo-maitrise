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
  createdThisMonthCount = 0;
  closedThisMonthCount = 0;
  closureRate = 0;

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
    const now = new Date("2026-05-17");
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Active dossiers count (not CLOS / ARCHIVE)
    this.activeDossiersCount = this.dossiers.filter(d => {
      const status = this.getStatus(d.statutID);
      if (!status) return true;
      const code = (status.code || '').toUpperCase();
      return code !== 'CLOS' && code !== 'TERMINE' && code !== 'ARCHIVE';
    }).length;

    // 2. Count urgent dossiers
    this.urgentDossiersCount = this.dossiers.filter(d => {
      const priority = this.getPriority(d.prioriteID);
      return priority && (priority.code === 'URGENT' || priority.label.toUpperCase() === 'URGENT');
    }).length;

    // 3. Count created this month using dateOuverture
    this.createdThisMonthCount = this.dossiers.filter(d => {
      if (!d.dateOuverture) return false;
      const date = new Date(d.dateOuverture);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // 4. Count closed this month using dateCloture
    this.closedThisMonthCount = this.dossiers.filter(d => {
      if (!d.dateCloture) return false;
      const date = new Date(d.dateCloture);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // 5. Closure rate calculation
    const totalThisMonth = this.createdThisMonthCount + this.closedThisMonthCount;
    this.closureRate = totalThisMonth > 0 ? Math.round((this.closedThisMonthCount / totalThisMonth) * 100) : 75; // 75% default baseline representation
  }

  getClientName(clientId: string | number): string {
    const client = this.clients.find(c => c.id == clientId) as any;
    return client ? (client.nom || client.nomCommercial || client.prenom || 'Client Inconnu') : 'Client Inconnu';
  }

  getResponsableName(userOrId: any): string {
    if (!userOrId) return 'Non assigné';
    if (typeof userOrId === 'object' && userOrId.username) return userOrId.username;
    const user = this.users.find(u => String(u.id) === String(userOrId));
    return user ? user.username : 'Non assigné';
  }

  getStatus(statusOrId: any): StatutDossier | undefined {
    if (!statusOrId) return undefined;
    if (typeof statusOrId === 'object' && statusOrId.id) return statusOrId;
    return this.statuses.find(s => String(s.id) === String(statusOrId));
  }

  getPriority(priorityOrId: any): DossierPriorite | undefined {
    if (!priorityOrId) return undefined;
    if (typeof priorityOrId === 'object' && priorityOrId.id) return priorityOrId;
    return this.priorities.find(p => String(p.id) === String(priorityOrId));
  }

  nviagteToDossierForm() {
    this.router.navigateByUrl('/home/dossier-form');
  }

  navigateToDossierDetail(id: string) {

    this.navigationService.navigateToDossierDetails(id);
  }
}
